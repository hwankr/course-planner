import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MajorType } from '@/types';

interface GuestProfileState {
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentCollege: string | null;
  majorType: MajorType;
  secondaryDepartmentId: string | null;
  secondaryDepartmentName: string | null;
  secondaryDepartmentCollege: string | null;
  enrollmentYear: number | null;
  _hasHydrated: boolean;

  // Actions
  setProfile: (data: {
    name?: string;
    departmentId?: string;
    departmentName?: string;
    departmentCollege?: string;
    majorType?: MajorType;
    secondaryDepartmentId?: string;
    secondaryDepartmentName?: string;
    secondaryDepartmentCollege?: string;
    enrollmentYear?: number;
  }) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState = {
  name: '게스트',
  departmentId: null,
  departmentName: null,
  departmentCollege: null,
  majorType: 'single' as MajorType,
  secondaryDepartmentId: null,
  secondaryDepartmentName: null,
  secondaryDepartmentCollege: null,
  enrollmentYear: null,
  _hasHydrated: false,
};

export const useGuestProfileStore = create<GuestProfileState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfile: (data) => {
        set((state) => ({
          ...state,
          ...data,
        }));
      },

      reset: () => {
        set({
          name: initialState.name,
          departmentId: initialState.departmentId,
          departmentName: initialState.departmentName,
          departmentCollege: initialState.departmentCollege,
          majorType: initialState.majorType,
          secondaryDepartmentId: initialState.secondaryDepartmentId,
          secondaryDepartmentName: initialState.secondaryDepartmentName,
          secondaryDepartmentCollege: initialState.secondaryDepartmentCollege,
          enrollmentYear: initialState.enrollmentYear,
        });
      },

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'guest-profile',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        name: state.name,
        departmentId: state.departmentId,
        departmentName: state.departmentName,
        departmentCollege: state.departmentCollege,
        majorType: state.majorType,
        secondaryDepartmentId: state.secondaryDepartmentId,
        secondaryDepartmentName: state.secondaryDepartmentName,
        secondaryDepartmentCollege: state.secondaryDepartmentCollege,
        enrollmentYear: state.enrollmentYear,
      }),
    }
  )
);

// Selector helper
export const useGuestProfileHydrated = () =>
  useGuestProfileStore((s) => s._hasHydrated);
