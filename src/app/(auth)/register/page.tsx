'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';
import { AuthIntro } from '@/app/_components/AuthIntro';

const REGISTER_FEATURES = [
  { title: '체계적인 학기별 수강 관리', description: '4년간의 수강 계획을 한 곳에서 관리하세요' },
  { title: '졸업 요건 실시간 추적', description: '언제든지 졸업까지 필요한 학점을 확인하세요' },
  { title: '다른 사람들의 수강 계획 참고', description: '같은 학과 학생들의 수강 계획을 참고하세요' },
];

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-white text-ink">
      <AuthIntro features={REGISTER_FEATURES} />

      <section
        aria-labelledby="register-title"
        className="flex min-w-0 flex-[1_1_420px] flex-col items-center justify-center px-5 pt-10 pb-16 min-[900px]:px-16 min-[900px]:pt-10"
      >
        <div className="flex w-full max-w-[400px] flex-col gap-7">
          <div className="flex flex-col gap-1.5">
            <h1 id="register-title" className="text-[26px] leading-[34px] font-bold tracking-[-0.02em]">
              회원가입
            </h1>
            <p className="text-[14px] leading-5 text-ink-2">새 계정을 만들어보세요</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <div className="flex flex-col gap-5">
              <Input
                id="name"
                name="name"
                type="text"
                label="이름"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
              />
              <Input
                id="email"
                name="email"
                type="email"
                label="이메일"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                required
              />
              <Input
                id="password"
                name="password"
                type="password"
                label="비밀번호"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8자 이상 (대문자, 소문자, 숫자 포함)"
                helperText="8자 이상, 대문자·소문자·숫자 포함"
                required
              />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="비밀번호 확인"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호 재입력"
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
              회원가입
            </Button>
          </form>

          <p className="text-[14px] text-ink-2">
            이미 계정이 있으세요?{' '}
            <Link
              href="/login"
              className="-my-3 inline-block py-3 font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
            >
              로그인
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
