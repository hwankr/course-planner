/**
 * Course Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import mongoose from 'mongoose';
import { connectDB } from '@/lib/db/mongoose';
import { escapeRegex } from '@/lib/validation';
import { Course, DepartmentCurriculum } from '@/models';
import type { ICourseDocument } from '@/models';
import type { CreateCourseInput, CourseFilter, RequirementCategory } from '@/types';

/**
 * 과목 목록 조회 (필터 적용)
 * - departmentId가 제공되면 DepartmentCurriculum 조인테이블을 통해 조회
 * - 그 외의 경우 기존 Course 직접 조회 방식 유지
 */
async function findAll(filter?: CourseFilter): Promise<ICourseDocument[]> {
  await connectDB();

  // Curriculum-aware fetching when departmentId is provided
  if (filter?.departmentId) {
    // Build curriculum filter
    const curriculumFilter: Record<string, unknown> = {
      department: filter.departmentId
    };

    if (filter.category) {
      curriculumFilter.category = filter.category;
    }
    if (filter.recommendedYear) {
      curriculumFilter.recommendedYear = filter.recommendedYear;
    }
    if (filter.recommendedSemester) {
      curriculumFilter.recommendedSemester = filter.recommendedSemester;
    }
    if (filter.curriculumYear) {
      curriculumFilter.year = filter.curriculumYear;
    }

    // Fetch curriculum entries for this department
    interface CurriculumEntry {
      course: mongoose.Types.ObjectId;
      category: string;
      recommendedYear: number;
      recommendedSemester: string;
      year: number;
    }

    const curriculumEntries = await DepartmentCurriculum.find(curriculumFilter)
      .select('course category recommendedYear recommendedSemester')
      .lean<CurriculumEntry[]>();

    const courseIds = curriculumEntries.map(e => e.course);

    // Build course query conditions
    const conditions: Record<string, unknown>[] = [
      { isActive: true },
      { _id: { $in: courseIds } },
    ];

    if (filter.search) {
      const escapedSearch = escapeRegex(filter.search);
      conditions.push({
        $or: [
          { name: { $regex: escapedSearch, $options: 'i' } },
          { code: { $regex: escapedSearch, $options: 'i' } },
        ],
      });
    }

    if (filter.semester) {
      conditions.push({ semesters: filter.semester });
    }

    // Fetch official courses
    const officialCourses = await Course.find({ $and: conditions })
      .populate('department', 'code name')
      .populate('prerequisites', 'code name')
      .sort({ code: 1 })
      .limit(filter.limit ?? 200)
      .lean();

    // Enrich courses with curriculum metadata
    const curriculumMap = new Map(
      curriculumEntries.map(e => [e.course.toString(), e])
    );

    const enrichedCourses = officialCourses.map(course => {
      const currEntry = curriculumMap.get(course._id.toString());
      if (currEntry) {
        // Override with department-specific metadata
        return {
          ...course,
          category: currEntry.category,
          recommendedYear: currEntry.recommendedYear,
          recommendedSemester: currEntry.recommendedSemester,
        };
      }
      return course;
    });

    // Add custom courses for this user if applicable
    if (filter.userId) {
      const customConditions: Record<string, unknown>[] = [
        { isActive: true },
        { createdBy: filter.userId },
      ];

      if (filter.search) {
        const escapedSearch = escapeRegex(filter.search);
        customConditions.push({
          $or: [
            { name: { $regex: escapedSearch, $options: 'i' } },
            { code: { $regex: escapedSearch, $options: 'i' } },
          ],
        });
      }

      if (filter.category) {
        customConditions.push({ category: filter.category });
      }

      if (filter.semester) {
        customConditions.push({ semesters: filter.semester });
      }

      if (filter.recommendedYear) {
        customConditions.push({ recommendedYear: filter.recommendedYear });
      }

      if (filter.recommendedSemester) {
        customConditions.push({ recommendedSemester: filter.recommendedSemester });
      }

      const customCourses = await Course.find({ $and: customConditions })
        .populate('department', 'code name')
        .populate('prerequisites', 'code name')
        .sort({ code: 1 })
        .lean();

      return [...enrichedCourses, ...customCourses] as ICourseDocument[];
    }

    return enrichedCourses as ICourseDocument[];
  }

  // Original logic for non-department queries (unchanged)
  const conditions: Record<string, unknown>[] = [{ isActive: true }];

  // Ownership filter: show official courses + user's custom courses
  if (filter?.userId) {
    conditions.push({
      $or: [{ createdBy: null }, { createdBy: filter.userId }],
    });
  } else {
    conditions.push({ createdBy: null }); // Only official courses
  }

  if (filter?.semester) {
    conditions.push({ semesters: filter.semester });
  }

  if (filter?.category) {
    conditions.push({ category: filter.category });
  }

  if (filter?.search) {
    const escapedSearch = escapeRegex(filter.search);
    conditions.push({
      $or: [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { code: { $regex: escapedSearch, $options: 'i' } },
      ],
    });
  }

  if (filter?.recommendedYear) {
    conditions.push({ recommendedYear: filter.recommendedYear });
  }

  if (filter?.recommendedSemester) {
    conditions.push({ recommendedSemester: filter.recommendedSemester });
  }

  return Course.find({ $and: conditions })
    .populate('department', 'code name')
    .populate('prerequisites', 'code name')
    .sort({ createdBy: 1, code: 1 }) // Official courses first, then custom
    .limit(filter?.limit ?? 200)
    .lean();
}

