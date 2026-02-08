'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input } from '@/components/ui';

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

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
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
    <div className="flex-1 flex">
      {/* Left Panel - Branded Gradient */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 bg-gradient-to-r from-[#003E7E] via-[#153974] to-[#3069B3] animate-gradient relative overflow-hidden">
        {/* Mesh Overlay */}
        <div className="absolute inset-0 bg-mesh opacity-30" />

        {/* Floating Decorative Shapes */}
        <div className="absolute top-24 right-24 w-36 h-36 bg-white/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-40 left-32 w-44 h-44 bg-white/20 rounded-full blur-xl animate-float anim-delay-400" />
        <div className="absolute top-1/3 left-24 w-28 h-28 bg-white/20 rounded-full blur-xl animate-float anim-delay-600" />

        {/* Content */}
        <div className="relative z-10 flex items-center justify-center p-12 animate-fade-in">
          <div className="max-w-lg text-white">
            <Image src="/yu-logo-white.svg" alt="영남대학교" className="h-12 mb-6" width={120} height={48} style={{ width: 'auto' }} />
            <h1 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight whitespace-pre-line">
              영남대학교{'\n'}YU the Future
            </h1>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">체계적인 학기별 수강 관리</h3>
                  <p className="text-blue-100">4년간의 수강 계획을 한 곳에서 관리하세요</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">졸업 요건 실시간 추적</h3>
                  <p className="text-blue-100">언제든지 졸업까지 필요한 학점을 확인하세요</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-1">스마트한 선수과목 검증</h3>
                  <p className="text-blue-100">자동으로 선수과목을 확인하고 최적의 순서를 제안합니다</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-500">새 계정을 만들어보세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="6자 이상"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                비밀번호 확인
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting || isLoading}>
              회원가입
            </Button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[#153974] hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
