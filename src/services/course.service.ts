/**
 * Course Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { Course } from '@/models';
import type { ICourseDocument } from '@/models';
import type { CreateCourseInput, CourseFilter } from '@/types';

/**
 * 과목 목록 조회 (필터 적용)
 */
async function findAll(filter?: CourseFilter): Promise<ICourseDocument[]> {
  await connectDB();

  const query: Record<string, unknown> = { isActive: true };

  if (filter?.departmentId) {
    query.department = filter.departmentId;
  }

  if (filter?.semester) {
    query.semesters = filter.semester;
  }

  if (filter?.category) {
    query.category = filter.category;
  }

  if (filter?.search) {
    query.$or = [
      { name: { $regex: filter.search, $options: 'i' } },
      { code: { $regex: filter.search, $options: 'i' } },
    ];
  }

  return Course.find(query)
    .populate('department', 'code name')
    .populate('prerequisites', 'code name')
    .sort({ code: 1 });
}

/**
 * ID로 과목 조회
 */
async function findById(id: string): Promise<ICourseDocument | null> {
  await connectDB();
  return Course.findById(id)
    .populate('department', 'code name')
    .populate('prerequisites', 'code name credits');
}

/**
 * 과목 코드로 조회
 */
async function findByCode(code: string): Promise<ICourseDocument | null> {
  await connectDB();
  return Course.findOne({ code: code.toUpperCase() })
    .populate('department', 'code name')
    .populate('prerequisites', 'code name');
}

/**
 * 새 과목 생성
 */
async function create(input: CreateCourseInput): Promise<ICourseDocument> {
  await connectDB();

  const existingCourse = await Course.findOne({ code: input.code.toUpperCase() });
  if (existingCourse) {
    throw new Error('이미 존재하는 과목 코드입니다.');
  }

  const course = await Course.create({
    ...input,
    code: input.code.toUpperCase(),
  });

  return course.populate('department', 'code name');
}

/**
 * 과목 업데이트
 */
async function update(
  id: string,
  data: Partial<CreateCourseInput>
): Promise<ICourseDocument | null> {
  await connectDB();

  if (data.code) {
    data.code = data.code.toUpperCase();
  }

  return Course.findByIdAndUpdate(id, data, { new: true })
    .populate('department', 'code name')
    .populate('prerequisites', 'code name');
}

/**
 * 과목 삭제 (soft delete)
 */
async function remove(id: string): Promise<ICourseDocument | null> {
  await connectDB();
  return Course.findByIdAndUpdate(id, { isActive: false }, { new: true });
}

/**
 * 학과별 과목 수 조회
 */
async function countByDepartment(departmentId: string): Promise<number> {
  await connectDB();
  return Course.countDocuments({ department: departmentId, isActive: true });
}

export const courseService = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  countByDepartment,
};
