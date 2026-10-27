/**
 * GraduationRequirement Service (Single-document graduation requirements)
 * @api-separable
 * @migration-notes 분리 시 백엔드로 이동. HTTP 의존성 없음.
 */

import { connectDB } from '@/lib/db/mongoose';
import type { ClientSession } from 'mongoose';
import { GraduationRequirement, Plan, User, DepartmentCurriculum } from '@/models';
import type { IGraduationRequirementDocument } from '@/models';
import type { IPlanDocument } from '@/models';
import type { GraduationRequirementInput, GraduationProgress, CourseInfo, MajorType } from '@/types';
import { DEFAULT_CURRICULUM_YEAR, DEFAULT_REQUIREMENT_YEAR } from '@/lib/constants';
import { resolveMajorTrack } from '@/lib/graduationDelta';
import { departmentRequirementService } from './departmentRequirement.service';
import { effectivePriorTotal, isSemesterCoveredByPrior } from '@/lib/priorCredits';

/**
 * 사용자의 졸업요건 조회 (단일 문서)
 */
async function findByUser(userId: string): Promise<IGraduationRequirementDocument | null> {
  await connectDB();
  return GraduationRequirement.findOne({ user: userId }).lean();
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
async function remove(
  userId: string,
  session?: ClientSession
): Promise<IGraduationRequirementDocument | null> {
  await connectDB();
  return GraduationRequirement.findOneAndDelete({ user: userId }, { session });
}

/**
 * 졸업요건 충족 현황 계산 (multi-track)
 *
 * Course attribution logic:
 * - general_required / general_elective -> general track
 * - major_required / major_elective:
 *   - single major or no secondary dept: all -> primaryMajor
 *   - selected departmentId, then legacy course.department determine the major track
 *   - without either field, only secondary-exclusive curriculum courses use the secondary/minor track
 * - free_elective -> only counts toward total
 *
 * Sub-requirements:
 * - primaryMajor.requiredMin = major_required courses in primaryMajor track
 * - secondaryMajor.requiredMin = major_required courses in secondaryMajor track
 * - minor.requiredMin = major_required courses in minor track
 *
 * Prior earned credits are added to calculated values.
 */
async function calculateProgress(userId: string): Promise<GraduationProgress | null> {
  await connectDB();

  const requirement = await GraduationRequirement.findOne({ user: userId }).lean();
  if (!requirement) return null;

  const user = await User.findById(userId).select('department secondaryDepartment majorType curriculumYear').lean();

  const pct = (earned: number, required: number) =>
    required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;

  const majorType = (requirement.majorType || 'single') as MajorType;
  const primaryDeptId = user?.department?.toString();
  const secondaryDeptId = user?.secondaryDepartment?.toString();
  const memberships = secondaryDeptId && majorType !== 'single'
    ? await DepartmentCurriculum.find({
      department: { $in: [primaryDeptId, secondaryDeptId].filter((id): id is string => !!id) },
      year: user?.curriculumYear ?? DEFAULT_CURRICULUM_YEAR,
    }).select('department course').lean()
    : [];
  const attribution = {
    majorType, secondaryDepartmentId: secondaryDeptId,
    primaryCourseIds: memberships.filter(c => c.department.toString() === primaryDeptId).map(c => c.course.toString()),
    secondaryCourseIds: memberships.filter(c => c.department.toString() === secondaryDeptId).map(c => c.course.toString()),
  };


  // Prior earned credits (총은 트랙 합계 미만이면 트랙 합계로 보정 — 과거 불일치 데이터 방어)
  const priorTotal = effectivePriorTotal(requirement);
  const priorPrimaryMajor = requirement.earnedPrimaryMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorPrimaryMajorRequired = requirement.earnedPrimaryMajorRequiredCredits || 0;
  const priorSecondaryMajor = requirement.earnedSecondaryMajorCredits || 0;
  const priorSecondaryMajorRequired = requirement.earnedSecondaryMajorRequiredCredits || 0;
  const priorMinor = requirement.earnedMinorCredits || 0;
  const priorMinorRequired = requirement.earnedMinorRequiredCredits || 0;

  // Helper to create empty progress
  const emptyProgress = (): GraduationProgress => {
    const result: GraduationProgress = {
      attribution,
      total: {
        required: requirement.totalCredits,
        earned: priorTotal,
        enrolled: 0,
        planned: 0,
        percentage: pct(priorTotal, requirement.totalCredits),
      },
      primaryMajor: {
        required: requirement.primaryMajorCredits,
        earned: priorPrimaryMajor,
        enrolled: 0,
        planned: 0,
        percentage: pct(priorPrimaryMajor, requirement.primaryMajorCredits),
        requiredMin: {
          required: requirement.primaryMajorRequiredMin,
          earned: priorPrimaryMajorRequired,
          planned: 0,
          percentage: pct(priorPrimaryMajorRequired, requirement.primaryMajorRequiredMin),
        },
      },
      general: {
        required: requirement.generalCredits,
        earned: priorGeneral,
        enrolled: 0,
        planned: 0,
        percentage: pct(priorGeneral, requirement.generalCredits),
      },
      courses: { completed: [], enrolled: [], planned: [] },
    };

    if (majorType === 'double' && requirement.secondaryMajorCredits) {
      result.secondaryMajor = {
        required: requirement.secondaryMajorCredits,
        earned: priorSecondaryMajor,
        enrolled: 0,
        planned: 0,
        percentage: pct(priorSecondaryMajor, requirement.secondaryMajorCredits),
        requiredMin: {
          required: requirement.secondaryMajorRequiredMin || 0,
          earned: priorSecondaryMajorRequired,
          planned: 0,
          percentage: pct(priorSecondaryMajorRequired, requirement.secondaryMajorRequiredMin || 0),
        },
      };
    }

    if (majorType === 'minor' && requirement.minorCredits) {
      result.minor = {
        required: requirement.minorCredits,
        earned: priorMinor,
        enrolled: 0,
        planned: 0,
        percentage: pct(priorMinor, requirement.minorCredits),
        requiredMin: {
          required: requirement.minorRequiredMin || 0,
          earned: priorMinorRequired,
          planned: 0,
          percentage: pct(priorMinorRequired, requirement.minorRequiredMin || 0),
        },
      };

      if (requirement.minorPrimaryMajorMin) {
        result.minorPrimaryMajorMin = {
          required: requirement.minorPrimaryMajorMin,
          earned: priorPrimaryMajor,
          percentage: pct(priorPrimaryMajor, requirement.minorPrimaryMajorMin),
        };
      }
    }

    return result;
  };

  // Fetch active plan with populated courses (including department for track attribution)
  const plan = await Plan.findOne({ user: userId }).populate({
    path: 'semesters.courses.course',
    select: 'code name credits category department',
  }) as IPlanDocument | null;

  if (!plan) return emptyProgress();


  // Track accumulators
  const tracks = {
    primaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    secondaryMajor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    minor: { earned: 0, enrolled: 0, planned: 0, reqEarned: 0, reqEnrolled: 0, reqPlanned: 0 },
    general: { earned: 0, enrolled: 0, planned: 0 },
  };

  // Collect all courses by status
  const completed: Array<CourseInfo & { category: string }> = [];
  const enrolled: Array<CourseInfo & { category: string }> = [];
  const planned: Array<CourseInfo & { category: string }> = [];

  let totalEarned = 0;
  let totalEnrolled = 0;
  let totalPlanned = 0;

  for (const semester of plan.semesters) {
    // 기이수 반영 기준 학기 이전(포함)의 '이수' 과목은 성적표(기이수)와 중복 — 합산 제외
    const coveredByPrior = isSemesterCoveredByPrior(
      semester.year,
      semester.term,
      requirement.priorCutoffYear,
      requirement.priorCutoffTerm
    );

    for (const entry of semester.courses) {
      const course = entry.course as unknown as {
        _id: { toString(): string };
        code: string;
        name: string;
        credits: number;
        category?: string;
        department?: { toString(): string };
      };

      if (!course || !course._id) continue;

      const info = {
        id: course._id.toString(),
        code: course.code || 'N/A',
        name: course.name || 'Unknown',
        credits: course.credits || 0,
        category: (entry as unknown as { category?: string }).category || course.category || 'free_elective',
      };

      if (entry.status === 'completed') completed.push(info);
      else if (entry.status === 'enrolled') enrolled.push(info);
      else if (entry.status === 'planned') planned.push(info);
      // 'failed' ignored

      // Skip failed courses for credit accumulation
      if (entry.status === 'failed') continue;
      if (entry.status === 'completed' && coveredByPrior) continue;

      const credits = info.credits;
      const isMajorCategory = ['major_required', 'major_compulsory', 'major_elective'].includes(info.category);
      const isGeneralCategory = ['general_required', 'general_elective'].includes(info.category);
      const isMajorRequired = info.category === 'major_required';

      // Determine track key
      let trackKey: 'primaryMajor' | 'secondaryMajor' | 'minor' | 'general' | 'free' = 'free';

      if (isGeneralCategory) {
        trackKey = 'general';
      } else if (isMajorCategory) {
        trackKey = resolveMajorTrack({
          id: info.id,
          departmentId: entry.departmentId?.toString(),
          department: course.department?.toString(),
        }, attribution);
      }
      // else: free_elective -> trackKey stays 'free', only counts toward total

      // Accumulate total credits (all categories)
      if (entry.status === 'completed') totalEarned += credits;
      else if (entry.status === 'enrolled') totalEnrolled += credits;
      else if (entry.status === 'planned') totalPlanned += credits;

      // Accumulate track credits
      if (trackKey === 'general') {
        if (entry.status === 'completed') tracks.general.earned += credits;
        else if (entry.status === 'enrolled') tracks.general.enrolled += credits;
        else if (entry.status === 'planned') tracks.general.planned += credits;
      } else if (trackKey === 'primaryMajor' || trackKey === 'secondaryMajor' || trackKey === 'minor') {
        const track = tracks[trackKey];
        if (entry.status === 'completed') {
          track.earned += credits;
          if (isMajorRequired) track.reqEarned += credits;
        } else if (entry.status === 'enrolled') {
          track.enrolled += credits;
          if (isMajorRequired) track.reqEnrolled += credits;
        } else if (entry.status === 'planned') {
          track.planned += credits;
          if (isMajorRequired) track.reqPlanned += credits;
        }
      }
      // 'free' trackKey: already counted in total, no separate bucket
    }
  }

  // Strip category from CourseInfo for response
  const stripCategory = (courses: Array<CourseInfo & { category: string }>): CourseInfo[] =>
    courses.map(({ id, code, name, credits }) => ({ id, code, name, credits }));

  // Build result
  const result: GraduationProgress = {
    attribution,
    total: {
      required: requirement.totalCredits,
      earned: totalEarned + priorTotal,
      enrolled: totalEnrolled,
      planned: totalPlanned,
      percentage: pct(totalEarned + priorTotal, requirement.totalCredits),
    },
    primaryMajor: {
      required: requirement.primaryMajorCredits,
      earned: tracks.primaryMajor.earned + priorPrimaryMajor,
      enrolled: tracks.primaryMajor.enrolled,
      planned: tracks.primaryMajor.planned,
      percentage: pct(tracks.primaryMajor.earned + priorPrimaryMajor, requirement.primaryMajorCredits),
      requiredMin: {
        required: requirement.primaryMajorRequiredMin,
        earned: tracks.primaryMajor.reqEarned + priorPrimaryMajorRequired,
        enrolled: tracks.primaryMajor.reqEnrolled,
        planned: tracks.primaryMajor.reqPlanned,
        percentage: pct(tracks.primaryMajor.reqEarned + priorPrimaryMajorRequired, requirement.primaryMajorRequiredMin),
      },
    },
    general: {
      required: requirement.generalCredits,
      earned: tracks.general.earned + priorGeneral,
      enrolled: tracks.general.enrolled,
      planned: tracks.general.planned,
      percentage: pct(tracks.general.earned + priorGeneral, requirement.generalCredits),
    },
    courses: {
      completed: stripCategory(completed),
      enrolled: stripCategory(enrolled),
      planned: stripCategory(planned),
    },
  };

  // Add secondary major track if applicable
  if (majorType === 'double' && requirement.secondaryMajorCredits) {
    result.secondaryMajor = {
      required: requirement.secondaryMajorCredits,
      earned: tracks.secondaryMajor.earned + priorSecondaryMajor,
      enrolled: tracks.secondaryMajor.enrolled,
      planned: tracks.secondaryMajor.planned,
      percentage: pct(tracks.secondaryMajor.earned + priorSecondaryMajor, requirement.secondaryMajorCredits),
      requiredMin: {
        required: requirement.secondaryMajorRequiredMin || 0,
        earned: tracks.secondaryMajor.reqEarned + priorSecondaryMajorRequired,
        enrolled: tracks.secondaryMajor.reqEnrolled,
        planned: tracks.secondaryMajor.reqPlanned,
        percentage: pct(tracks.secondaryMajor.reqEarned + priorSecondaryMajorRequired, requirement.secondaryMajorRequiredMin || 0),
      },
    };
  }

  // Add minor track if applicable
  if (majorType === 'minor' && requirement.minorCredits) {
    result.minor = {
      required: requirement.minorCredits,
      earned: tracks.minor.earned + priorMinor,
      enrolled: tracks.minor.enrolled,
      planned: tracks.minor.planned,
      percentage: pct(tracks.minor.earned + priorMinor, requirement.minorCredits),
      requiredMin: {
        required: requirement.minorRequiredMin || 0,
        earned: tracks.minor.reqEarned + priorMinorRequired,
        enrolled: tracks.minor.reqEnrolled,
        planned: tracks.minor.reqPlanned,
        percentage: pct(tracks.minor.reqEarned + priorMinorRequired, requirement.minorRequiredMin || 0),
      },
    };

    // Minor primary major minimum check
    if (requirement.minorPrimaryMajorMin) {
      const primaryMajorTotal = tracks.primaryMajor.earned + priorPrimaryMajor;
      result.minorPrimaryMajorMin = {
        required: requirement.minorPrimaryMajorMin,
        earned: primaryMajorTotal,
        percentage: pct(primaryMajorTotal, requirement.minorPrimaryMajorMin),
      };
    }
  }

  return result;
}

/** Sync profile tracks while preserving custom thresholds and prior-earned credits. */
async function syncProfile(
  userId: string,
  previous: { majorType?: string; department?: { toString(): string }; secondaryDepartment?: { toString(): string } },
  profile: { majorType?: 'single' | 'double' | 'minor'; department?: { toString(): string }; secondaryDepartment?: { toString(): string } }
): Promise<void> {
  const current = await findByUser(userId);
  if (!current || !profile.department) return;
  const majorType = profile.majorType || 'single';
  const year = current.requirementYear ?? DEFAULT_REQUIREMENT_YEAR;
  const departmentId = profile.department.toString();
  const [defaults, oldDefaults, secondary] = await Promise.all([
    departmentRequirementService.getAutoFill({ departmentId, majorType, track: 'primary', year }),
    // 이전 기본값은 '이전 학과 + 이전 전공유형' 기준으로 계산해야 학과 변경 시 기본값 그대로였던 값을 새 기본값으로 바꿀 수 있다.
    departmentRequirementService.getAutoFill({ departmentId: previous.department?.toString() ?? departmentId, majorType: (current.majorType || 'single') as MajorType, track: 'primary', year }),
    majorType !== 'single' && profile.secondaryDepartment
      ? departmentRequirementService.getAutoFill({ departmentId: profile.secondaryDepartment.toString(), majorType, track: 'secondary', year })
      : null,
  ]);
  const updates: Record<string, unknown> = { majorType };
  if (defaults && 'primaryMajorCredits' in defaults) {
    for (const key of ['primaryMajorCredits', 'primaryMajorRequiredMin'] as const) {
      const oldValue = oldDefaults && 'primaryMajorCredits' in oldDefaults ? oldDefaults[key] : undefined;
      if (current[key] === oldValue && defaults[key] != null) updates[key] = defaults[key];
    }
  }
  const changedSecondary = previous.secondaryDepartment?.toString() !== profile.secondaryDepartment?.toString();
  if (secondary) {
    for (const [key, value] of Object.entries(secondary)) {
      if (value != null && (current.majorType !== majorType || changedSecondary || (current as unknown as Record<string, unknown>)[key] == null)) updates[key] = value;
    }
  }
  await GraduationRequirement.updateOne({ user: userId }, { $set: updates }, { runValidators: true });
}

/**
 * 기본 졸업요건 생성 (단일 문서)
 */
async function createDefaults(userId: string): Promise<IGraduationRequirementDocument> {
  await connectDB();
  return GraduationRequirement.create({
    user: userId,
    majorType: 'single',
    totalCredits: 120,
    primaryMajorCredits: 63,
    primaryMajorRequiredMin: 24,
    generalCredits: 30,
    earnedTotalCredits: 0,
    earnedPrimaryMajorCredits: 0,
    earnedGeneralCredits: 0,
    earnedPrimaryMajorRequiredCredits: 0,
  });
}

export const graduationRequirementService = {
  findByUser,
  upsert,
  remove,
  calculateProgress,
  createDefaults,
  syncProfile,
};
