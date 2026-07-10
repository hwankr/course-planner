'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { handleCredentialSignIn } from '@/lib/auth/login-message';
import { useGuestStore } from '@/stores/guestStore';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isGuest, enterGuestMode, exitGuestMode } = useGuestStore();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  const login = useCallback(
    async (email: string, password: string) => {
      await handleCredentialSignIn(() =>
        signIn('credentials', {
          email,
          password,
          redirect: false,
        })
      );

      // 비회원 모드였을 경우 해제 (멱등 - 비회원 아니어도 안전)
      exitGuestMode();

      router.push('/planner');
      router.refresh();
    },
    [router, exitGuestMode]
  );

  const loginWithGoogle = useCallback(async () => {
    // signIn('google')은 full-page redirect를 트리거하므로
    // exitGuestMode()를 반드시 signIn 이전에 호출해야 함
    exitGuestMode();
    await signIn('google', { callbackUrl: '/planner' });
  }, [exitGuestMode]);

  const logout = useCallback(async () => {
    if (isGuest) {
      exitGuestMode();
      router.push('/');
      return;
    }
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  }, [router, isGuest, exitGuestMode]);

  const register = useCallback(
    async (data: { email: string; password: string; name: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const registrationResult = await response.json();

      if (!registrationResult.success) {
        throw new Error(registrationResult.error);
      }

      // 회원가입 후 자동 로그인
      await login(data.email, data.password);
    },
    [login]
  );

  const startGuestMode = useCallback(() => {
    enterGuestMode();
    window.location.href = '/planner';
  }, [enterGuestMode]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isGuest,
    login,
    loginWithGoogle,
    logout,
    register,
    startGuestMode,
  };
}
