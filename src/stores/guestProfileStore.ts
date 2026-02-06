import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GuestProfileState {
  name: string;
  departmentId: string | null;
  departmentName: string | null;
  enrollmentYear: number | null;
  _hasHydrated: boolean;

  // Actions
  setProfile: (data: {
    name?: string;
    departmentId?: string;
    departmentName?: string;
    enrollmentYear?: number;
  }) => void;
  reset: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialState = {
  name: '게스트',
  departmentId: null,
  departmentName: null,
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
        enrollmentYear: state.enrollmentYear,
      }),
    }
  )
);

// Selector helper
export const useGuestProfileHydrated = () =>
  useGuestProfileStore((s) => s._hasHydrated);
