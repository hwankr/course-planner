/**
 * Requirement Service (Graduation Requirements)
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { Requirement, Plan } from '@/models';
import type { IRequirementDocument, IPlanDocument } from '@/models';
import type { CreateRequirementInput, RequirementCategory } from '@/types';

/**
 * 학과의 모든 졸업요건 조회
 */
async function findByDepartment(departmentId: string): Promise<IRequirementDocument[]> {
  await connectDB();
  return Requirement.find({ department: departmentId })
    .populate('allowedCourses', 'code name credits')
    .sort({ category: 1, name: 1 })
    .lean();
}

/**
 * ID로 졸업요건 조회
 */
async function findById(id: string): Promise<IRequirementDocument | null> {
  await connectDB();
  return Requirement.findById(id)
    .populate('department', 'code name')
    .populate('allowedCourses', 'code name credits')
    .lean();
}

/**
 * 새 졸업요건 생성
 */
async function create(input: CreateRequirementInput): Promise<IRequirementDocument> {
  await connectDB();
  return Requirement.create(input);
}

/**
 * 졸업요건 업데이트
 */
async function update(
  id: string,
  data: Partial<CreateRequirementInput>
): Promise<IRequirementDocument | null> {
  await connectDB();
  return Requirement.findByIdAndUpdate(id, data, { new: true })
    .populate('allowedCourses', 'code name credits');
}

/**
 * 졸업요건 삭제
 */
async function remove(id: string): Promise<IRequirementDocument | null> {
  await connectDB();
  return Requirement.findByIdAndDelete(id);
}

/**
 * 사용자의 졸업요건 충족 현황 계산
 */
interface RequirementProgress {
  requirement: IRequirementDocument;
  earnedCredits: number;
  requiredCredits: number;
  completedCourses: string[];
  percentage: number;
}

async function calculateProgress(
  userId: string,
  departmentId: string
): Promise<RequirementProgress[]> {
  await connectDB();

  // 사용자의 활성 계획 조회
  const plan = await Plan.findOne({ user: userId }).populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  }) as IPlanDocument | null;

  if (!plan) {
    throw new Error('활성화된 수강 계획이 없습니다.');
  }

  // 완료된 과목 목록
  const completedCourses: { courseId: string; credits: number; category?: string }[] = [];
  for (const semester of plan.semesters) {
    for (const entry of semester.courses) {
      if (entry.status === 'completed') {
        const course = entry.course as unknown as {
          _id: { toString(): string };
          credits: number;
          category?: string;
        };
        completedCourses.push({
          courseId: course._id.toString(),
          credits: course.credits,
          category: course.category,
        });
      }
    }
  }

  // 학과 졸업요건 조회
  const requirements = await Requirement.find({ department: departmentId })
    .populate('allowedCourses', 'code name credits')
    .lean();

  // 각 요건별 충족 현황 계산
  const progress: RequirementProgress[] = requirements.map((req) => {
    const allowedCourseIds = req.allowedCourses.map((c) => c._id.toString());

    const matchingCourses = completedCourses.filter((c) =>
      allowedCourseIds.includes(c.courseId)
    );

    const earnedCredits = matchingCourses.reduce((sum, c) => sum + c.credits, 0);

    return {
      requirement: req,
      earnedCredits,
      requiredCredits: req.requiredCredits,
      completedCourses: matchingCourses.map((c) => c.courseId),
      percentage: Math.min(100, (earnedCredits / req.requiredCredits) * 100),
    };
  });

  return progress;
}

/**
 * 카테고리별 요건 조회
 */
async function findByCategory(
  departmentId: string,
  category: RequirementCategory
): Promise<IRequirementDocument[]> {
  await connectDB();
  return Requirement.find({ department: departmentId, category })
    .populate('allowedCourses', 'code name credits')
    .lean();
}

export const requirementService = {
  findByDepartment,
  findById,
  create,
  update,
  remove,
  calculateProgress,
  findByCategory,
};
