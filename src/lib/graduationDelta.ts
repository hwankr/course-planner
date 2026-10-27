import type { GraduationRequirementInput, MajorAttributionContext } from '@/types';
import { effectivePriorTotal, isSemesterCoveredByPrior } from '@/lib/priorCredits';

/** Shared by server progress and client deltas; legacy shared courses remain primary. */
export function resolveMajorTrack(
  course: { id?: string; departmentId?: string; department?: string },
  context?: MajorAttributionContext
): 'primaryMajor' | 'secondaryMajor' | 'minor' {
  if (!context?.secondaryDepartmentId || context.majorType === 'single') return 'primaryMajor';
  const departmentId = course.departmentId || course.department;
  const secondary = departmentId
    ? departmentId === context.secondaryDepartmentId
    : !!course.id && !!context.secondaryCourseIds?.includes(course.id) && !context.primaryCourseIds?.includes(course.id);
  return secondary ? (context.majorType === 'minor' ? 'minor' : 'secondaryMajor') : 'primaryMajor';
}

interface CourseForDelta {
  id?: string;
  departmentId?: string;
  department?: string;
  credits: number;
  category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
}

export interface CurrentTotals {
  totalPlanned: number;
  totalEarned: number;
  // Primary major
  primaryMajorPlanned: number;
  primaryMajorEarned: number;
  primaryMajorRequiredPlanned: number;
  primaryMajorRequiredEarned: number;
  // General
  generalPlanned: number;
  generalEarned: number;
  // Secondary major (optional)
  secondaryMajorPlanned?: number;
  secondaryMajorEarned?: number;
  secondaryMajorRequiredPlanned?: number;
  secondaryMajorRequiredEarned?: number;
  // Minor (optional)
  minorPlanned?: number;
  minorEarned?: number;
  minorRequiredPlanned?: number;
  minorRequiredEarned?: number;
}

export interface GraduationDelta {
  creditsDelta: number;
  category: string;
  categoryKey: string;
  before: { credits: number; percentage: number };
  after: { credits: number; percentage: number };
  totalBefore: { credits: number; percentage: number };
  totalAfter: { credits: number; percentage: number };
  secondRowBefore: { credits: number; percentage: number };
  secondRowAfter: { credits: number; percentage: number };
  secondRowCategoryKey: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
};

const MAJOR_CATEGORIES = ['major_required', 'major_compulsory', 'major_elective'];
const GENERAL_CATEGORIES = ['general_required', 'general_elective'];

/**
 * Compute graduation delta from known course data.
 * Does NOT need before/after state snapshots -- calculates directly.
 */
export function computeGraduationDelta(
  course: CourseForDelta,
  requirement: GraduationRequirementInput | null,
  currentTotals: CurrentTotals,
  attribution?: MajorAttributionContext
): GraduationDelta | null {
  if (!requirement) return null;

  const cat = course.category || 'free_elective';
  const credits = course.credits;

  const isMajor = MAJOR_CATEGORIES.includes(cat);
  const isGeneral = GENERAL_CATEGORIES.includes(cat);

  const pct = (earned: number, planned: number, required: number) =>
    required > 0 ? Math.min(100, Math.round(((earned + planned) / required) * 100)) : 0;

  // Compute total before/after first (needed for secondRow)
  const totalBeforePlanned = currentTotals.totalPlanned;
  const totalAfterPlanned = totalBeforePlanned + credits;
  const totalBefore = {
    credits: currentTotals.totalEarned + totalBeforePlanned,
    percentage: pct(currentTotals.totalEarned, totalBeforePlanned, requirement.totalCredits),
  };
  const totalAfter = {
    credits: currentTotals.totalEarned + totalAfterPlanned,
    percentage: pct(currentTotals.totalEarned, totalAfterPlanned, requirement.totalCredits),
  };

  let categoryKey: string;
  let before: { credits: number; percentage: number };
  let after: { credits: number; percentage: number };
  let secondRowCategoryKey: string;
  let secondRowBefore: { credits: number; percentage: number };
  let secondRowAfter: { credits: number; percentage: number };

  if (isMajor) {
    const track = resolveMajorTrack(course, { ...attribution, majorType: requirement.majorType });
    categoryKey = track;
    const earned = currentTotals[`${track}Earned`] || 0;
    const planned = currentTotals[`${track}Planned`] || 0;
    const required = requirement[`${track}Credits`] || 0;
    const reqEarned = currentTotals[`${track}RequiredEarned`] || 0;
    const reqPlanned = currentTotals[`${track}RequiredPlanned`] || 0;
    const reqRequired = requirement[`${track}RequiredMin`] || 0;
    before = { credits: earned + planned, percentage: pct(earned, planned, required) };
    after = { credits: earned + planned + credits, percentage: pct(earned, planned + credits, required) };
    secondRowCategoryKey = track === 'primaryMajor' ? 'major_required' : `${track}Required`;
    const requiredDelta = cat === 'major_required' ? credits : 0;
    secondRowBefore = { credits: reqEarned + reqPlanned, percentage: pct(reqEarned, reqPlanned, reqRequired) };
    secondRowAfter = { credits: reqEarned + reqPlanned + requiredDelta, percentage: pct(reqEarned, reqPlanned + requiredDelta, reqRequired) };
  } else if (isGeneral) {
    categoryKey = 'general';
    const beforePlanned = currentTotals.generalPlanned;
    const afterPlanned = beforePlanned + credits;
    before = {
      credits: currentTotals.generalEarned + beforePlanned,
      percentage: pct(currentTotals.generalEarned, beforePlanned, requirement.generalCredits),
    };
    after = {
      credits: currentTotals.generalEarned + afterPlanned,
      percentage: pct(currentTotals.generalEarned, afterPlanned, requirement.generalCredits),
    };

    // Second row: total
    secondRowCategoryKey = 'total';
    secondRowBefore = totalBefore;
    secondRowAfter = totalAfter;
  } else {
    categoryKey = 'total';
    before = { credits: 0, percentage: 0 };
    after = { credits: 0, percentage: 0 };

    // Second row: total
    secondRowCategoryKey = 'total';
    secondRowBefore = totalBefore;
    secondRowAfter = totalAfter;
  }

  return {
    creditsDelta: credits,
    category: CATEGORY_LABELS[cat] || '자유선택',
    categoryKey,
    before,
    after,
    totalBefore,
    totalAfter,
    secondRowBefore,
    secondRowAfter,
    secondRowCategoryKey,
  };
}

