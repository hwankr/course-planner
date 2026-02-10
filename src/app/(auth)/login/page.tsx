'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestStore } from '@/stores/guestStore';
import { Button, Input } from '@/components/ui';
import { detectInAppBrowser, openInExternalBrowser } from '@/lib/inapp-browser';

export default function LoginPage() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const enterGuestMode = useGuestStore((s) => s.enterGuestMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string | null; isIOS: boolean }>({ isInApp: false, appName: null, isIOS: false });

  useEffect(() => {
    const info = detectInAppBrowser();
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setInAppInfo({ ...info, isIOS });

    // Android 인앱 브라우저인 경우 자동으로 외부 브라우저 열기 시도
    if (info.isInApp && !isIOS) {
      openInExternalBrowser();
    }
  }, []);

  const handleGuestMode = () => {
    enterGuestMode();
    window.location.href = '/planner';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branded Gradient */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-r from-[#003E7E] via-[#153974] to-[#3069B3] animate-gradient relative overflow-hidden">
        {/* Mesh Overlay */}
        <div className="absolute inset-0 bg-mesh opacity-30" />

        {/* Floating Decorative Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-32 right-32 w-40 h-40 bg-white/20 rounded-full blur-xl animate-float anim-delay-300" />
        <div className="absolute top-1/2 right-20 w-24 h-24 bg-white/20 rounded-full blur-xl animate-float anim-delay-500" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center p-12 animate-fade-in">
          <div className="max-w-lg text-white">
            <Image src="/yu-logo-white.svg" alt="영남대학교" className="h-12 mb-6" width={120} height={48} style={{ width: 'auto' }} />
            <h1 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight whitespace-pre-line">
              영남대학교와 함께하는{'\n'}학업 계획
            </h1>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">드래그앤드롭으로 학기 배치</h3>
                  <p className="text-blue-100">직관적인 인터페이스로 쉽게 수강 계획을 세우세요</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">실시간 졸업 요건 추적</h3>
                  <p className="text-blue-100">현재 진행 상황을 한눈에 파악하세요</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">다른 사람들의 수강 계획 참고</h3>
                  <p className="text-blue-100">같은 학과 학생들의 수강 계획을 참고하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 bg-white">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <Image src="/yu-logo.svg" alt="영남대학교" className="h-6" width={60} height={24} style={{ width: 'auto' }} />
            <h2 className="text-2xl font-bold text-gradient">YU 수강 플래너</h2>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인</h1>
            <p className="text-gray-500">계정에 로그인하세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting || isLoading}>
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            {/* Google Login */}
            {inAppInfo.isInApp ? (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  {inAppInfo.appName || '앱'} 내 브라우저에서는 Google 로그인이 지원되지 않습니다.
                </p>
                {inAppInfo.isIOS ? (
                  <p className="text-xs text-amber-700">
                    하단의 <span className="font-bold">ꞏꞏꞏ</span> 또는 <span className="font-bold">공유</span> 버튼을 눌러
                    <span className="font-bold"> &quot;Safari로 열기&quot;</span>를 선택해주세요.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => openInExternalBrowser()}
                    className="w-full mt-1 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 transition-colors rounded-md py-2"
                  >
                    외부 브라우저에서 열기
                  </button>
                )}
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={loginWithGoogle}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 로그인
              </Button>
            )}

            {/* Guest Mode */}
            <button
              type="button"
              onClick={handleGuestMode}
              className="w-full mt-3 text-sm text-gray-500 hover:text-[#153974] transition-colors py-2"
            >
              비회원으로 시작하기
            </button>
          </div>

          {/* Register Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/register" className="text-[#153974] hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
