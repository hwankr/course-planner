/**
 * Plan Service
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { Plan, Course } from '@/models';
import type { IPlanDocument } from '@/models';
import type { CreatePlanInput, AddCourseToSemesterInput, Term } from '@/types';

/**
 * 사용자의 모든 계획 조회
 */
async function findByUser(userId: string): Promise<IPlanDocument[]> {
  await connectDB();
  return Plan.find({ user: userId })
    .populate({
      path: 'semesters.courses.course',
      select: 'code name credits category',
    })
    .sort({ updatedAt: -1 });
}

/**
 * ID로 계획 조회
 */
async function findById(id: string): Promise<IPlanDocument | null> {
  await connectDB();
  return Plan.findById(id).populate({
    path: 'semesters.courses.course',
    select: 'code name credits category department prerequisites',
    populate: [
      { path: 'department', select: 'code name' },
      { path: 'prerequisites', select: 'code name' },
    ],
  });
}

/**
 * 새 계획 생성
 */
async function create(
  userId: string,
  input: CreatePlanInput
): Promise<IPlanDocument> {
  await connectDB();

  // 사용자의 계획 수 제한 (최대 10개)
  const existingCount = await Plan.countDocuments({ user: userId });
  if (existingCount >= 10) {
    throw new Error('수강계획은 최대 10개까지 생성할 수 있습니다.');
  }

  const plan = await Plan.create({
    user: userId,
    name: input.name,
    semesters: input.semesters || [],
  });

  return plan;
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
}

/**
 * 학기에 과목 추가
 */
async function addCourseToSemester(
  input: AddCourseToSemesterInput
): Promise<IPlanDocument | null> {
  await connectDB();

  const { planId, year, term, courseId } = input;

  // 과목 존재 확인
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('존재하지 않는 과목입니다.');
  }

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
    return Plan.findById(planId).populate({
      path: 'semesters.courses.course',
      select: 'code name credits category',
    });
  }

  // 학기당 과목 수 제한 (최대 10개)
  if (semester.courses.length >= 10) {
    throw new Error('한 학기에 최대 10개 과목까지 추가할 수 있습니다.');
  }

  semester.courses.push({
    course: course._id,
    status: 'planned',
  });

  await plan.save();
  await plan.populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  });
  return plan;
}

/**
 * 학기에서 과목 제거
 */
async function removeCourseFromSemester(
  planId: string,
  year: number,
  term: Term,
  courseId: string
): Promise<IPlanDocument | null> {
  await connectDB();

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
  await plan.populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  });
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
  await plan.populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  });
  return plan;
}

/**
 * 계획 삭제
 */
async function remove(id: string): Promise<IPlanDocument | null> {
  await connectDB();
  return Plan.findByIdAndDelete(id);
}

/**
 * 학기 제거
 */
async function removeSemester(
  planId: string,
  year: number,
  term: Term
): Promise<IPlanDocument> {
  await connectDB();
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
    .populate({
      path: 'semesters.courses.course',
      select: 'code name credits category department prerequisites',
      populate: [
        { path: 'department', select: 'code name' },
        { path: 'prerequisites', select: 'code name' },
      ],
    })
    .lean() as Promise<IPlanDocument>;
}

/**
 * 학기의 모든 과목 제거 (학기 초기화)
 */
async function clearSemester(
  planId: string,
  year: number,
  term: Term
): Promise<IPlanDocument> {
  await connectDB();
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
    .populate({
      path: 'semesters.courses.course',
      select: 'code name credits category department prerequisites',
      populate: [
        { path: 'department', select: 'code name' },
        { path: 'prerequisites', select: 'code name' },
      ],
    })
    .lean() as Promise<IPlanDocument>;
}

/**
 * 계획 상태 변경 (활성화)
 */
async function activate(planId: string, userId: string): Promise<IPlanDocument | null> {
  await connectDB();

  // 기존 활성 계획 비활성화
  await Plan.updateMany(
    { user: userId, status: 'active' },
    { status: 'draft' }
  );

  // 새 계획 활성화
  return Plan.findByIdAndUpdate(
    planId,
    { status: 'active' },
    { new: true }
  );
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
  return Plan.findById(planId).populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  });
}

/**
 * 사용자의 모든 계획 삭제 (회원 탈퇴 시 사용)
 */
async function deleteAllByUser(userId: string): Promise<number> {
  await connectDB();
  const result = await Plan.deleteMany({ user: userId });
  return result.deletedCount;
}

export const planService = {
  findByUser,
  findById,
  create,
  addSemester,
  removeSemester,
  clearSemester,
  addCourseToSemester,
  removeCourseFromSemester,
  moveCourse,
  updateCourseStatus,
  remove,
  activate,
  deleteAllByUser,
};
