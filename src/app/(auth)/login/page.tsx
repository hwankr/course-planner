'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGuestStore } from '@/stores/guestStore';
import { Button, Input } from '@/components/ui';
import { AuthIntro } from '@/app/_components/AuthIntro';
import { LOGIN_FAILURE_MESSAGE } from '@/lib/auth/login-message';
import { detectInAppBrowser, openInExternalBrowser } from '@/lib/inapp-browser';

const LOGIN_FEATURES = [
  { title: '드래그앤드롭으로 학기 배치', description: '직관적인 인터페이스로 쉽게 수강 계획을 세우세요' },
  { title: '실시간 졸업 요건 추적', description: '현재 진행 상황을 한눈에 파악하세요' },
  { title: '다른 사람들의 수강 계획 참고', description: '같은 학과 학생들의 수강 계획을 참고하세요' },
];

export default function LoginPage() {
  const { login, loginWithGoogle, isLoading } = useAuth();
  const enterGuestMode = useGuestStore((s) => s.enterGuestMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inAppInfo, setInAppInfo] = useState<{ isInApp: boolean; appName: string | null; isIOS: boolean }>({ isInApp: false, appName: null, isIOS: false });

  useEffect(() => {
    const authError = new URLSearchParams(window.location.search).get('error');
    const messages: Record<string, string> = {
      CredentialsSignin: '이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.',
      OAuthAccountNotLinked: '이미 다른 로그인 방식으로 가입한 이메일입니다. 기존 방식으로 로그인해주세요.',
      AccessDenied: '로그인 접근이 거부되었습니다. 계정 권한을 확인해주세요.',
      Callback: '로그인을 완료하지 못했습니다. 다시 시도해주세요.',
    };
    if (authError) setError(messages[authError] || '로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
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
    } catch {
      setError(LOGIN_FAILURE_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-wrap items-stretch bg-white text-ink">
      <AuthIntro features={LOGIN_FEATURES} />

      <section
        aria-labelledby="login-title"
        className="flex min-w-0 flex-[1_1_420px] flex-col items-center justify-center px-5 pt-10 pb-16 min-[900px]:px-16 min-[900px]:pt-10"
      >
        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-1.5">
            <h1 id="login-title" className="text-[26px] leading-[34px] font-bold tracking-[-0.02em]">
              로그인
            </h1>
            <p className="text-[14px] leading-5 text-ink-2">계정에 로그인하세요</p>
          </div>

          {/* Google Login */}
          {inAppInfo.isInApp ? (
            <div role="note" className="flex flex-col gap-2 border-y border-line-2 py-4">
              <p className="text-[14px] leading-5 font-semibold text-ink">
                {inAppInfo.appName || '앱'} 내 브라우저에서는 Google 로그인이 지원되지 않습니다.
              </p>
              {inAppInfo.isIOS ? (
                <p className="text-[13px] leading-[18px] text-ink-2">
                  하단의 <span className="font-semibold text-ink">ꞏꞏꞏ</span> 또는{' '}
                  <span className="font-semibold text-ink">공유</span> 버튼을 눌러
                  <span className="font-semibold text-ink"> &quot;Safari로 열기&quot;</span>를 선택해주세요.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="textPrimary"
                  className="-ml-2.5 h-11 self-start px-2.5 text-[14px]"
                  onClick={() => openInExternalBrowser()}
                >
                  외부 브라우저에서 열기
                  <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full gap-2.5 text-[15px]"
              onClick={loginWithGoogle}
            >
              <Globe aria-hidden="true" className="h-[18px] w-[18px]" />
              Google 계정으로 계속하기
            </Button>
          )}

          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px flex-auto bg-line" />
            <span className="text-[13px] text-ink-2">또는</span>
            <span aria-hidden="true" className="h-px flex-auto bg-line" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="flex flex-col gap-5">
              <Input
                id="email"
                type="email"
                label="이메일"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
              <Input
                id="password"
                type="password"
                label="비밀번호"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p role="alert" className="-mt-2 text-[13px] leading-[18px] font-medium text-negative">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-[52px] w-full text-[16px]"
              isLoading={isSubmitting || isLoading}
            >
              로그인
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleGuestMode}
              className="-my-3 inline-flex min-h-11 cursor-pointer items-center gap-1 text-[14px] font-semibold text-ink transition-colors duration-150 ease-out hover:text-primary"
            >
              비회원으로 체험하기
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
            <span className="text-[14px] text-ink-2">
              계정이 없으세요?{' '}
              <Link
                href="/register"
                className="-my-3 inline-block py-3 font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
              >
                회원가입
              </Link>
            </span>
          </div>
          <p className="text-[13px] leading-[18px] text-ink-2">
            비회원은 데이터가 이 브라우저에만 저장되고, 학과 통계에 반영되지 않습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
