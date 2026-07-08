import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GraduationRequirementInput, GraduationProgress, MajorType } from '@/types';
import { effectivePriorTotal, isSemesterCoveredByPrior } from '@/lib/priorCredits';

export interface GuestCourseForProgress {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: string;
  departmentId?: string;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
}

export interface GuestSemesterForProgress {
  year: number;
  term: string;
  courses: GuestCourseForProgress[];
}

interface GuestGraduationState {
  requirement: GraduationRequirementInput | null;
  _hasHydrated: boolean;
  setRequirement: (data: GraduationRequirementInput) => void;
  createDefaults: () => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGuestGraduationStore = create<GuestGraduationState>()(
  persist(
    (set) => ({
      requirement: null,
      _hasHydrated: false,

      setRequirement: (data) => set({ requirement: data }),

      createDefaults: () =>
        set({
          requirement: {
            majorType: 'single' as MajorType,
            totalCredits: 120,
            generalCredits: 30,
            primaryMajorCredits: 63,
            primaryMajorRequiredMin: 24,
            earnedTotalCredits: 0,
            earnedGeneralCredits: 0,
            earnedPrimaryMajorCredits: 0,
            earnedPrimaryMajorRequiredCredits: 0,
          },
        }),

      reset: () => set({ requirement: null }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'guest-graduation',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function calculateGuestProgress(
  requirement: GraduationRequirementInput,
  semesters: GuestSemesterForProgress[],
  userDepartmentId?: string | null,
  secondaryDepartmentId?: string | null,
): GraduationProgress {
  const pct = (earned: number, required: number) =>
    required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;

  // 총 기이수는 트랙 합계 미만이면 트랙 합계로 보정 (과거 불일치 데이터 방어)
  const priorTotal = effectivePriorTotal(requirement);
  const priorPrimaryMajor = requirement.earnedPrimaryMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorPrimaryMajorRequired = requirement.earnedPrimaryMajorRequiredCredits || 0;
  const priorSecondaryMajor = requirement.earnedSecondaryMajorCredits || 0;
  const priorSecondaryMajorRequired = requirement.earnedSecondaryMajorRequiredCredits || 0;
  const priorMinor = requirement.earnedMinorCredits || 0;
  const priorMinorRequired = requirement.earnedMinorRequiredCredits || 0;

  // Collect courses by status
  const completed: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
    departmentId?: string;
  }> = [];
  const enrolled: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
    departmentId?: string;
  }> = [];
  const planned: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
    departmentId?: string;
  }> = [];

  // 학점 합산용 '이수' 과목 (기이수 반영 기준 학기 이전의 이수 과목은 중복이라 제외)
  const creditableCompleted: typeof completed = [];

  for (const semester of semesters) {
    const coveredByPrior = isSemesterCoveredByPrior(
      semester.year,
      semester.term,
      requirement.priorCutoffYear,
      requirement.priorCutoffTerm
    );

    for (const course of semester.courses) {
      const info = {
        id: course.id,
        code: course.code || 'N/A',
        name: course.name || 'Unknown',
        credits: course.credits || 0,
        category: course.category || 'free_elective',
        departmentId: course.departmentId,
      };
      if (course.status === 'completed') {
        completed.push(info);
        if (!coveredByPrior) creditableCompleted.push(info);
      }
      else if (course.status === 'enrolled') enrolled.push(info);
      else if (course.status === 'planned') planned.push(info);
      // 'failed' ignored
    }
  }

  const sumCredits = (
    courses: Array<{ credits: number; category: string }>,
    categories: string[]
  ) =>
    courses
      .filter((c) => categories.includes(c.category))
      .reduce((sum, c) => sum + c.credits, 0);

  const majorCategories = ['major_required', 'major_compulsory', 'major_elective'];
  const generalCategories = ['general_required', 'general_elective'];
  const allCategories = [...majorCategories, ...generalCategories, 'free_elective', 'teaching'];

  const totalEarned = sumCredits(creditableCompleted, allCategories);
  const totalEnrolled = sumCredits(enrolled, allCategories);
  const totalPlanned = sumCredits(planned, allCategories);

  const generalEarned = sumCredits(creditableCompleted, generalCategories);
  const generalEnrolled = sumCredits(enrolled, generalCategories);
  const generalPlanned = sumCredits(planned, generalCategories);

  const stripCategory = (
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category: string;
      departmentId?: string;
    }>
  ) => courses.map(({ id, code, name, credits }) => ({ id, code, name, credits }));

  // Determine if we should use department-based classification for multi-track
  const isMultiTrack =
    requirement.majorType !== 'single' &&
    userDepartmentId &&
    secondaryDepartmentId;

  if (isMultiTrack) {
    // Department-based classification for double major / minor
    type CourseEntry = (typeof completed)[number];

    const filterByDept = (courses: CourseEntry[], deptId: string) =>
      courses.filter(
        (c) => c.departmentId === deptId && majorCategories.includes(c.category)
      );

    const filterByDeptRequired = (courses: CourseEntry[], deptId: string) =>
      courses.filter(
        (c) => c.departmentId === deptId && c.category === 'major_required'
      );

    const sumCr = (courses: CourseEntry[]) =>
      courses.reduce((sum, c) => sum + c.credits, 0);

    // Primary major
    const primaryCompleted = sumCr(filterByDept(creditableCompleted, userDepartmentId));
    const primaryEnrolled = sumCr(filterByDept(enrolled, userDepartmentId));
    const primaryPlanned = sumCr(filterByDept(planned, userDepartmentId));
    const primaryReqCompleted = sumCr(filterByDeptRequired(creditableCompleted, userDepartmentId));
    const primaryReqEnrolled = sumCr(filterByDeptRequired(enrolled, userDepartmentId));
    const primaryReqPlanned = sumCr(filterByDeptRequired(planned, userDepartmentId));

    // Secondary (double major or minor)
    const secondaryCompleted = sumCr(filterByDept(creditableCompleted, secondaryDepartmentId));
    const secondaryEnrolled = sumCr(filterByDept(enrolled, secondaryDepartmentId));
    const secondaryPlanned = sumCr(filterByDept(planned, secondaryDepartmentId));
    const secondaryReqCompleted = sumCr(filterByDeptRequired(creditableCompleted, secondaryDepartmentId));
    const secondaryReqEnrolled = sumCr(filterByDeptRequired(enrolled, secondaryDepartmentId));
    const secondaryReqPlanned = sumCr(filterByDeptRequired(planned, secondaryDepartmentId));

    const result: GraduationProgress = {
      total: {
        required: requirement.totalCredits,
        earned: totalEarned + priorTotal,
        enrolled: totalEnrolled,
        planned: totalPlanned,
        percentage: pct(totalEarned + priorTotal, requirement.totalCredits),
      },
      primaryMajor: {
        required: requirement.primaryMajorCredits,
        earned: primaryCompleted + priorPrimaryMajor,
        enrolled: primaryEnrolled,
        planned: primaryPlanned,
        percentage: pct(primaryCompleted + priorPrimaryMajor, requirement.primaryMajorCredits),
        requiredMin: {
          required: requirement.primaryMajorRequiredMin,
          earned: primaryReqCompleted + priorPrimaryMajorRequired,
          enrolled: primaryReqEnrolled,
          planned: primaryReqPlanned,
          percentage: pct(
            primaryReqCompleted + priorPrimaryMajorRequired,
            requirement.primaryMajorRequiredMin
          ),
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

    if (requirement.majorType === 'double' && requirement.secondaryMajorCredits) {
      result.secondaryMajor = {
        required: requirement.secondaryMajorCredits,
        earned: secondaryCompleted + priorSecondaryMajor,
        enrolled: secondaryEnrolled,
        planned: secondaryPlanned,
        percentage: pct(
          secondaryCompleted + priorSecondaryMajor,
          requirement.secondaryMajorCredits
        ),
        requiredMin: {
          required: requirement.secondaryMajorRequiredMin || 0,
          earned: secondaryReqCompleted + priorSecondaryMajorRequired,
          enrolled: secondaryReqEnrolled,
          planned: secondaryReqPlanned,
          percentage: pct(
            secondaryReqCompleted + priorSecondaryMajorRequired,
            requirement.secondaryMajorRequiredMin || 0
          ),
        },
      };
    }

    if (requirement.majorType === 'minor' && requirement.minorCredits) {
      result.minor = {
        required: requirement.minorCredits,
        earned: secondaryCompleted + priorMinor,
        enrolled: secondaryEnrolled,
        planned: secondaryPlanned,
        percentage: pct(secondaryCompleted + priorMinor, requirement.minorCredits),
        requiredMin: {
          required: requirement.minorRequiredMin || 0,
          earned: secondaryReqCompleted + priorMinorRequired,
          enrolled: secondaryReqEnrolled,
          planned: secondaryReqPlanned,
          percentage: pct(
            secondaryReqCompleted + priorMinorRequired,
            requirement.minorRequiredMin || 0
          ),
        },
      };

      if (requirement.minorPrimaryMajorMin) {
        result.minorPrimaryMajorMin = {
          required: requirement.minorPrimaryMajorMin,
          earned: primaryCompleted + priorPrimaryMajor,
          percentage: pct(
            primaryCompleted + priorPrimaryMajor,
            requirement.minorPrimaryMajorMin
          ),
        };
      }
    }

    return result;
  }

  // Single major (or no department info) - category-based classification (original logic)
  const majorEarned = sumCredits(creditableCompleted, majorCategories);
  const majorEnrolled = sumCredits(enrolled, majorCategories);
  const majorPlanned = sumCredits(planned, majorCategories);

  const majorReqEarned = sumCredits(creditableCompleted, ['major_required']);
  const majorReqEnrolled = sumCredits(enrolled, ['major_required']);
  const majorReqPlanned = sumCredits(planned, ['major_required']);

  return {
    total: {
      required: requirement.totalCredits,
      earned: totalEarned + priorTotal,
      enrolled: totalEnrolled,
      planned: totalPlanned,
      percentage: pct(totalEarned + priorTotal, requirement.totalCredits),
    },
    primaryMajor: {
      required: requirement.primaryMajorCredits,
      earned: majorEarned + priorPrimaryMajor,
      enrolled: majorEnrolled,
      planned: majorPlanned,
      percentage: pct(majorEarned + priorPrimaryMajor, requirement.primaryMajorCredits),
      requiredMin: {
        required: requirement.primaryMajorRequiredMin,
        earned: majorReqEarned + priorPrimaryMajorRequired,
        enrolled: majorReqEnrolled,
        planned: majorReqPlanned,
        percentage: pct(majorReqEarned + priorPrimaryMajorRequired, requirement.primaryMajorRequiredMin),
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
