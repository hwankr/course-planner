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
  name: string;
  semesters: GuestSemester[];
  status: 'draft' | 'active';
}

interface GuestPlanState {
  plans: GuestPlan[];
  activePlanId: string | null;
  _hasHydrated: boolean;

  // Actions
  createPlan: (name: string) => GuestPlan;
  deletePlan: (id: string) => void;
  setActivePlanId: (id: string) => void;
  addSemester: (planId: string, year: number, term: Term) => void;
  removeSemester: (planId: string, year: number, term: Term) => void;
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
      plans: [],
      activePlanId: null,
      _hasHydrated: false,

      createPlan: (name: string) => {
        const newPlan: GuestPlan = {
          id: `guest-plan-${Date.now().toString(36)}`,
          name,
          semesters: [],
          status: 'draft',
        };

        set((state) => {
          const isFirstPlan = state.plans.length === 0;
          return {
            plans: [...state.plans, newPlan],
            activePlanId: isFirstPlan ? newPlan.id : state.activePlanId,
          };
        });

        return newPlan;
      },

      deletePlan: (id: string) => {
        set((state) => {
          const newPlans = state.plans.filter((p) => p.id !== id);
          const newActivePlanId = state.activePlanId === id
            ? (newPlans[0]?.id ?? null)
            : state.activePlanId;

          return {
            plans: newPlans,
            activePlanId: newActivePlanId,
          };
        });
      },

      setActivePlanId: (id: string) => {
        set({ activePlanId: id });
      },

      addSemester: (planId: string, year: number, term: Term) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

            // Check if semester already exists
            const exists = plan.semesters.some(
              (s) => s.year === year && s.term === term
            );
            if (exists) return plan;

            // Add and sort
            const newSemesters = sortSemesters([
              ...plan.semesters,
              { year, term, courses: [] },
            ]);

            return { ...plan, semesters: newSemesters };
          }),
        }));
      },

      removeSemester: (planId: string, year: number, term: Term) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

            return {
              ...plan,
              semesters: plan.semesters.filter(
                (s) => !(s.year === year && s.term === term)
              ),
            };
          }),
        }));
      },

      addCourse: (planId: string, year: number, term: Term, course: GuestPlannedCourse) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

            return {
              ...plan,
              semesters: plan.semesters.map((semester) => {
                if (semester.year !== year || semester.term !== term) return semester;

                return {
                  ...semester,
                  courses: [...semester.courses, course],
                };
              }),
            };
          }),
        }));
      },

      removeCourse: (planId: string, year: number, term: Term, courseId: string) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

            return {
              ...plan,
              semesters: plan.semesters.map((semester) => {
                if (semester.year !== year || semester.term !== term) return semester;

                return {
                  ...semester,
                  courses: semester.courses.filter((c) => c.id !== courseId),
                };
              }),
            };
          }),
        }));
      },

      moveCourse: (planId: string, srcYear: number, srcTerm: Term, destYear: number, destTerm: Term, courseId: string) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

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
              return {
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
              };
            }

            return { ...plan, semesters: updatedSemesters };
          }),
        }));
      },

      updateCourseStatus: (planId: string, year: number, term: Term, courseId: string, status: GuestPlannedCourse['status']) => {
        set((state) => ({
          plans: state.plans.map((plan) => {
            if (plan.id !== planId) return plan;

            return {
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
            };
          }),
        }));
      },

      clearAll: () => {
        set({ plans: [], activePlanId: null });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'guest-plans',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
      }),
    }
  )
);

// Selector helpers
export const useGuestActivePlan = () =>
  useGuestPlanStore((s) => s.plans.find((p) => p.id === s.activePlanId) ?? null);

export const useGuestPlanHydrated = () =>
  useGuestPlanStore((s) => s._hasHydrated);
