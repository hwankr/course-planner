import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GraduationRequirementInput, GraduationProgress } from '@/types';

export interface GuestCourseForProgress {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: string;
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
            totalCredits: 120,
            majorCredits: 53,
            majorRequiredMin: 24,
            generalCredits: 30,
            earnedTotalCredits: 0,
            earnedMajorCredits: 0,
            earnedGeneralCredits: 0,
            earnedMajorRequiredCredits: 0,
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
  semesters: GuestSemesterForProgress[]
): GraduationProgress {
  const pct = (earned: number, required: number) =>
    required > 0 ? Math.min(100, Math.round((earned / required) * 100)) : 0;

  const priorTotal = requirement.earnedTotalCredits || 0;
  const priorMajor = requirement.earnedMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedMajorRequiredCredits || 0;

  // Collect courses by status
  const completed: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
  }> = [];
  const enrolled: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
  }> = [];
  const planned: Array<{
    id: string;
    code: string;
    name: string;
    credits: number;
    category: string;
  }> = [];

  for (const semester of semesters) {
    for (const course of semester.courses) {
      const info = {
        id: course.id,
        code: course.code || 'N/A',
        name: course.name || 'Unknown',
        credits: course.credits || 0,
        category: course.category || 'free_elective',
      };
      if (course.status === 'completed') completed.push(info);
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

  const majorCategories = ['major_required', 'major_elective'];
  const generalCategories = ['general_required', 'general_elective'];
  const allCategories = [...majorCategories, ...generalCategories, 'free_elective'];

  const totalEarned = sumCredits(completed, allCategories);
  const totalEnrolled = sumCredits(enrolled, allCategories);
  const totalPlanned = sumCredits(planned, allCategories);

  const majorEarned = sumCredits(completed, majorCategories);
  const majorEnrolled = sumCredits(enrolled, majorCategories);
  const majorPlanned = sumCredits(planned, majorCategories);

  const majorReqEarned = sumCredits(completed, ['major_required']);

  const generalEarned = sumCredits(completed, generalCategories);
  const generalEnrolled = sumCredits(enrolled, generalCategories);
  const generalPlanned = sumCredits(planned, generalCategories);

  const stripCategory = (
    courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category: string;
    }>
  ) => courses.map(({ id, code, name, credits }) => ({ id, code, name, credits }));

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
