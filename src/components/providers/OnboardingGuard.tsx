'use client';

import { isPublicPage } from './authNavigation';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useGuestStore, useGuestHydrated } from '@/stores/guestStore';
import { useGuestProfileStore, useGuestProfileHydrated } from '@/stores/guestProfileStore';

/** Synchronous fallback: read guest flag directly from sessionStorage */
function isGuestFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem('guest-session');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.state?.isGuest === true;
  } catch {
    return false;
  }
}

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isGuest, exitGuestMode } = useGuestStore();
  const guestHydrated = useGuestHydrated();
  const guestProfileHydrated = useGuestProfileHydrated();
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Combine Zustand subscription + direct storage check for robustness
  const isGuestMode = isGuest || isGuestFromStorage();

  const isOnboardingPage = pathname === '/onboarding';
  const isHelpPage = isPublicPage(pathname);
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const onboardingCompleted = session?.user?.onboardingCompleted === true;

  // Guest onboarding: department must be set
  const guestOnboarded = isGuestMode && !!guestDepartmentId;

  useEffect(() => {
    // Wait for hydration
    if (!guestHydrated || (isGuestMode && !guestProfileHydrated)) return;

    // Authenticated session + guest flag 충돌 해결
    // Google OAuth full-page redirect 후 sessionStorage에 남은 guest flag 정리
    if (isAuthenticated && isGuestMode) {
      exitGuestMode();
      return;
    }

    if (isHelpPage) return;

    // Guest mode routing
    if (isGuestMode) {
      if (!guestOnboarded && !isOnboardingPage && !isHelpPage) {
        // Guest needs onboarding -> redirect
        router.replace('/onboarding');
        return;
      }
      if (guestOnboarded && isOnboardingPage) {
        // Guest already onboarded but on onboarding page -> redirect to planner
        router.replace('/planner');
        return;
      }
      return;
    }

    // Wait for session to load
    if (isLoading) return;

    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      router.replace('/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }

    // On onboarding page and not yet onboarded -> allow (prevent redirect loop)
    if (isOnboardingPage && !onboardingCompleted) return;

    // Not onboarded -> redirect to onboarding (but allow help pages)
    if (!onboardingCompleted && !isHelpPage) {
      router.replace('/onboarding');
      return;
    }

    // Already onboarded but on onboarding page -> redirect to planner
    if (isOnboardingPage && onboardingCompleted) {
      router.replace('/planner');
      return;
    }
  }, [guestHydrated, guestProfileHydrated, isGuestMode, guestOnboarded, isLoading, isAuthenticated, onboardingCompleted, isOnboardingPage, isHelpPage, router, exitGuestMode]);

  if (isHelpPage) return <>{children}</>;

  // Rule 1: Stores still hydrating -> loading status
  if (!guestHydrated || (isGuestMode && !guestProfileHydrated)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <p className="text-[13px] leading-[18px] font-medium text-ink-2 animate-pulse">불러오는 중…</p>
      </div>
    );
  }

  // Rule 2: Guest mode
  if (isGuestMode) {
    // Guest not onboarded and on onboarding or help page -> allow
    if (!guestOnboarded && (isOnboardingPage || isHelpPage)) return <>{children}</>;
    // Guest not onboarded -> show nothing (useEffect handles redirect)
    if (!guestOnboarded) return null;
    // Guest onboarded and on onboarding page -> show nothing (useEffect handles redirect)
    if (isOnboardingPage) return null;
    // Guest onboarded -> render children
    return <>{children}</>;
  }

  // Rule 3: Session loading -> loading status
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
        <p className="text-[13px] leading-[18px] font-medium text-ink-2 animate-pulse">불러오는 중…</p>
      </div>
    );
  }

  // Rule 4: Not authenticated -> show nothing (useEffect handles redirect)
  if (!isAuthenticated) return null;

  // Rule 5: On onboarding or help page and not yet onboarded -> allow
  if ((isOnboardingPage || isHelpPage) && !onboardingCompleted) return <>{children}</>;

  // Rule 6: Not onboarded -> show nothing (useEffect handles redirect)
  if (!onboardingCompleted) return null;

  // Rule 7: On onboarding page but already onboarded -> show nothing (useEffect handles redirect)
  if (isOnboardingPage && onboardingCompleted) return null;

  // Rule 8: Authenticated + onboarded + not on onboarding -> render children
  return <>{children}</>;
}
