'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useGuestStore, useGuestHydrated } from '@/stores/guestStore';

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
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Combine Zustand subscription + direct storage check for robustness
  const isGuestMode = isGuest || isGuestFromStorage();

  const isOnboardingPage = pathname === '/onboarding';
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const onboardingCompleted = session?.user?.onboardingCompleted === true;

  useEffect(() => {
    // Wait for hydration
    if (!guestHydrated) return;

    // Authenticated session + guest flag 충돌 해결
    // Google OAuth full-page redirect 후 sessionStorage에 남은 guest flag 정리
    if (isAuthenticated && isGuestMode) {
      exitGuestMode();
      return;
    }

    // Guest bypass (Zustand + sessionStorage fallback)
    if (isGuestMode) return;

    // Wait for session to load
    if (isLoading) return;

    // Not authenticated -> redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // On onboarding page and not yet onboarded -> allow (prevent redirect loop)
    if (isOnboardingPage && !onboardingCompleted) return;

    // Not onboarded -> redirect to onboarding
    if (!onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }

    // Already onboarded but on onboarding page -> redirect to dashboard
    if (isOnboardingPage && onboardingCompleted) {
      router.replace('/dashboard');
      return;
    }
  }, [guestHydrated, isGuestMode, isLoading, isAuthenticated, onboardingCompleted, isOnboardingPage, router, exitGuestMode]);

  // Rule 1: Guest store still hydrating -> spinner
  if (!guestHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Rule 2: Guest mode -> render children (Zustand + sessionStorage fallback)
  if (isGuestMode) return <>{children}</>;

  // Rule 3: Session loading -> spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Rule 4: Not authenticated -> show nothing (useEffect handles redirect)
  if (!isAuthenticated) return null;

  // Rule 5: On onboarding page and not yet onboarded -> allow
  if (isOnboardingPage && !onboardingCompleted) return <>{children}</>;

  // Rule 6: Not onboarded -> show nothing (useEffect handles redirect)
  if (!onboardingCompleted) return null;

  // Rule 7: On onboarding page but already onboarded -> show nothing (useEffect handles redirect)
  if (isOnboardingPage && onboardingCompleted) return null;

  // Rule 8: Authenticated + onboarded + not on onboarding -> render children
  return <>{children}</>;
}