/**
 * Compute current totals from plan semesters + requirement earned credits.
 * Call this BEFORE addCourseToSemester() to capture pre-mutation state.
 */
export function computeCurrentTotals(
  semesters: Array<{
    year: number;
    term: string;
    courses: Array<{
      id?: string;
      departmentId?: string;
      department?: string;
      credits: number;
      category?: string;
      status: string;
    }>;
  }>,
  requirement: GraduationRequirementInput | null,
  attribution?: MajorAttributionContext
): CurrentTotals {
  const totals: CurrentTotals = {
    totalEarned: 0, totalPlanned: 0,
    primaryMajorEarned: 0, primaryMajorPlanned: 0,
    primaryMajorRequiredEarned: 0, primaryMajorRequiredPlanned: 0,
    secondaryMajorEarned: 0, secondaryMajorPlanned: 0,
    secondaryMajorRequiredEarned: 0, secondaryMajorRequiredPlanned: 0,
    minorEarned: 0, minorPlanned: 0, minorRequiredEarned: 0, minorRequiredPlanned: 0,
    generalEarned: 0, generalPlanned: 0,
  };
  for (const sem of semesters) {
    const covered = isSemesterCoveredByPrior(sem.year, sem.term, requirement?.priorCutoffYear, requirement?.priorCutoffTerm);
    for (const course of sem.courses) {
      if (course.status === 'failed' || (course.status === 'completed' && covered)) continue;
      const suffix = course.status === 'completed' ? 'Earned' : 'Planned';
      const cat = course.category || 'free_elective';
      totals[`total${suffix}`] += course.credits;
      if (MAJOR_CATEGORIES.includes(cat)) {
        const track = resolveMajorTrack(course, { ...attribution, majorType: requirement?.majorType });
        const key = `${track}${suffix}` as const;
        totals[key] = (totals[key] || 0) + course.credits;
        if (cat === 'major_required') {
          const requiredKey = `${track}Required${suffix}` as const;
          totals[requiredKey] = (totals[requiredKey] || 0) + course.credits;
        }
      }
      if (GENERAL_CATEGORIES.includes(cat)) totals[`general${suffix}`] += course.credits;
    }
  }
  if (requirement) {
    totals.totalEarned += effectivePriorTotal(requirement);
    totals.primaryMajorEarned += requirement.earnedPrimaryMajorCredits || 0;
    totals.primaryMajorRequiredEarned += requirement.earnedPrimaryMajorRequiredCredits || 0;
    totals.generalEarned += requirement.earnedGeneralCredits || 0;
    totals.secondaryMajorEarned! += requirement.earnedSecondaryMajorCredits || 0;
    totals.secondaryMajorRequiredEarned! += requirement.earnedSecondaryMajorRequiredCredits || 0;
    totals.minorEarned! += requirement.earnedMinorCredits || 0;
    totals.minorRequiredEarned! += requirement.earnedMinorRequiredCredits || 0;
  }
  return totals;
}

export const GRADUATION_CATEGORY_LABELS = CATEGORY_LABELS;
