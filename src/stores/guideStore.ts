'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GuideState {
  tourCompleted: boolean;
  tourDismissed: boolean;
  seenTips: Record<string, boolean>;
  currentTourStep: number | null;
  _hasHydrated: boolean;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  completeTour: () => void;
  dismissTour: () => void;
  markTipSeen: (tipId: string) => void;
  resetGuide: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGuideStore = create<GuideState>()(
  persist(
    (set) => ({
      tourCompleted: false,
      tourDismissed: false,
      seenTips: {},
      currentTourStep: null,
      _hasHydrated: false,
      startTour: () => set({ currentTourStep: 0, tourDismissed: false }),
      nextStep: () =>
        set((state) => ({
          currentTourStep:
            state.currentTourStep !== null ? state.currentTourStep + 1 : null,
        })),
      prevStep: () =>
        set((state) => ({
          currentTourStep:
            state.currentTourStep !== null && state.currentTourStep > 0
              ? state.currentTourStep - 1
              : state.currentTourStep,
        })),
      completeTour: () =>
        set({ tourCompleted: true, currentTourStep: null }),
      dismissTour: () =>
        set({ tourDismissed: true, currentTourStep: null }),
      markTipSeen: (tipId: string) =>
        set((state) => ({
          seenTips: { ...state.seenTips, [tipId]: true },
        })),
      resetGuide: () =>
        set({
          tourCompleted: false,
          tourDismissed: false,
          seenTips: {},
          currentTourStep: null,
        }),
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'guide-state',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        tourCompleted: state.tourCompleted,
        tourDismissed: state.tourDismissed,
        seenTips: state.seenTips,
        currentTourStep: state.currentTourStep,
      }),
    }
  )
);

// Selector for hydration status
export const useGuideHydrated = () =>
  useGuideStore((state) => state._hasHydrated);
