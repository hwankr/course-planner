/**
 * Curriculum Import Script
 * 90개 CSV 파일에서 학과별 커리큘럼을 MongoDB로 임포트
 *
 * - Idempotent: 재실행 안전 (bulkWrite + upsert)
 * - Phase 1: CSV 파싱
 * - Phase 2: Department 생성/업데이트
 * - Phase 3: Course 생성/업데이트 (중복 제거)
 * - Phase 4: DepartmentCurriculum 생성
 * - Phase 5: 구 시드 데이터 비활성화
 * - Phase 6: 검증 리포트
 *
 * Usage: npx tsx scripts/seed-curriculum.ts
 */

import './env';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db/mongoose';
import Department from '../src/models/Department';
import Course from '../src/models/Course';
import DepartmentCurriculum from '../src/models/DepartmentCurriculum';

// ============================================
// Types
// ============================================

type SemesterType = 'spring' | 'fall';

interface ParsedCourse {
  code: string;
  name: string;
  credits: number;
  allSemesters: Set<SemesterType>;
}

interface DeptEntry {
  college: string;
  deptName: string;
  courseCode: string;
  courseName: string;
  credits: number;
  category: string;
  year: number;
  semester: SemesterType;
}

interface DeptInfo {
  college: string;
  deptName: string;
  code: string;
}

// ============================================
// Constants
// ============================================

const CATEGORY_MAP: Record<string, string> = {
  '교양필수': 'general_required',
  '전공핵심': 'major_required',
  '전공선택': 'major_elective',
  '전공필수': 'major_compulsory',
  '교직': 'teaching',
};

// Prefixes that are shared across departments (not department-specific)
const SHARED_PREFIXES = new Set(['U', 'T']);

const CURRICULUM_DIR = path.resolve(__dirname, '..', 'curriculum');
const BATCH_SIZE = 500;

// ============================================
// Tracking
// ============================================

const errors: string[] = [];
const warnings: string[] = [];
let skippedDuplicates = 0;
let rejectedRecords = 0;

// ============================================
// Parsing Helpers
// ============================================

/**
 * Parse year/semester from string like "1학년/1학기"
 */
