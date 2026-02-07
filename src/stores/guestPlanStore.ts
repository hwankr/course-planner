import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Term } from '@/types';

// Types
export interface GuestPlannedCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective';
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
}

export interface GuestSemester {
  year: number;
  term: Term;
  courses: GuestPlannedCourse[];
}

export interface GuestPlan {
  id: string;
  semesters: GuestSemester[];
}

interface GuestPlanState {
  plan: GuestPlan | null;
  _hasHydrated: boolean;

  // Actions
  getOrCreatePlan: () => GuestPlan;
  resetPlan: () => void;
  addSemester: (planId: string, year: number, term: Term) => void;
  removeSemester: (planId: string, year: number, term: Term) => void;
  clearSemester: (planId: string, year: number, term: Term) => void;
  addCourse: (planId: string, year: number, term: Term, course: GuestPlannedCourse) => void;
  removeCourse: (planId: string, year: number, term: Term, courseId: string) => void;
  moveCourse: (planId: string, srcYear: number, srcTerm: Term, destYear: number, destTerm: Term, courseId: string) => void;
  updateCourseStatus: (planId: string, year: number, term: Term, courseId: string, status: GuestPlannedCourse['status']) => void;
  clearAll: () => void;
  setHasHydrated: (state: boolean) => void;
}

// Term sorting order
const termOrder: Record<Term, number> = {
  'spring': 1,
  'fall': 2,
};

// Helper function to sort semesters
const sortSemesters = (semesters: GuestSemester[]): GuestSemester[] => {
  return [...semesters].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return termOrder[a.term] - termOrder[b.term];
  });
};

export const useGuestPlanStore = create<GuestPlanState>()(
  persist(
    (set, get) => ({
      plan: null,
      _hasHydrated: false,

      getOrCreatePlan: () => {
        const { plan } = get();
        if (plan) return plan;

        const newPlan: GuestPlan = {
          id: `guest-plan-${Date.now().toString(36)}`,
          semesters: [],
        };

        set({ plan: newPlan });
        return newPlan;
      },

      resetPlan: () => {
        const { plan } = get();
        if (!plan) return;
        set({ plan: { ...plan, semesters: [] } });
      },

      addSemester: (_planId: string, year: number, term: Term) => {
        const { plan } = get();
        if (!plan) return;

        const exists = plan.semesters.some(
          (s) => s.year === year && s.term === term
        );
        if (exists) return;

        const newSemesters = sortSemesters([
          ...plan.semesters,
          { year, term, courses: [] },
        ]);

        set({ plan: { ...plan, semesters: newSemesters } });
      },

      removeSemester: (_planId: string, year: number, term: Term) => {
        const { plan } = get();
        if (!plan) return;

        set({
          plan: {
            ...plan,
            semesters: plan.semesters.filter(
              (s) => !(s.year === year && s.term === term)
            ),
          },
        });
      },

      clearSemester: (_planId: string, year: number, term: Term) => {
        const { plan } = get();
        if (!plan) return;

        set({
          plan: {
            ...plan,
            semesters: plan.semesters.map((semester) => {
              if (semester.year !== year || semester.term !== term) return semester;
              return { ...semester, courses: [] };
            }),
          },
        });
      },

      addCourse: (_planId: string, year: number, term: Term, course: GuestPlannedCourse) => {
        const { plan } = get();
        if (!plan) return;

        // Duplicate guard: skip if course already exists in any semester
        const alreadyInPlan = plan.semesters.some(sem =>
          sem.courses.some(c => c.id === course.id)
        );
        if (alreadyInPlan) return;

        set({
          plan: {
            ...plan,
            semesters: plan.semesters.map((semester) => {
              if (semester.year !== year || semester.term !== term) return semester;
              return {
                ...semester,
                courses: [...semester.courses, course],
              };
            }),
          },
        });
      },

      removeCourse: (_planId: string, year: number, term: Term, courseId: string) => {
        const { plan } = get();
        if (!plan) return;

        set({
          plan: {
            ...plan,
            semesters: plan.semesters.map((semester) => {
              if (semester.year !== year || semester.term !== term) return semester;
              return {
                ...semester,
                courses: semester.courses.filter((c) => c.id !== courseId),
              };
            }),
          },
        });
      },

      moveCourse: (_planId: string, srcYear: number, srcTerm: Term, destYear: number, destTerm: Term, courseId: string) => {
        const { plan } = get();
        if (!plan) return;

        let courseToMove: GuestPlannedCourse | null = null;

        // Find and remove from source
        const updatedSemesters = plan.semesters.map((semester) => {
          if (semester.year === srcYear && semester.term === srcTerm) {
            const course = semester.courses.find((c) => c.id === courseId);
            if (course) courseToMove = course;

            return {
              ...semester,
              courses: semester.courses.filter((c) => c.id !== courseId),
            };
          }
          return semester;
        });

        // Add to destination
        if (courseToMove) {
          set({
            plan: {
              ...plan,
              semesters: updatedSemesters.map((semester) => {
                if (semester.year === destYear && semester.term === destTerm) {
                  return {
                    ...semester,
                    courses: [...semester.courses, courseToMove!],
                  };
                }
                return semester;
              }),
            },
          });
        } else {
          set({ plan: { ...plan, semesters: updatedSemesters } });
        }
      },

      updateCourseStatus: (_planId: string, year: number, term: Term, courseId: string, status: GuestPlannedCourse['status']) => {
        const { plan } = get();
        if (!plan) return;

        set({
          plan: {
            ...plan,
            semesters: plan.semesters.map((semester) => {
              if (semester.year !== year || semester.term !== term) return semester;
              return {
                ...semester,
                courses: semester.courses.map((course) => {
                  if (course.id !== courseId) return course;
                  return { ...course, status };
                }),
              };
            }),
          },
        });
      },

      clearAll: () => {
        set({ plan: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'guest-plans',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          // Migration: if old plans[] format exists, migrate to single plan
          const raw = state as unknown as { plans?: GuestPlan[]; activePlanId?: string };
          if (raw.plans && Array.isArray(raw.plans) && !state.plan) {
            const firstPlan = raw.plans[0];
            if (firstPlan) {
              state.plan = { id: firstPlan.id, semesters: firstPlan.semesters };
            }
          }
        }
      },
      partialize: (state) => ({
        plan: state.plan,
      }),
    }
  )
);

// Selector helpers
export const useGuestActivePlan = () =>
  useGuestPlanStore((s) => s.plan);

export const useGuestPlanHydrated = () =>
  useGuestPlanStore((s) => s._hasHydrated);
