/**
 * Plan Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import type { ClientSession } from 'mongoose';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import { Plan, Course, DepartmentCurriculum, User } from '@/models';
import type { IPlanDocument } from '@/models';
import type { AddCourseToSemesterInput, RequirementCategory, Term } from '@/types';

/**
 * Version error retry wrapper for Mongoose optimistic concurrency control.
 * Retries operations on VersionError (race condition on __v field).
 */
async function withVersionRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isVersionError =
        lastError.name === 'VersionError' ||
        lastError.message.includes('No matching document found for id');

      if (isVersionError && attempt < maxRetries - 1) {
        // Retry: fn will re-read the document on next attempt
        continue;
      }

      // Not a version error or retries exhausted
      throw lastError;
    }
  }

  throw lastError!;
}

const POPULATE_COURSES = {
  path: 'semesters.courses.course',
  select: 'code name credits category',
};

interface CategoryActor {
  department?: { toString(): string };
  secondaryDepartment?: { toString(): string };
  majorType?: 'single' | 'double' | 'minor';
  curriculumYear?: number;
}

function requireStoredCategory(category: unknown): RequirementCategory {
  if (typeof category !== 'string') {
    throw new Error('과목의 이수구분을 확인할 수 없습니다.');
  }
  return category as RequirementCategory;
}

async function resolveCourseCategory(
  course: {
    _id: { toString(): string };
    category?: unknown;
    createdBy?: { toString(): string } | null;
    department?: { toString(): string } | null;
  },
  actorId: string,
  departmentId?: string
): Promise<RequirementCategory> {
  if (!departmentId) {
    if (!course.createdBy) {
      const curriculumEntry = await DepartmentCurriculum.findOne({
        course: course._id.toString(),
      })
        .select('_id')
        .lean<{ _id: unknown } | null>();

      if (curriculumEntry) {
        throw new Error('교육과정 과목을 추가하려면 학과 정보가 필요합니다.');
      }
    }
    return requireStoredCategory(course.category);
  }

  const actor = await User.findById(actorId)
    .select('department secondaryDepartment majorType curriculumYear')
    .lean<CategoryActor | null>();
  if (!actor) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  const allowedDepartmentIds = [actor.department?.toString()];
  if (actor.majorType === 'double' || actor.majorType === 'minor') {
    allowedDepartmentIds.push(actor.secondaryDepartment?.toString());
  }
  if (!allowedDepartmentIds.includes(departmentId)) {
    throw new Error('선택할 수 없는 학과입니다.');
  }

  if (course.createdBy) {
    if (course.department && course.department.toString() !== departmentId) {
      throw new Error('커스텀 과목의 학과 정보가 일치하지 않습니다.');
    }
    return requireStoredCategory(course.category);
  }

  const curriculumEntry = await DepartmentCurriculum.findOne({
    course: course._id.toString(),
    department: departmentId,
    year: actor.curriculumYear ?? DEFAULT_CURRICULUM_YEAR,
  })
    .select('category')
    .lean<{ category: RequirementCategory } | null>();

  if (!curriculumEntry) {
    throw new Error('선택한 학과의 교육과정에서 과목을 찾을 수 없습니다.');
  }

  return curriculumEntry.category;
}

const POPULATE_COURSES_DETAIL = {
  path: 'semesters.courses.course',
  select: 'code name credits category department prerequisites',
  populate: [
    { path: 'department', select: 'code name' },
    { path: 'prerequisites', select: 'code name' },
  ],
};

/**
 * 사용자의 계획 조회 (단일)
 */
async function findByUser(userId: string): Promise<IPlanDocument | null> {
  await connectDB();
  return Plan.findOne({ user: userId }).populate(POPULATE_COURSES).lean();
}

/**
 * 사용자의 계획 조회 또는 자동 생성 (lazy creation)
 */
async function findOrCreateByUser(userId: string): Promise<IPlanDocument> {
  await connectDB();

  let plan = await Plan.findOne({ user: userId });
  if (!plan) {
    plan = await Plan.create({
      user: userId,
      semesters: [],
    });
  }

  await plan.populate(POPULATE_COURSES_DETAIL);
  return plan;
}

/**
 * ID로 계획 조회
 */
async function findById(id: string): Promise<IPlanDocument | null> {
  await connectDB();
  return Plan.findById(id).populate(POPULATE_COURSES_DETAIL).lean();
}

/**
 * 계획에 학기 추가
 */
async function addSemester(
  planId: string,
  year: number,
  term: Term
): Promise<IPlanDocument | null> {
  await connectDB();

  return withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    // 이미 존재하는 학기인지 확인
    const exists = plan.semesters.some(
      (s) => s.year === year && s.term === term
    );
    if (exists) {
      throw new Error('이미 존재하는 학기입니다.');
    }

    // 학기 수 제한 (최대 12개)
    if (plan.semesters.length >= 12) {
      throw new Error('학기는 최대 12개까지 추가할 수 있습니다.');
    }

    plan.semesters.push({ year, term, courses: [] });
    plan.semesters.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.term === 'spring' ? -1 : 1;
    });

    await plan.save();
    return plan;
  });
}

