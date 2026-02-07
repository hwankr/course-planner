/**
 * GraduationRequirement Service (Single-document graduation requirements)
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import { GraduationRequirement, Plan } from '@/models';
import type { IGraduationRequirementDocument } from '@/models';
import type { IPlanDocument } from '@/models';
import type { GraduationRequirementInput, GraduationProgress, CourseInfo } from '@/types';

/**
 * 사용자의 졸업요건 조회 (단일 문서)
 */
async function findByUser(userId: string): Promise<IGraduationRequirementDocument | null> {
  await connectDB();
  return GraduationRequirement.findOne({ user: userId });
}

/**
 * 졸업요건 생성 또는 업데이트 (upsert)
 */
async function upsert(
  userId: string,
  input: GraduationRequirementInput
): Promise<IGraduationRequirementDocument> {
  await connectDB();
  const doc = await GraduationRequirement.findOneAndUpdate(
    { user: userId },
    { $set: { ...input, user: userId } },
    { upsert: true, new: true, runValidators: true }
  );
  return doc;
}

/**
 * 졸업요건 삭제
 */
async function remove(userId: string): Promise<IGraduationRequirementDocument | null> {
  await connectDB();
  return GraduationRequirement.findOneAndDelete({ user: userId });
}

/**
 * 졸업요건 충족 현황 계산
 * Groups courses by category:
 * - major = major_required + major_elective
 * - general = general_required + general_elective
 * - free = free_elective (only counts toward total)
 * Sub-requirements:
 * - major.requiredMin = major_required courses only
 * Prior earned credits (earnedMajorCredits, earnedGeneralCredits) are added to calculated values.
 */
async function calculateProgress(userId: string): Promise<GraduationProgress | null> {
  await connectDB();

  const requirement = await GraduationRequirement.findOne({ user: userId });
  if (!requirement) return null;

  const pct = (earned: number, required: number) =>
    required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;

  // Fetch active plan with populated courses
  const plan = await Plan.findOne({ user: userId }).populate({
    path: 'semesters.courses.course',
    select: 'code name credits category',
  }) as IPlanDocument | null;

  const priorTotal = requirement.earnedTotalCredits || 0;
  const priorMajor = requirement.earnedMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedMajorRequiredCredits || 0;

  // Helper to create empty CourseInfo arrays
  const emptyProgress = (): GraduationProgress => ({
    total: { required: requirement.totalCredits, earned: priorTotal, enrolled: 0, planned: 0, percentage: pct(priorTotal, requirement.totalCredits) },
    major: {
      required: requirement.majorCredits, earned: priorMajor, enrolled: 0, planned: 0, percentage: pct(priorMajor, requirement.majorCredits),
      requiredMin: { required: requirement.majorRequiredMin, earned: priorMajorRequired, percentage: pct(priorMajorRequired, requirement.majorRequiredMin) },
    },
    general: {
      required: requirement.generalCredits, earned: priorGeneral, enrolled: 0, planned: 0, percentage: pct(priorGeneral, requirement.generalCredits),
    },
    courses: { completed: [], enrolled: [], planned: [] },
  });

  if (!plan) return emptyProgress();

  // Collect all courses by status
  const completed: Array<CourseInfo & { category: string }> = [];
  const enrolled: Array<CourseInfo & { category: string }> = [];
  const planned: Array<CourseInfo & { category: string }> = [];

  for (const semester of plan.semesters) {
    for (const entry of semester.courses) {
      const course = entry.course as unknown as {
        _id: { toString(): string };
        code: string;
        name: string;
        credits: number;
        category?: string;
      };

      if (!course || !course._id) continue;

      const info = {
        id: course._id.toString(),
        code: course.code || 'N/A',
        name: course.name || 'Unknown',
        credits: course.credits || 0,
        category: course.category || 'free_elective',
      };

      if (entry.status === 'completed') completed.push(info);
      else if (entry.status === 'enrolled') enrolled.push(info);
      else if (entry.status === 'planned') planned.push(info);
      // 'failed' ignored
    }
  }

  // Helper: sum credits for given categories
  const sumCredits = (courses: Array<{ credits: number; category: string }>, categories: string[]) =>
    courses.filter(c => categories.includes(c.category)).reduce((sum, c) => sum + c.credits, 0);

  const majorCategories = ['major_required', 'major_elective'];
  const generalCategories = ['general_required', 'general_elective'];
  const allCategories = [...majorCategories, ...generalCategories, 'free_elective'];

  // Total (all categories)
  const totalEarned = sumCredits(completed, allCategories);
  const totalEnrolled = sumCredits(enrolled, allCategories);
  const totalPlanned = sumCredits(planned, allCategories);

  // Major group
  const majorEarned = sumCredits(completed, majorCategories);
  const majorEnrolled = sumCredits(enrolled, majorCategories);
  const majorPlanned = sumCredits(planned, majorCategories);

  // Major required sub-requirement
  const majorReqEarned = sumCredits(completed, ['major_required']);
  const majorReqPlanned = sumCredits(planned, ['major_required']);

  // General group
  const generalEarned = sumCredits(completed, generalCategories);
  const generalEnrolled = sumCredits(enrolled, generalCategories);
  const generalPlanned = sumCredits(planned, generalCategories);

  // Strip category from CourseInfo for response
  const stripCategory = (courses: Array<CourseInfo & { category: string }>): CourseInfo[] =>
    courses.map(({ id, code, name, credits }) => ({ id, code, name, credits }));

  return {
    total: {
      required: requirement.totalCredits,
      earned: totalEarned + priorTotal,
      enrolled: totalEnrolled,
      planned: totalPlanned,
      percentage: pct(totalEarned + priorTotal, requirement.totalCredits),
    },
    major: {
      required: requirement.majorCredits,
      earned: majorEarned + priorMajor,
      enrolled: majorEnrolled,
      planned: majorPlanned,
      percentage: pct(majorEarned + priorMajor, requirement.majorCredits),
      requiredMin: {
        required: requirement.majorRequiredMin,
        earned: majorReqEarned + priorMajorRequired,
        planned: majorReqPlanned,
        percentage: pct(majorReqEarned + priorMajorRequired, requirement.majorRequiredMin),
      },
    },
    general: {
      required: requirement.generalCredits,
      earned: generalEarned + priorGeneral,
      enrolled: generalEnrolled,
      planned: generalPlanned,
      percentage: pct(generalEarned + priorGeneral, requirement.generalCredits),
    },
    courses: {
      completed: stripCategory(completed),
      enrolled: stripCategory(enrolled),
      planned: stripCategory(planned),
    },
  };
}

/**
 * 기본 졸업요건 생성 (단일 문서)
 */
async function createDefaults(userId: string): Promise<IGraduationRequirementDocument> {
  await connectDB();
  return GraduationRequirement.create({
    user: userId,
    totalCredits: 120,
    majorCredits: 63,
    majorRequiredMin: 24,
    generalCredits: 30,
    earnedTotalCredits: 0,
    earnedMajorCredits: 0,
    earnedGeneralCredits: 0,
    earnedMajorRequiredCredits: 0,
  });
}

export const graduationRequirementService = {
  findByUser,
  upsert,
  remove,
  calculateProgress,
  createDefaults,
};