function parseYearSemester(raw: string): { year: number; semester: SemesterType } | null {
  const match = raw.match(/(\d+)학년\/(\d+)학기/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const semNum = parseInt(match[2], 10);
  const semester: SemesterType = semNum === 1 ? 'spring' : 'fall';

  return { year, semester };
}

/**
 * Parse credits from string like "3(3)" or "1(1.5)" or "10(10)"
 */
function parseCredits(raw: string): number | null {
  const match = raw.match(/^(\d+)\(/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/**
 * Parse department name from CSV filename.
 * "인문대학_국어국문학과.csv" -> { college: "인문대학", deptName: "국어국문학과" }
 * "공과대학_건축학부-건축공학전공.csv" -> { college: "공과대학", deptName: "건축학부 건축공학전공" }
 * "공과대학_화학공학부-고분자(바이오소재전공).csv" -> { college: "공과대학", deptName: "화학공학부 고분자(바이오소재전공)" }
 */
function parseDeptFromFilename(filePath: string): { college: string; deptName: string } | null {
  const basename = path.basename(filePath, '.csv');
  const underscoreIdx = basename.indexOf('_');
  if (underscoreIdx === -1) return null;

  const college = basename.substring(0, underscoreIdx);
  const rawDeptName = basename.substring(underscoreIdx + 1);
  // Replace hyphens with spaces for subdivisions
  const deptName = rawDeptName.replace(/-/g, ' ');

  return { college, deptName };
}

/**
 * Strip BOM from string if present
 */
function stripBOM(str: string): string {
  if (str.charCodeAt(0) === 0xfeff) {
    return str.slice(1);
  }
  return str;
}

/**
 * Extract a course code prefix (the alphabetic part).
 * "CIV153" -> "CIV", "U00645" -> "U", "T00023" -> "T", "KOE013" -> "KOE"
 */
function extractPrefix(code: string): string {
  const match = code.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : '';
}

// ============================================
// Phase 1: Parse All CSVs
// ============================================

function parseAllCSVs(): {
  courseMap: Map<string, ParsedCourse>;
  deptEntries: DeptEntry[];
  deptCoursePrefixes: Map<string, Map<string, number>>;
} {
  console.log('\n📂 Phase 1: CSV 파일 파싱 중...\n');

  const courseMap = new Map<string, ParsedCourse>();
  const deptEntries: DeptEntry[] = [];
  // Track course code prefixes per department for code generation
  // deptKey -> prefix -> count
  const deptCoursePrefixes = new Map<string, Map<string, number>>();

  // Find all CSV files under curriculum/
  const colleges = fs.readdirSync(CURRICULUM_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let totalFiles = 0;
  let totalRecords = 0;

  for (const collegeDirName of colleges) {
    const collegeDir = path.join(CURRICULUM_DIR, collegeDirName);
    const csvFiles = fs.readdirSync(collegeDir)
      .filter(f => f.endsWith('.csv'));

    for (const csvFile of csvFiles) {
      const filePath = path.join(collegeDir, csvFile);
      totalFiles++;

      const deptInfo = parseDeptFromFilename(filePath);
      if (!deptInfo) {
        errors.push(`파일명 파싱 실패: ${csvFile}`);
        continue;
      }

      const { college, deptName } = deptInfo;
      const deptKey = `${college}::${deptName}`;

      // Track seen (courseCode, semester) tuples for duplicate detection within this CSV
      const seenInFile = new Set<string>();

      // Read and parse CSV
      const rawContent = fs.readFileSync(filePath, 'utf-8');
      const content = stripBOM(rawContent);
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // CSV fields: 학년/학기,구분,학수번호,교과목명,학점(시간)
        // Handle potential commas in course names by splitting carefully
        // The format is fixed: 5 fields, and course names don't contain commas in this dataset
        const fields = line.split(',');
        if (fields.length < 5) {
          errors.push(`잘못된 CSV 행 (${csvFile}:${i + 1}): ${line}`);
          rejectedRecords++;
          continue;
        }

        const rawYearSemester = fields[0].trim();
        const rawCategory = fields[1].trim();
        const courseCode = fields[2].trim().toUpperCase();
        const courseName = fields[3].trim();
        // Credits field may contain trailing data after the last comma in edge cases
        // Rejoin remaining fields in case course name had commas
        const rawCredits = fields[fields.length - 1].trim();

        // Parse year/semester
        const parsed = parseYearSemester(rawYearSemester);
        if (!parsed) {
          errors.push(`학년/학기 파싱 실패 (${csvFile}:${i + 1}): "${rawYearSemester}"`);
          rejectedRecords++;
          continue;
        }
        const { year, semester } = parsed;

        // Parse credits
        const credits = parseCredits(rawCredits);
        if (credits === null) {
          errors.push(`학점 파싱 실패 (${csvFile}:${i + 1}): "${rawCredits}"`);
          rejectedRecords++;
          continue;
        }

        // Map category
        const category = CATEGORY_MAP[rawCategory];
        if (!category) {
          errors.push(`알 수 없는 이수구분 (${csvFile}:${i + 1}): "${rawCategory}"`);
          rejectedRecords++;
          continue;
        }

        // Duplicate detection within same CSV: same code + same semester -> skip
        const dupeKey = `${courseCode}::${semester}`;
        if (seenInFile.has(dupeKey)) {
          warnings.push(`중복 건너뜀 (${csvFile}): ${courseCode} in ${year}학년/${semester === 'spring' ? '1' : '2'}학기`);
          skippedDuplicates++;
          continue;
        }
        seenInFile.add(dupeKey);

        // Update global course map
        if (courseMap.has(courseCode)) {
          const existing = courseMap.get(courseCode)!;
          existing.allSemesters.add(semester);
          // Update name/credits if needed (keep first seen, they should be consistent)
        } else {
          courseMap.set(courseCode, {
            code: courseCode,
            name: courseName,
            credits,
            allSemesters: new Set([semester]),
          });
        }

        // Add dept entry
        deptEntries.push({
          college,
          deptName,
          courseCode,
          courseName,
          credits,
          category,
          year,
          semester,
        });
        totalRecords++;

        // Track prefix for department code generation
        const prefix = extractPrefix(courseCode);
        if (prefix && !SHARED_PREFIXES.has(prefix)) {
          if (!deptCoursePrefixes.has(deptKey)) {
            deptCoursePrefixes.set(deptKey, new Map());
          }
          const prefixMap = deptCoursePrefixes.get(deptKey)!;
          prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
        }
      }

      console.log(`  📄 ${csvFile} -> ${deptName} (${college})`);
    }
  }

  console.log(`\n  ✅ ${totalFiles}개 파일, ${totalRecords}개 레코드 파싱 완료`);
  console.log(`  📊 고유 과목 수: ${courseMap.size}개`);
  console.log(`  📊 학과-과목 매핑: ${deptEntries.length}개`);
  if (skippedDuplicates > 0) {
    console.log(`  ⚠️  중복 건너뜀: ${skippedDuplicates}건`);
  }
  if (rejectedRecords > 0) {
    console.log(`  ❌ 거부된 레코드: ${rejectedRecords}건`);
  }

  return { courseMap, deptEntries, deptCoursePrefixes };
}

// ============================================
// Phase 2: Create/Update Departments
// ============================================

/**
 * Generate a department code from course code prefixes.
 * Uses the most frequent non-shared prefix found in that department's courses.
 */
function generateDeptCode(
  deptKey: string,
  deptCoursePrefixes: Map<string, Map<string, number>>,
  usedCodes: Set<string>,
): string {
  const prefixMap = deptCoursePrefixes.get(deptKey);

  if (prefixMap && prefixMap.size > 0) {
    // Sort by frequency descending, pick the most common
    const sorted = [...prefixMap.entries()].sort((a, b) => b[1] - a[1]);
    const bestPrefix = sorted[0][0];

    if (!usedCodes.has(bestPrefix)) {
      usedCodes.add(bestPrefix);
      return bestPrefix;
    }

    // If best prefix already used, try others
    for (const [prefix] of sorted) {
      if (!usedCodes.has(prefix)) {
        usedCodes.add(prefix);
        return prefix;
      }
    }

    // All prefixes used - append a number
    let counter = 2;
    while (usedCodes.has(`${bestPrefix}${counter}`)) {
      counter++;
    }
    const code = `${bestPrefix}${counter}`;
    usedCodes.add(code);
    return code;
  }

  // Fallback: generate from department name (extract college dir + sequence)
  const parts = deptKey.split('::');
  const deptName = parts[1] || parts[0];
  // Take first few consonants or letters
  let fallback = 'DEPT';
  let counter = 1;
  while (usedCodes.has(`${fallback}${counter}`)) {
    counter++;
  }
  fallback = `${fallback}${counter}`;
  usedCodes.add(fallback);
  warnings.push(`학과코드 자동생성 (${deptName}): ${fallback}`);
  return fallback;
}

async function createDepartments(
  deptEntries: DeptEntry[],
  deptCoursePrefixes: Map<string, Map<string, number>>,
): Promise<Map<string, mongoose.Types.ObjectId>> {
  console.log('\n📚 Phase 2: Department 생성/업데이트 중...\n');

  // Collect unique departments
  const uniqueDepts = new Map<string, { college: string; deptName: string }>();
  for (const entry of deptEntries) {
    const key = `${entry.college}::${entry.deptName}`;
    if (!uniqueDepts.has(key)) {
      uniqueDepts.set(key, { college: entry.college, deptName: entry.deptName });
    }
  }

  // Generate codes
  const usedCodes = new Set<string>();
  const deptInfos: DeptInfo[] = [];

  for (const [key, { college, deptName }] of uniqueDepts) {
    const code = generateDeptCode(key, deptCoursePrefixes, usedCodes);
    deptInfos.push({ college, deptName, code });
  }

  // BulkWrite with upsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = deptInfos.map(dept => ({
    updateOne: {
      filter: { code: dept.code },
      update: {
        $set: {
          name: dept.deptName,
          college: dept.college,
          isActive: true,
        },
        $setOnInsert: {
          code: dept.code,
        },
      },
      upsert: true,
    },
  }));

  if (ops.length > 0) {
    const result = await Department.bulkWrite(ops);
    console.log(`  ✅ Department bulkWrite: ${result.upsertedCount}개 생성, ${result.modifiedCount}개 업데이트`);
  }

  // Build name -> ObjectId map by re-fetching
  const allDepts = await Department.find({ code: { $in: deptInfos.map(d => d.code) } }).lean();
  const deptMap = new Map<string, mongoose.Types.ObjectId>();

  for (const dept of allDepts) {
    // Map by "college::deptName" key
    const key = `${dept.college}::${dept.name}`;
    deptMap.set(key, dept._id as mongoose.Types.ObjectId);
  }

  // Log departments
  for (const info of deptInfos) {
    console.log(`  📌 ${info.code} - ${info.deptName} (${info.college})`);
  }
  console.log(`\n  ✅ 총 ${uniqueDepts.size}개 학과 처리 완료`);

  return deptMap;
}

// ============================================
// Phase 3: Create/Update Courses (Deduplicated)
// ============================================

async function createCourses(
  courseMap: Map<string, ParsedCourse>,
): Promise<Map<string, mongoose.Types.ObjectId>> {
  console.log('\n📖 Phase 3: Course 생성/업데이트 중...\n');

  const entries = [...courseMap.values()];
  const codeToId = new Map<string, mongoose.Types.ObjectId>();

  // Process in batches
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = batch.map(course => ({
      updateOne: {
        filter: { code: course.code, createdBy: null },
        update: {
          $set: {
            name: course.name,
            credits: course.credits,
            semesters: [...course.allSemesters],
            isActive: true,
          },
          $setOnInsert: {
            code: course.code,
            createdBy: null,
            prerequisites: [],
          },
        },
        upsert: true,
      },
    }));

    const result = await Course.bulkWrite(ops);
    console.log(`  배치 ${Math.floor(i / BATCH_SIZE) + 1}: ${result.upsertedCount}개 생성, ${result.modifiedCount}개 업데이트`);
  }

  // Fetch all seed courses to build code -> id map
  const allCodes = entries.map(c => c.code);
  const allCourses = await Course.find({
    code: { $in: allCodes },
    createdBy: null,
  }).lean();

  for (const course of allCourses) {
    codeToId.set(course.code, course._id as mongoose.Types.ObjectId);
  }

  console.log(`\n  ✅ 총 ${courseMap.size}개 고유 과목 처리 완료 (DB: ${allCourses.length}개)`);

  return codeToId;
}