/**
 * 학기에 과목 추가
 */
async function addCourseToSemester(
  input: AddCourseToSemesterInput & { actorId: string }
): Promise<IPlanDocument | null> {
  await connectDB();

  const { planId, actorId, year, term, courseId, departmentId } = input;

  // 공식 과목은 공유하고, 커스텀 과목은 생성자에게만 노출한다.
  const course = await Course.findOne({
    _id: courseId,
    $or: [{ createdBy: null }, { createdBy: actorId }],
  });
  if (!course) {
    throw new Error('존재하지 않는 과목입니다.');
  }

  return withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    // 해당 학기 찾기
    let semester = plan.semesters.find(
      (s) => s.year === year && s.term === term
    );

    // 학기가 없으면 생성
    if (!semester) {
      plan.semesters.push({ year, term, courses: [] });
      plan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.term === 'spring' ? -1 : 1;
      });
      semester = plan.semesters.find((s) => s.year === year && s.term === term)!;
    }

    // 이미 추가된 과목인지 확인 (모든 학기 체크) - 멱등성: 중복 시 에러 대신 기존 plan 반환
    const alreadyInPlan = plan.semesters.some(s =>
      s.courses.some(c => c.course.toString() === courseId)
    );
    if (alreadyInPlan) {
      return Plan.findById(planId).populate(POPULATE_COURSES);
    }

    // 학기당 과목 수 제한 (최대 10개)
    if (semester.courses.length >= 10) {
      throw new Error('한 학기에 최대 10개 과목까지 추가할 수 있습니다.');
    }

    const resolvedCategory = await resolveCourseCategory(
      course,
      actorId,
      departmentId
    );

    semester.courses.push({
      course: course._id,
      status: 'planned',
      category: resolvedCategory,
    });

    await plan.save();
    await plan.populate(POPULATE_COURSES);
    return plan;
  });
}

/**
 * 학기에서 과목 제거
 */
async function removeCourseFromSemester(
  planId: string,
  year: number,
  term: Term,
  courseId: string,
  actorId: string
): Promise<IPlanDocument | null> {
  await connectDB();

  const plan = await withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    const semester = plan.semesters.find(
      (s) => s.year === year && s.term === term
    );
    if (!semester) {
      throw new Error('존재하지 않는 학기입니다.');
    }

    semester.courses = semester.courses.filter(
      (c) => c.course.toString() !== courseId
    );

    await plan.save();
    await plan.populate(POPULATE_COURSES);
    return plan;
  });

  // 커스텀 과목이면 DB에서도 삭제 (해당 유저만 사용하므로)
  // withVersionRetry 밖에서 실행하여 plan 저장과 독립적으로 처리
  try {
    await Course.deleteOne({ _id: courseId, createdBy: actorId });
  } catch {
    // 과목 삭제 실패해도 학기에서 제거는 유지
  }

  return plan;
}

/**
 * 과목 상태 업데이트 (완료, 수강중 등)
 */
async function updateCourseStatus(
  planId: string,
  year: number,
  term: Term,
  courseId: string,
  status: 'planned' | 'enrolled' | 'completed' | 'failed',
  grade?: string
): Promise<IPlanDocument | null> {
  await connectDB();

  return withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    const semester = plan.semesters.find(
      (s) => s.year === year && s.term === term
    );
    if (!semester) return null;

    const courseEntry = semester.courses.find(
      (c) => c.course.toString() === courseId
    );
    if (!courseEntry) return null;

    courseEntry.status = status;
    if (grade) courseEntry.grade = grade;

    await plan.save();
    await plan.populate(POPULATE_COURSES);
    return plan;
  });
}

/**
 * 학기 제거
 */
async function removeSemester(
  planId: string,
  year: number,
  term: Term,
  actorId: string
): Promise<IPlanDocument> {
  await connectDB();

  // 커스텀 과목 삭제를 위해 학기의 과목 ID를 미리 수집
  const planSnapshot = await Plan.findById(planId).lean();
  const targetSemester = planSnapshot?.semesters.find(
    (s) => s.year === year && s.term === term
  );
  const courseIds = targetSemester?.courses.map((c) => c.course.toString()) || [];

  const result = await withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('수강계획을 찾을 수 없습니다.');

    const semesterIndex = plan.semesters.findIndex(
      (s) => s.year === year && s.term === term
    );

    // 멱등성: 이미 삭제된 학기면 현재 상태 반환
    if (semesterIndex !== -1) {
      plan.semesters.splice(semesterIndex, 1);
      await plan.save();
    }

    return Plan.findById(planId)
      .populate(POPULATE_COURSES_DETAIL)
      .lean() as Promise<IPlanDocument>;
  });

  // 커스텀 과목이면 DB에서도 삭제 (해당 유저만 사용하므로)
  try {
    if (courseIds.length > 0) {
      await Course.deleteMany({
        _id: { $in: courseIds },
        createdBy: actorId,
      });
    }
  } catch {
    // 커스텀 과목 삭제 실패해도 학기 제거는 유지
  }

  return result;
}

