/**
 * DepartmentRequirement Service (학과 졸업요건 기준표 조회)
 * @api-separable
 * @service departmentRequirementService
 * @migration-notes Express 변환 시 그대로 이동
 */

import { connectDB } from '@/lib/db/mongoose';
import DepartmentRequirement from '@/models/DepartmentRequirement';
import type { IDepartmentRequirementDocument } from '@/models/DepartmentRequirement';
import type { MajorType } from '@/types';

/** 특정 학과의 졸업요건 기준표 조회 (fallback matching 지원) */
async function findByDepartmentName(
  college: string,
  departmentName: string,
  year?: number
): Promise<IDepartmentRequirementDocument | null> {
  await connectDB();

  const yearFilter = year ? { year } : {};

  // 1. Exact match (college + departmentName + year)
  let doc = await DepartmentRequirement.findOne({ college, departmentName, ...yearFilter }).lean();
  if (doc) return doc;

  // 2. Match by departmentName only (ignore college mismatch)
  doc = await DepartmentRequirement.findOne({ departmentName, ...yearFilter }).lean();
  if (doc) return doc;

  // 3. Partial match: departmentName contains the search term
  const escaped = departmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  doc = await DepartmentRequirement.findOne({
    departmentName: { $regex: escaped, $options: 'i' },
    ...yearFilter,
  }).lean();
  if (doc) return doc;

  return null;
}

/** 특정 대학의 모든 학과 목록 조회 */
async function findByCollege(
  college: string,
  year?: number
): Promise<IDepartmentRequirementDocument[]> {
  await connectDB();
  const query: Record<string, unknown> = { college };
  if (year) query.year = year;
  return DepartmentRequirement.find(query).sort({ departmentName: 1 }).lean();
}

/** 모든 대학 목록 조회 (distinct) */
async function listColleges(year?: number): Promise<string[]> {
  await connectDB();
  const filter = year ? { year } : {};
  return DepartmentRequirement.distinct('college', filter).sort().lean();
}

/** 모든 학과 조회 (선택적 대학/연도 필터) */
async function findAll(
  filter?: { college?: string; year?: number }
): Promise<IDepartmentRequirementDocument[]> {
  await connectDB();
  const query: Record<string, unknown> = {};
  if (filter?.college) query.college = filter.college;
  if (filter?.year) query.year = filter.year;
  return DepartmentRequirement.find(query).sort({ college: 1, departmentName: 1 }).lean();
}

/** 특정 학과에서 가용한 전공유형 목록 */
async function getAvailableMajorTypes(
  college: string,
  departmentName: string,
  year?: number
): Promise<MajorType[]> {
  const doc = await findByDepartmentName(college, departmentName, year);
  if (!doc) return ['single'];
  return doc.availableMajorTypes as MajorType[];
}

/**
 * 주전공 학과의 졸업요건 조회 (auto-fill용)
 * 주전공은 항상 해당 학과의 'single' 컬럼 값을 사용
 */
async function getPrimaryRequirements(
  college: string,
  departmentName: string,
  year?: number
): Promise<{
  totalCredits: number;
  generalCredits: number | null;
  primaryMajorCredits: number | null;
  primaryMajorRequiredMin: number | null;
} | null> {
  const doc = await findByDepartmentName(college, departmentName, year);
  if (!doc) return null;

  return {
    totalCredits: doc.totalCredits,
    generalCredits: doc.generalCredits,
    primaryMajorCredits: doc.single.majorCredits,
    primaryMajorRequiredMin: doc.single.majorRequiredMin,
  };
}

/**
 * 복수전공/부전공 학과의 졸업요건 조회 (auto-fill용)
 * 복수전공은 SECONDARY 학과의 'double' 컬럼, 부전공은 SECONDARY 학과의 'minor' 컬럼 사용
 */
async function getSecondaryRequirements(
  college: string,
  departmentName: string,
  majorType: 'double' | 'minor',
  year?: number
): Promise<{
  secondaryMajorCredits?: number | null;
  secondaryMajorRequiredMin?: number | null;
  minorCredits?: number | null;
  minorRequiredMin?: number | null;
  minorPrimaryMajorMin?: number | null;
} | null> {
  const doc = await findByDepartmentName(college, departmentName, year);
  if (!doc) return null;

  if (majorType === 'double') {
    return {
      secondaryMajorCredits: doc.double.majorCredits,
      secondaryMajorRequiredMin: doc.double.majorRequiredMin,
    };
  }

  // minor
  return {
    minorCredits: doc.minor.majorCredits,
    minorRequiredMin: doc.minor.majorRequiredMin,
    minorPrimaryMajorMin: doc.minor.primaryMajorMin,
  };
}

/**
 * 졸업요건 생성
 */
async function create(input: {
  college: string;
  departmentName: string;
  generalCredits: number | null;
  single: { majorRequiredMin: number | null; majorCredits: number | null };
  double: { majorRequiredMin: number | null; majorCredits: number | null };
  minor: { majorRequiredMin: number | null; majorCredits: number | null; primaryMajorMin: number | null };
  totalCredits: number;
}): Promise<IDepartmentRequirementDocument> {
  await connectDB();

  // Compute availableMajorTypes
  const availableMajorTypes: string[] = [];
  if (input.single.majorCredits !== null) availableMajorTypes.push('single');
  if (input.double.majorCredits !== null) availableMajorTypes.push('double');
  if (input.minor.majorCredits !== null) availableMajorTypes.push('minor');

  return DepartmentRequirement.create({
    ...input,
    availableMajorTypes,
  });
}

/**
 * 졸업요건 수정
 */
async function update(
  id: string,
  data: Partial<{
    college: string;
    departmentName: string;
    generalCredits: number | null;
    single: { majorRequiredMin: number | null; majorCredits: number | null };
    double: { majorRequiredMin: number | null; majorCredits: number | null };
    minor: { majorRequiredMin: number | null; majorCredits: number | null; primaryMajorMin: number | null };
    totalCredits: number;
  }>
): Promise<IDepartmentRequirementDocument | null> {
  await connectDB();

  // Recompute availableMajorTypes if major configs are being updated
  const updateData: Record<string, unknown> = { ...data };

  if (data.single || data.double || data.minor) {
    // Need to fetch current doc to merge with updates
    const current = await DepartmentRequirement.findById(id).lean();
    if (!current) return null;

    const single = data.single || current.single;
    const double = data.double || current.double;
    const minor = data.minor || current.minor;

    const availableMajorTypes: string[] = [];
    if (single.majorCredits !== null) availableMajorTypes.push('single');
    if (double.majorCredits !== null) availableMajorTypes.push('double');
    if (minor.majorCredits !== null) availableMajorTypes.push('minor');

    updateData.availableMajorTypes = availableMajorTypes;
  }

  return DepartmentRequirement.findByIdAndUpdate(id, updateData, { new: true }).lean();
}

/**
 * 졸업요건 삭제
 */
async function remove(id: string): Promise<IDepartmentRequirementDocument | null> {
  await connectDB();
  return DepartmentRequirement.findByIdAndDelete(id).lean();
}

export const departmentRequirementService = {
  findByDepartmentName,
  findByCollege,
  listColleges,
  findAll,
  getAvailableMajorTypes,
  getPrimaryRequirements,
  getSecondaryRequirements,
  create,
  update,
  remove,
};
