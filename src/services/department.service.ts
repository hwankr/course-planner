/**
 * Department Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { Department } from '@/models';
import type { IDepartmentDocument } from '@/models';
import type { CreateDepartmentInput } from '@/types';

/**
 * 모든 학과 조회
 */
async function findAll(): Promise<IDepartmentDocument[]> {
  await connectDB();
  return Department.find({ isActive: true }).sort({ name: 1 }).lean();
}

/**
 * ID로 학과 조회
 */
async function findById(id: string): Promise<IDepartmentDocument | null> {
  await connectDB();
  return Department.findById(id).lean();
}

/**
 * 학과 코드로 조회
 */
async function findByCode(code: string): Promise<IDepartmentDocument | null> {
  await connectDB();
  return Department.findOne({ code: code.toUpperCase(), isActive: true }).lean();
}

/**
 * 새 학과 생성
 */
async function create(input: CreateDepartmentInput): Promise<IDepartmentDocument> {
  await connectDB();

  const existingDept = await Department.findOne({ code: input.code.toUpperCase() });
  if (existingDept) {
    throw new Error('이미 존재하는 학과 코드입니다.');
  }

  return Department.create({
    ...input,
    code: input.code.toUpperCase(),
  });
}

/**
 * 학과 업데이트
 */
async function update(
  id: string,
  data: Partial<CreateDepartmentInput>
): Promise<IDepartmentDocument | null> {
  await connectDB();

  if (data.code) {
    data.code = data.code.toUpperCase();
  }

  return Department.findByIdAndUpdate(id, data, { new: true });
}

/**
 * 학과 삭제 (soft delete)
 */
async function remove(id: string): Promise<IDepartmentDocument | null> {
  await connectDB();
  return Department.findByIdAndUpdate(id, { isActive: false }, { new: true });
}

/**
 * 단과대학별 학과 조회
 */
async function findByCollege(college: string): Promise<IDepartmentDocument[]> {
  await connectDB();
  return Department.find({ college, isActive: true }).sort({ name: 1 }).lean();
}

export const departmentService = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  findByCollege,
};
