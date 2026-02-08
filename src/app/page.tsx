'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui';
import { useGuestStore } from '@/stores/guestStore';
import {
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Target,
  Users,
  GripVertical,
  BarChart3,
  Smartphone,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const enterGuestMode = useGuestStore((s) => s.enterGuestMode);

  // 로그인된 사용자는 플래너로 리다이렉트
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/planner');
    }
  }, [status, router]);

  const handleGuestMode = () => {
    enterGuestMode();
    router.push('/planner');
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 animate-fade-in-down">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/yu-logo.svg" alt="영남대학교" className="h-6" width={60} height={24} style={{ width: 'auto' }} />
            <h1 className="text-xl font-bold text-gradient">YU 수강 플래너</h1>
          </div>
          {status === 'authenticated' ? (
            <Link href="/planner" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              플래너로 이동
            </Link>
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              로그인
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-mesh overflow-hidden">
        {/* Decorative Floating Shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#153974]/20 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-[#00AACA]/20 rounded-full blur-3xl animate-float anim-delay-300" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-[#3069B3]/15 rounded-full blur-3xl animate-float anim-delay-500" />
          <div className="absolute bottom-40 right-1/4 w-64 h-64 bg-[#00AACA]/10 rounded-full blur-3xl animate-float anim-delay-700" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00AACA]/30 mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4 text-[#153974]" />
              <span className="text-sm font-medium text-gray-700">YU the Future</span>
            </div>

            {/* Logo */}
            <Image src="/yu-logo.svg" alt="영남대학교" className="h-10 mx-auto mb-4 animate-fade-in-up anim-delay-50" width={100} height={40} style={{ width: 'auto' }} />

            {/* Title */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up anim-delay-100">
              <span className="block text-gray-900">영남대 수강 계획을</span>
              <span className="block text-gradient">완벽하게</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto animate-fade-in-up anim-delay-200">
              영남대학교 학생을 위한 수강 계획 시스템. 학기별 과목을 드래그앤드롭으로 배치하고, 졸업 요건을 체계적으로 추적하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4 animate-fade-in-up anim-delay-300">
              <Link href="/login">
                <Button size="lg" className="group">
                  지금 시작하기
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" onClick={handleGuestMode}>
                비회원으로 체험하기
              </Button>
            </div>

            {/* Small Notice */}
            <p className="text-sm text-gray-400 animate-fade-in-up anim-delay-300">
              비회원은 데이터가 저장되지 않습니다
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 bg-dots bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              왜 YU 수강 플래너인가요?
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-[#153974] to-[#00AACA] mx-auto rounded-full" />
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 border-t-4 border-t-[#153974] card-hover animate-fade-in-up anim-delay-200">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3069B3] to-[#153974] flex items-center justify-center mb-6">
                <LayoutGrid className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">드래그앤드롭 플래너</h3>
              <p className="text-gray-600 leading-relaxed">
                직관적인 드래그앤드롭으로 학기별 과목을 손쉽게 배치하세요.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 border-t-4 border-t-[#00AACA] card-hover animate-fade-in-up anim-delay-400">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00AACA] to-[#3069B3] flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">졸업 요건 추적</h3>
              <p className="text-gray-600 leading-relaxed">
                전공필수, 교양, 자유선택 등 모든 졸업 요건을 한눈에 확인하세요.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 border-t-4 border-t-[#3069B3] card-hover animate-fade-in-up anim-delay-600">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#153974] to-[#003E7E] flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">비회원 체험 모드</h3>
              <p className="text-gray-600 leading-relaxed">
                회원가입 없이 바로 체험해보세요. 모든 기능을 자유롭게 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Band */}
      <section className="relative py-16 bg-gradient-to-r from-[#003E7E] via-[#153974] to-[#003E7E] text-white overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Stat 1 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <GripVertical className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">간편한 드래그앤드롭</h3>
              <p className="text-blue-100">과목을 끌어서 학기에 배치</p>
            </div>

            {/* Stat 2 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">실시간 졸업 추적</h3>
              <p className="text-blue-100">진행률을 한눈에 확인</p>
            </div>

            {/* Stat 3 */}
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">모바일 반응형 지원</h3>
              <p className="text-blue-100">어디서든 수강 계획 관리</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="relative py-20 bg-mesh text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-[#00AACA]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#153974]/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            지금 바로 수강 계획을 시작하세요
          </h2>
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-[#153974] to-[#3069B3] hover:from-[#003E7E] hover:to-[#153974] text-white shadow-xl shadow-[#153974]/20">
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-gray-200 py-8 bg-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} YU 수강 플래너 - 영남대학교. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
