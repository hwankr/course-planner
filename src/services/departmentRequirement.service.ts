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
  departmentName: string
): Promise<IDepartmentRequirementDocument | null> {
  await connectDB();

  // 1. Exact match (college + departmentName)
  let doc = await DepartmentRequirement.findOne({ college, departmentName }).lean();
  if (doc) return doc;

  // 2. Match by departmentName only (ignore college mismatch)
  doc = await DepartmentRequirement.findOne({ departmentName }).lean();
  if (doc) return doc;

  // 3. Partial match: departmentName contains the search term
  const escaped = departmentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  doc = await DepartmentRequirement.findOne({
    departmentName: { $regex: escaped, $options: 'i' }
  }).lean();
  if (doc) return doc;

  return null;
}

/** 특정 대학의 모든 학과 목록 조회 */
async function findByCollege(
  college: string
): Promise<IDepartmentRequirementDocument[]> {
  await connectDB();
  return DepartmentRequirement.find({ college }).sort({ departmentName: 1 }).lean();
}

/** 모든 대학 목록 조회 (distinct) */
async function listColleges(): Promise<string[]> {
  await connectDB();
  return DepartmentRequirement.distinct('college').sort().lean();
}

/** 모든 학과 조회 (선택적 대학 필터) */
async function findAll(
  filter?: { college?: string }
): Promise<IDepartmentRequirementDocument[]> {
  await connectDB();
  const query = filter?.college ? { college: filter.college } : {};
  return DepartmentRequirement.find(query).sort({ college: 1, departmentName: 1 }).lean();
}

/** 특정 학과에서 가용한 전공유형 목록 */
async function getAvailableMajorTypes(
  college: string,
  departmentName: string
): Promise<MajorType[]> {
  const doc = await findByDepartmentName(college, departmentName);
  if (!doc) return ['single'];
  return doc.availableMajorTypes as MajorType[];
}

/**
 * 주전공 학과의 졸업요건 조회 (auto-fill용)
 * 주전공은 항상 해당 학과의 'single' 컬럼 값을 사용
 */
async function getPrimaryRequirements(
  college: string,
  departmentName: string
): Promise<{
  totalCredits: number;
  generalCredits: number | null;
  primaryMajorCredits: number | null;
  primaryMajorRequiredMin: number | null;
} | null> {
  const doc = await findByDepartmentName(college, departmentName);
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
  majorType: 'double' | 'minor'
): Promise<{
  secondaryMajorCredits?: number | null;
  secondaryMajorRequiredMin?: number | null;
  minorCredits?: number | null;
  minorRequiredMin?: number | null;
  minorPrimaryMajorMin?: number | null;
} | null> {
  const doc = await findByDepartmentName(college, departmentName);
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

export const departmentRequirementService = {
  findByDepartmentName,
  findByCollege,
  listColleges,
  findAll,
  getAvailableMajorTypes,
  getPrimaryRequirements,
  getSecondaryRequirements,
};
