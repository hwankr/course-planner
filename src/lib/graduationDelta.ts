import type { GraduationRequirementInput } from '@/types';

interface CourseForDelta {
  credits: number;
  category?: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective';
}

export interface CurrentTotals {
  totalPlanned: number;
  totalEarned: number;
  majorPlanned: number;
  majorEarned: number;
  generalPlanned: number;
  generalEarned: number;
}

export interface GraduationDelta {
  creditsDelta: number;
  category: string;
  categoryKey: string;
  before: { credits: number; percentage: number };
  after: { credits: number; percentage: number };
  totalBefore: { credits: number; percentage: number };
  totalAfter: { credits: number; percentage: number };
}

const CATEGORY_LABELS: Record<string, string> = {
  major_required: '전공핵심',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  free_elective: '자유선택',
};

const MAJOR_CATEGORIES = ['major_required', 'major_elective'];
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

  let categoryKey: string;
  let before: { credits: number; percentage: number };
  let after: { credits: number; percentage: number };

  if (isMajor) {
    categoryKey = 'major';
    const beforePlanned = currentTotals.majorPlanned;
    const afterPlanned = beforePlanned + credits;
    before = {
      credits: currentTotals.majorEarned + beforePlanned,
      percentage: pct(currentTotals.majorEarned, beforePlanned, requirement.majorCredits),
    };
    after = {
      credits: currentTotals.majorEarned + afterPlanned,
      percentage: pct(currentTotals.majorEarned, afterPlanned, requirement.majorCredits),
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
  } else {
    categoryKey = 'total';
    before = { credits: 0, percentage: 0 };
    after = { credits: 0, percentage: 0 };
  }

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

  return {
    creditsDelta: credits,
    category: CATEGORY_LABELS[cat] || '자유선택',
    categoryKey,
    before,
    after,
    totalBefore,
    totalAfter,
  };
}

/**
 * Format delta into a human-readable toast description string.
 */
export function formatDeltaDescription(delta: GraduationDelta): string {
  const parts: string[] = [];

  if (delta.categoryKey !== 'total') {
    const groupLabel = delta.categoryKey === 'major' ? '전공' : '교양';
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
  let majorEarned = 0,
    majorPlanned = 0;
  let generalEarned = 0,
    generalPlanned = 0;

  for (const sem of semesters) {
    for (const c of sem.courses) {
      const credits = c.credits;
      const cat = c.category || 'free_elective';
      if (c.status === 'completed') {
        totalEarned += credits;
        if (MAJOR_CATEGORIES.includes(cat)) majorEarned += credits;
        if (GENERAL_CATEGORIES.includes(cat)) generalEarned += credits;
      } else if (c.status === 'planned' || c.status === 'enrolled') {
        totalPlanned += credits;
        if (MAJOR_CATEGORIES.includes(cat)) majorPlanned += credits;
        if (GENERAL_CATEGORIES.includes(cat)) generalPlanned += credits;
      }
    }
  }

  // Add prior earned credits from requirement
  if (requirement) {
    totalEarned += requirement.earnedTotalCredits || 0;
    majorEarned += requirement.earnedMajorCredits || 0;
    generalEarned += requirement.earnedGeneralCredits || 0;
  }

  return { totalEarned, totalPlanned, majorEarned, majorPlanned, generalEarned, generalPlanned };
}

/**
 * Category label lookup (exported for use by toast and preview components)
 */
export const GRADUATION_CATEGORY_LABELS = CATEGORY_LABELS;
