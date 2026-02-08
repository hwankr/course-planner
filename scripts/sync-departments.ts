/**
 * Department Sync Script
 * Reads all DepartmentRequirement entries and creates corresponding Department entries
 *
 * Purpose: Sync the 93 departments from DepartmentRequirement to Department collection
 *
 * Usage: npm run seed:sync-dept
 */

import './env';
import mongoose from 'mongoose';
import { connectDB } from '../src/lib/db/mongoose';
import Department from '../src/models/Department';
import DepartmentRequirement from '../src/models/DepartmentRequirement';

interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

// Generate department code from college name
function generateDeptCode(college: string, index: number): string {
  // Extract first 2 Korean characters from college name
  const prefix = college.slice(0, 2);
  // Pad index to 3 digits
  const suffix = String(index).padStart(3, '0');
  return `${prefix}${suffix}`;
}

// Check if code already exists
async function isCodeUnique(code: string): Promise<boolean> {
  const existing = await Department.findOne({ code });
  return !existing;
}

// Generate unique code (with suffix if needed)
async function generateUniqueCode(college: string, index: number): Promise<string> {
  let code = generateDeptCode(college, index);
  let suffix = 0;

  while (!(await isCodeUnique(code))) {
    suffix++;
    code = `${generateDeptCode(college, index)}_${suffix}`;
  }

  return code;
}

// Find existing department by name (exact or partial match)
async function findExistingDepartment(departmentName: string) {
  // Try exact match first
  let dept = await Department.findOne({ name: departmentName });
  if (dept) return dept;

  // Try partial match (for cases like "소프트웨어융합전공")
  dept = await Department.findOne({
    name: { $regex: departmentName, $options: 'i' }
  });
  if (dept) return dept;

  // Try reverse partial match (departmentName contains existing name)
  const allDepts = await Department.find({});
  for (const d of allDepts) {
    if (departmentName.includes(d.name) || d.name.includes(departmentName)) {
      return d;
    }
  }

  return null;
}

async function syncDepartments(): Promise<SyncStats> {
  const stats: SyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log('📋 DepartmentRequirement 데이터 불러오는 중...\n');
  const deptRequirements = await DepartmentRequirement.find({}).sort({ college: 1, departmentName: 1 });

  console.log(`총 ${deptRequirements.length}개의 DepartmentRequirement 항목 발견\n`);

  // Group by college for index generation
  const collegeIndexMap = new Map<string, number>();

  for (const deptReq of deptRequirements) {
    const { college, departmentName } = deptReq;

    try {
      // Find existing department
      const existingDept = await findExistingDepartment(departmentName);

      if (existingDept) {
        // Update college field if missing or different
        if (!existingDept.college || existingDept.college !== college) {
          existingDept.college = college;
          await existingDept.save();
          console.log(`  ✓ 업데이트: ${departmentName} (${existingDept.code}) - college: ${college}`);
          stats.updated++;
        } else {
          console.log(`  - 건너뜀: ${departmentName} (${existingDept.code}) - 이미 존재`);
          stats.skipped++;
        }
      } else {
        // Create new department
        // Get next index for this college
        const currentIndex = collegeIndexMap.get(college) || 1;
        collegeIndexMap.set(college, currentIndex + 1);

        const code = await generateUniqueCode(college, currentIndex);

        await Department.create({
          code,
          name: departmentName,
          college,
          isActive: true,
        });

        console.log(`  ✓ 생성: ${departmentName} (${code}) - ${college}`);
        stats.created++;
      }
    } catch (error) {
      console.error(`  ✗ 오류: ${departmentName} - ${error}`);
      stats.errors++;
    }
  }

  return stats;
}

async function main() {
  try {
    console.log('🚀 Department 동기화 스크립트 시작\n');

    // Connect to database
    await connectDB();

    // Sync departments
    const stats = await syncDepartments();

    console.log('\n📊 동기화 완료:');
    console.log(`  - 생성됨: ${stats.created}개`);
    console.log(`  - 업데이트됨: ${stats.updated}개`);
    console.log(`  - 건너뜀: ${stats.skipped}개`);
    console.log(`  - 오류: ${stats.errors}개`);
    console.log(`  - 총 처리: ${stats.created + stats.updated + stats.skipped + stats.errors}개`);

    if (stats.errors > 0) {
      console.log('\n⚠️  일부 항목 처리 중 오류 발생');
    } else {
      console.log('\n🎉 모든 Department 동기화 완료!');
    }
  } catch (error) {
    console.error('\n❌ 동기화 실행 중 오류 발생:', error);
    process.exit(1);
  } finally {
    // Disconnect from database
    await mongoose.disconnect();
    console.log('\n🔌 MongoDB 연결 종료');
  }
}

// Run the sync script
main();
