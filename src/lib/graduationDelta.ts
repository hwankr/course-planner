import type { GraduationRequirementInput } from '@/types';

interface CourseForDelta {
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
  currentTotals: CurrentTotals
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
    categoryKey = 'primaryMajor';
    const beforePlanned = currentTotals.primaryMajorPlanned;
    const afterPlanned = beforePlanned + credits;
    before = {
      credits: currentTotals.primaryMajorEarned + beforePlanned,
      percentage: pct(currentTotals.primaryMajorEarned, beforePlanned, requirement.primaryMajorCredits),
    };
    after = {
      credits: currentTotals.primaryMajorEarned + afterPlanned,
      percentage: pct(currentTotals.primaryMajorEarned, afterPlanned, requirement.primaryMajorCredits),
    };

    // Second row: major_required
    secondRowCategoryKey = 'major_required';
    const majorReqBeforePlanned = currentTotals.primaryMajorRequiredPlanned;
    const majorReqAfterPlanned = majorReqBeforePlanned + (cat === 'major_required' ? credits : 0);
    secondRowBefore = {
      credits: currentTotals.primaryMajorRequiredEarned + majorReqBeforePlanned,
      percentage: pct(currentTotals.primaryMajorRequiredEarned, majorReqBeforePlanned, requirement.primaryMajorRequiredMin),
    };
    secondRowAfter = {
      credits: currentTotals.primaryMajorRequiredEarned + majorReqAfterPlanned,
      percentage: pct(currentTotals.primaryMajorRequiredEarned, majorReqAfterPlanned, requirement.primaryMajorRequiredMin),
    };
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
 * Format delta into a human-readable toast description string.
 */
export function formatDeltaDescription(delta: GraduationDelta): string {
  const parts: string[] = [];

  if (delta.categoryKey !== 'total') {
    const groupLabel = delta.categoryKey === 'primaryMajor' ? '전공' : '교양';
    parts.push(
      `${groupLabel}: ${delta.before.credits} → ${delta.after.credits}학점 (${delta.before.percentage}% → ${delta.after.percentage}%)`
    );
  }

  parts.push(
    `전체: ${delta.totalBefore.credits} → ${delta.totalAfter.credits}학점 (${delta.totalBefore.percentage}% → ${delta.totalAfter.percentage}%)`
  );

  return parts.join(' · ');
}

/**
 * Compute current totals from plan semesters + requirement earned credits.
 * Call this BEFORE addCourseToSemester() to capture pre-mutation state.
 */
export function computeCurrentTotals(
  semesters: Array<{
    courses: Array<{
      credits: number;
      category?: string;
      status: string;
    }>;
  }>,
  requirement: GraduationRequirementInput | null
): CurrentTotals {
  let totalEarned = 0,
    totalPlanned = 0;
  let primaryMajorEarned = 0,
    primaryMajorPlanned = 0;
  let generalEarned = 0,
    generalPlanned = 0;
  let primaryMajorRequiredEarned = 0,
    primaryMajorRequiredPlanned = 0;

  for (const sem of semesters) {
    for (const c of sem.courses) {
      const credits = c.credits;
      const cat = c.category || 'free_elective';
      if (c.status === 'completed') {
        totalEarned += credits;
        if (MAJOR_CATEGORIES.includes(cat)) primaryMajorEarned += credits;
        if (GENERAL_CATEGORIES.includes(cat)) generalEarned += credits;
        if (cat === 'major_required') primaryMajorRequiredEarned += credits;
      } else if (c.status === 'planned' || c.status === 'enrolled') {
        totalPlanned += credits;
        if (MAJOR_CATEGORIES.includes(cat)) primaryMajorPlanned += credits;
        if (GENERAL_CATEGORIES.includes(cat)) generalPlanned += credits;
        if (cat === 'major_required') primaryMajorRequiredPlanned += credits;
      }
    }
  }

  // Add prior earned credits from requirement
  if (requirement) {
    totalEarned += requirement.earnedTotalCredits || 0;
    primaryMajorEarned += requirement.earnedPrimaryMajorCredits || 0;
    generalEarned += requirement.earnedGeneralCredits || 0;
    primaryMajorRequiredEarned += requirement.earnedPrimaryMajorRequiredCredits || 0;
  }

  return {
    totalEarned,
    totalPlanned,
    primaryMajorEarned,
    primaryMajorPlanned,
    generalEarned,
    generalPlanned,
    primaryMajorRequiredEarned,
    primaryMajorRequiredPlanned,
  };
}

/**
 * Category label lookup (exported for use by toast and preview components)
 */
export const GRADUATION_CATEGORY_LABELS = CATEGORY_LABELS;