// ============================================
// Phase 4: Create DepartmentCurriculum Entries
// ============================================

async function createDepartmentCurriculum(
  deptEntries: DeptEntry[],
  deptMap: Map<string, mongoose.Types.ObjectId>,
  courseIdMap: Map<string, mongoose.Types.ObjectId>,
): Promise<number> {
  console.log('\n📋 Phase 4: DepartmentCurriculum 생성 중...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Process in batches
  for (let i = 0; i < deptEntries.length; i += BATCH_SIZE) {
    const batch = deptEntries.slice(i, i + BATCH_SIZE);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [];

    for (const entry of batch) {
      const deptKey = `${entry.college}::${entry.deptName}`;
      const deptId = deptMap.get(deptKey);
      const courseId = courseIdMap.get(entry.courseCode);

      if (!deptId) {
        warnings.push(`Department 미발견: ${deptKey}`);
        skipped++;
        continue;
      }
      if (!courseId) {
        warnings.push(`Course 미발견: ${entry.courseCode}`);
        skipped++;
        continue;
      }

      ops.push({
        updateOne: {
          filter: {
            department: deptId,
            course: courseId,
            recommendedSemester: entry.semester,
          },
          update: {
            $set: {
              category: entry.category,
              recommendedYear: entry.year,
              recommendedSemester: entry.semester,
            },
            $setOnInsert: {
              department: deptId,
              course: courseId,
            },
          },
          upsert: true,
        },
      });
    }

    if (ops.length > 0) {
      const result = await DepartmentCurriculum.bulkWrite(ops);
      created += result.upsertedCount;
      updated += result.modifiedCount;
    }

    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(deptEntries.length / BATCH_SIZE);
    console.log(`  배치 ${batchNum}/${totalBatches} 처리 완료`);
  }

  console.log(`\n  ✅ DepartmentCurriculum: ${created}개 생성, ${updated}개 업데이트, ${skipped}개 건너뜀`);
  return created + updated;
}

// ============================================
// Phase 5: Soft-delete Old Seed Data
// ============================================

async function softDeleteOldSeedData(): Promise<void> {
  console.log('\n🧹 Phase 5: 구 시드 데이터 비활성화 중...\n');

  // Soft-delete ALL departments that have no DepartmentCurriculum entries
  const deptIdsWithCurriculum = await DepartmentCurriculum.distinct('department');
  const deptResult = await Department.updateMany(
    { _id: { $nin: deptIdsWithCurriculum }, isActive: true },
    { $set: { isActive: false } },
  );
  console.log(`  📌 Department 비활성화: ${deptResult.modifiedCount}개 (커리큘럼 미연결)`);

  // Soft-delete old seed courses (codes starting with GEN1 or SWE, with createdBy=null)
  const courseResult = await Course.updateMany(
    {
      createdBy: null,
      $or: [
        { code: { $regex: /^GEN1/ } },
        { code: { $regex: /^SWE/ } },
      ],
    },
    { $set: { isActive: false } },
  );
  console.log(`  📌 Course 비활성화: ${courseResult.modifiedCount}개 (GEN1*, SWE*)`);
}

// ============================================
// Phase 6: Validation Report
// ============================================

function printReport(
  courseMap: Map<string, ParsedCourse>,
  deptEntries: DeptEntry[],
  deptCount: number,
  curriculumCount: number,
): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 커리큘럼 임포트 결과 리포트');
  console.log('='.repeat(60));

  console.log(`\n  ✅ Departments 생성/업데이트: ${deptCount}개`);
  console.log(`  ✅ Courses 생성/업데이트:     ${courseMap.size}개`);
  console.log(`  ✅ DepartmentCurriculum:       ${curriculumCount}개`);

  if (skippedDuplicates > 0) {
    console.log(`\n  ⚠️  건너뛴 중복: ${skippedDuplicates}건`);
  }
  if (rejectedRecords > 0) {
    console.log(`  ❌ 거부된 레코드: ${rejectedRecords}건`);
  }

  if (errors.length > 0) {
    console.log(`\n  ❌ 에러 (${errors.length}건):`);
    for (const err of errors.slice(0, 20)) {
      console.log(`     - ${err}`);
    }
    if (errors.length > 20) {
      console.log(`     ... 외 ${errors.length - 20}건`);
    }
  }

  if (warnings.length > 0) {
    console.log(`\n  ⚠️  경고 (${warnings.length}건):`);
    for (const warn of warnings.slice(0, 20)) {
      console.log(`     - ${warn}`);
    }
    if (warnings.length > 20) {
      console.log(`     ... 외 ${warnings.length - 20}건`);
    }
  }

  console.log('\n' + '='.repeat(60));
}

