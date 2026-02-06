import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RequirementCategory, Semester } from '@/types';

export interface GuestCustomCourse {
  _id: string; // guest-course-xxx
  code: string;
  name: string;
  credits: number;
  department: string; // departmentId
  prerequisites: string[];
  description?: string;
  semesters: Semester[];
  category?: RequirementCategory;
  recommendedYear?: number;
  recommendedSemester?: Semester;
  createdBy: string; // 'guest'
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

interface GuestCourseState {
  customCourses: GuestCustomCourse[];
  _hasHydrated: boolean;
  addCourse: (
    course: Omit<
      GuestCustomCourse,
      '_id' | 'createdBy' | 'isActive' | 'createdAt' | 'updatedAt'
    >
  ) => GuestCustomCourse;
  removeCourse: (id: string) => void;
  clearAll: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGuestCourseStore = create<GuestCourseState>()(
  persist(
    (set, get) => ({
      customCourses: [],
      _hasHydrated: false,

      addCourse: (course) => {
        const now = new Date().toISOString();
        const newCourse: GuestCustomCourse = {
          ...course,
          _id: `guest-course-${Date.now().toString(36)}`,
          createdBy: 'guest',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          customCourses: [...state.customCourses, newCourse],
        }));

        return newCourse;
      },

      removeCourse: (id) =>
        set((state) => ({
          customCourses: state.customCourses.filter((c) => c._id !== id),
        })),

      clearAll: () => set({ customCourses: [] }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'guest-courses',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
