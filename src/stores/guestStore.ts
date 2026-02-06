'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GuestState {
  isGuest: boolean;
  _hasHydrated: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      _hasHydrated: false,
      enterGuestMode: () => {
        // Set cookie so server-side proxy can detect guest mode
        document.cookie = 'guest-mode=true;path=/;SameSite=Lax';
        set({ isGuest: true });
      },
      exitGuestMode: () => {
        // Remove guest cookie
        document.cookie = 'guest-mode=;path=/;max-age=0';
        set({ isGuest: false });
      },
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'guest-session',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({ isGuest: state.isGuest }),
    }
  )
);

// Selector for hydration status -- used by OnboardingGuard
export const useGuestHydrated = () =>
  useGuestStore((state) => state._hasHydrated);