// ============================================
// Main
// ============================================

async function main() {
  try {
    console.log('🚀 커리큘럼 임포트 스크립트 시작');
    console.log(`📍 커리큘럼 디렉토리: ${CURRICULUM_DIR}`);

    // Verify curriculum directory exists
    if (!fs.existsSync(CURRICULUM_DIR)) {
      throw new Error(`커리큘럼 디렉토리가 존재하지 않습니다: ${CURRICULUM_DIR}`);
    }

    // Connect to database
    await connectDB();

    // Phase 1: Parse all CSVs
    const { courseMap, deptEntries, deptCoursePrefixes } = parseAllCSVs();

    if (deptEntries.length === 0) {
      console.log('\n⚠️  파싱된 레코드가 없습니다. 종료합니다.');
      return;
    }

    // Phase 2: Create/Update Departments
    const deptMap = await createDepartments(deptEntries, deptCoursePrefixes);

    // Phase 3: Create/Update Courses
    const courseIdMap = await createCourses(courseMap);

    // Phase 4: Create DepartmentCurriculum entries
    const curriculumCount = await createDepartmentCurriculum(deptEntries, deptMap, courseIdMap);

    // Phase 5: Soft-delete old seed data
    await softDeleteOldSeedData();

    // Phase 6: Validation Report
    const uniqueDeptCount = new Set(
      deptEntries.map(e => `${e.college}::${e.deptName}`)
    ).size;
    printReport(courseMap, deptEntries, uniqueDeptCount, curriculumCount);

    console.log('\n🎉 커리큘럼 임포트 완료!');
  } catch (error) {
    console.error('\n❌ 임포트 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

// Run
main();