/**
 * ID로 과목 조회
 */
async function findById(id: string): Promise<ICourseDocument | null> {
  await connectDB();
  return Course.findById(id)
    .populate('department', 'code name')
    .populate('prerequisites', 'code name credits')
    .lean();
}

/**
 * 과목 코드로 조회
 */
async function findByCode(code: string): Promise<ICourseDocument | null> {
  await connectDB();
  return Course.findOne({ code: code.toUpperCase() })
    .populate('department', 'code name')
    .populate('prerequisites', 'code name')
    .lean();
}

/**
 * 새 과목 생성
 */
async function create(input: CreateCourseInput): Promise<ICourseDocument> {
  await connectDB();

  // Uniqueness scoped to createdBy (official vs custom per-user)
  const existingCourse = await Course.findOne({
    code: input.code.toUpperCase(),
    createdBy: input.createdBy || null,
  });
  if (existingCourse) {
    throw new Error('이미 존재하는 과목 코드입니다.');
  }

  const courseData: Record<string, unknown> = {
    ...input,
    code: input.code.toUpperCase(),
  };
  if (input.createdBy) {
    courseData.createdBy = input.createdBy;
  }

  const course = await Course.create(courseData);

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
 * DepartmentCurriculum 조인테이블을 통해 조회
 */
async function countByDepartment(departmentId: string, year?: number): Promise<number> {
  await connectDB();
  const filter: Record<string, unknown> = { department: departmentId };
  if (year) filter.year = year;
  return DepartmentCurriculum.countDocuments(filter);
}

/**
 * 사용자가 생성한 커스텀 과목 모두 삭제 (회원 탈퇴 시 사용)
 * NOTE: 의도적으로 hard delete (deleteMany) 사용. 기존 remove()는 soft delete (isActive: false)이지만,
 * 회원 탈퇴 시에는 사용자 데이터 완전 삭제가 목적이므로 hard delete가 적절함.
 */
async function deleteCustomByUser(userId: string): Promise<number> {
  await connectDB();
  const result = await Course.deleteMany({ createdBy: userId });
  return result.deletedCount;
}

/**
 * 공통 과목 조회 (학과 무관, 모든 학생이 사용 가능)
 * department: null, createdBy: null 인 과목들
 */
async function findCommonCourses(filter?: { category?: RequirementCategory; search?: string }): Promise<ICourseDocument[]> {
  await connectDB();

  const conditions: Record<string, unknown>[] = [
    { isActive: true },
    { department: null },
    { createdBy: null },
  ];

  if (filter?.category) {
    conditions.push({ category: filter.category });
  }

  if (filter?.search) {
    const escapedSearch = escapeRegex(filter.search);
    conditions.push({
      $or: [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { code: { $regex: escapedSearch, $options: 'i' } },
      ],
    });
  }

  return Course.find({ $and: conditions })
    .sort({ category: 1, credits: 1, code: 1 })
    .limit(100)
    .lean();
}

export const courseService = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  remove,
  countByDepartment,
  deleteCustomByUser,
  findCommonCourses,
};