/**
 * 학기의 모든 과목 제거 (학기 초기화)
 */
async function clearSemester(
  planId: string,
  year: number,
  term: Term,
  actorId: string
): Promise<IPlanDocument> {
  await connectDB();

  // 커스텀 과목 삭제를 위해 학기의 과목 ID를 미리 수집
  const planSnapshot = await Plan.findById(planId).lean();
  const targetSemester = planSnapshot?.semesters.find(
    (s) => s.year === year && s.term === term
  );
  const courseIds = targetSemester?.courses.map((c) => c.course.toString()) || [];

  const result = await withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('수강계획을 찾을 수 없습니다.');

    const semester = plan.semesters.find(
      (s) => s.year === year && s.term === term
    );

    // 멱등성: 학기가 없으면 현재 상태 반환
    if (semester) {
      semester.courses = [];
      await plan.save();
    }

    return Plan.findById(planId)
      .populate(POPULATE_COURSES_DETAIL)
      .lean() as Promise<IPlanDocument>;
  });

  // 커스텀 과목이면 DB에서도 삭제 (해당 유저만 사용하므로)
  try {
    if (courseIds.length > 0) {
      await Course.deleteMany({
        _id: { $in: courseIds },
        createdBy: actorId,
      });
    }
  } catch {
    // 커스텀 과목 삭제 실패해도 학기 초기화는 유지
  }

  return result;
}

/**
 * 과목을 한 학기에서 다른 학기로 원자적으로 이동
 */
async function moveCourse(
  planId: string,
  sourceYear: number,
  sourceTerm: Term,
  destYear: number,
  destTerm: Term,
  courseId: string
): Promise<IPlanDocument | null> {
  await connectDB();

  return withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) return null;

    // 소스 학기에서 과목 찾기
    const sourceSemester = plan.semesters.find(
      (s) => s.year === sourceYear && s.term === sourceTerm
    );
    if (!sourceSemester) throw new Error('출발 학기를 찾을 수 없습니다.');

    const courseIndex = sourceSemester.courses.findIndex(
      (c) => c.course.toString() === courseId
    );
    if (courseIndex === -1) throw new Error('이동할 과목을 찾을 수 없습니다.');

    // 과목 데이터 추출
    const [courseEntry] = sourceSemester.courses.splice(courseIndex, 1);

    // 대상 학기 찾기 또는 생성
    let destSemester = plan.semesters.find(
      (s) => s.year === destYear && s.term === destTerm
    );
    if (!destSemester) {
      plan.semesters.push({ year: destYear, term: destTerm, courses: [] });
      plan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.term === 'spring' ? -1 : 1;
      });
      destSemester = plan.semesters.find((s) => s.year === destYear && s.term === destTerm)!;
    }

    // 대상 학기 과목 수 제한 확인
    if (destSemester.courses.length >= 10) {
      // 롤백: 과목을 소스로 되돌림
      sourceSemester.courses.splice(courseIndex, 0, courseEntry);
      throw new Error('한 학기에 최대 10개 과목까지 추가할 수 있습니다.');
    }

    destSemester.courses.push(courseEntry);

    await plan.save();
    return Plan.findById(planId).populate(POPULATE_COURSES);
  });
}

/**
 * 계획 초기화 (모든 학기/과목 삭제, 계획 자체는 유지)
 */
async function resetPlan(planId: string, actorId: string): Promise<IPlanDocument> {
  await connectDB();

  // 커스텀 과목 삭제를 위해 모든 학기의 과목 ID를 미리 수집
  const planSnapshot = await Plan.findById(planId).lean();
  const courseIds = planSnapshot?.semesters.flatMap(
    (s) => s.courses.map((c) => c.course.toString())
  ) || [];

  const result = await withVersionRetry(async () => {
    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('수강계획을 찾을 수 없습니다.');

    plan.semesters = [];
    await plan.save();

    await plan.populate(POPULATE_COURSES_DETAIL);
    return plan;
  });

  // 커스텀 과목이면 DB에서도 삭제 (해당 유저만 사용하므로)
  try {
    if (courseIds.length > 0) {
      await Course.deleteMany({
        _id: { $in: courseIds },
        createdBy: actorId,
      });
    }
  } catch {
    // 커스텀 과목 삭제 실패해도 계획 초기화는 유지
  }

  return result;
}

/**
 * 사용자의 모든 계획 삭제 (회원 탈퇴 시 사용)
 */
async function deleteAllByUser(userId: string, session?: ClientSession): Promise<number> {
  await connectDB();
  const result = await Plan.deleteMany({ user: userId }, { session });
  return result.deletedCount;
}

export const planService = {
  findByUser,
  findOrCreateByUser,
  findById,
  addSemester,
  removeSemester,
  clearSemester,
  addCourseToSemester,
  removeCourseFromSemester,
  moveCourse,
  updateCourseStatus,
  resetPlan,
  deleteAllByUser,
};
