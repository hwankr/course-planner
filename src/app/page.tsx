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
  BookOpen,
  MousePointerClick,
  CheckCircle,
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

  // Scroll-triggered animation observer
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const elements = document.querySelectorAll('.animate-on-scroll');

    if (prefersReducedMotion) {
      elements.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleGuestMode = () => {
    enterGuestMode();
    router.push('/planner');
  };

  return (
    <main className="min-h-screen bg-white">
      {/* ==========================================
          STICKY NAVIGATION
          ========================================== */}
      <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 animate-fade-in-down">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/yu-logo.svg"
              alt="영남대학교"
              className="h-6"
              width={60}
              height={24}
              style={{ width: 'auto' }}
            />
            <h1 className="text-xl font-bold text-gradient">YU 수강 플래너</h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Section nav links - hidden on mobile */}
            <div className="hidden md:flex items-center gap-5">
              <a
                href="#overview"
                className="text-sm text-gray-500 hover:text-[#153974] transition-colors"
              >
                서비스 소개
              </a>
              <a
                href="#flow"
                className="text-sm text-gray-500 hover:text-[#153974] transition-colors"
              >
                이용 방법
              </a>
              <a
                href="#features"
                className="text-sm text-gray-500 hover:text-[#153974] transition-colors"
              >
                시작하기
              </a>
            </div>

            {status === 'authenticated' ? (
              <Link
                href="/planner"
                className="rounded-full border border-[#153974]/20 bg-[#153974]/5 px-4 py-1.5 text-sm font-medium text-[#153974] hover:bg-[#153974]/10 transition-colors"
              >
                플래너로 이동
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-[#153974]/20 bg-[#153974]/5 px-4 py-1.5 text-sm font-medium text-[#153974] hover:bg-[#153974]/10 transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ==========================================
          HERO SECTION - "The Opening Horizon"
          ========================================== */}
      <section className="relative min-h-screen flex items-center overflow-hidden clip-hero-bottom">
        {/* Dark navy fullbleed background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1e3d] via-[#153974] to-[#1a2f5a]" />

        {/* Decorative geometric elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 -right-20 deco-ring deco-ring-lg opacity-30" />
          <div className="absolute bottom-40 -left-16 deco-ring deco-ring-sm opacity-20" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#3069B3]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#00AACA]/[0.08] rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            {/* Left column - Text */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-8 animate-scale-in">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-sm font-medium text-white/80">
                  YU the Future
                </span>
              </div>

              {/* Title - white text with cyan gradient accent */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tighter animate-fade-in-up anim-delay-100">
                <span className="block text-white/90">영남대 수강 계획을</span>
                <span className="block text-gradient-light">완벽하게</span>
              </h1>

              {/* Description */}
              <p className="text-base lg:text-lg text-white/60 mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up anim-delay-200">
                1학년부터 졸업까지, 수강 계획을 한눈에 세우세요. 다른 사람들의
                수강 이력을 참고하고, 나만의 졸업 로드맵을 완성하세요.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mt-10 animate-fade-in-up anim-delay-300">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="bg-white text-[#153974] hover:bg-white/90 shadow-lg shadow-black/20 group"
                  >
                    바로 시작하기
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleGuestMode}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  비회원으로 체험하기
                </Button>
              </div>

              {/* Small Notice */}
              <p className="text-sm text-white/40 mt-4 animate-fade-in-up anim-delay-300 text-center lg:text-left">
                비회원은 데이터가 저장되지 않습니다
              </p>

              {/* Inline Stats - NO CARDS */}
              <div className="flex items-center justify-center lg:justify-start gap-6 mt-12 animate-fade-in-up anim-delay-400">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4년</div>
                  <div className="text-xs text-white/50 mt-1">전체 학기 관리</div>
                </div>
                <div className="stat-separator" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">130+</div>
                  <div className="text-xs text-white/50 mt-1">학점 추적</div>
                </div>
                <div className="stat-separator" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">100%</div>
                  <div className="text-xs text-white/50 mt-1">졸업 요건 달성</div>
                </div>
              </div>
            </div>

            {/* Right column - Mock planner (desktop only, NO animate-float) */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm mx-auto">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      2025년 1학기
                    </h3>
                    <p className="text-sm text-white/50">18학점 수강중</p>
                  </div>
                  <div className="text-xs font-medium text-[#00AACA] bg-[#00AACA]/10 rounded-full px-3 py-1">
                    4학년
                  </div>
                </div>

                {/* Course items - only 3 */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border-l-4 border-[#153974]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        캡스톤디자인
                      </div>
                      <div className="text-xs text-white/40">
                        전공필수 | 3학점
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border-l-4 border-[#3069B3]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        소프트웨어공학
                      </div>
                      <div className="text-xs text-white/40">
                        전공선택 | 3학점
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border-l-4 border-[#00AACA]">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        영어커뮤니케이션
                      </div>
                      <div className="text-xs text-white/40">
                        교양필수 | 3학점
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-white/50">졸업 요건 달성률</span>
                    <span className="font-semibold text-[#00AACA]">78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA]"
                      style={{ width: '78%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SERVICE OVERVIEW SECTION (#overview)
          ========================================== */}
      <section id="overview" className="relative py-24 bg-white scroll-mt-20">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -left-64 top-20 w-[500px] h-[500px] rounded-full bg-[#00AACA]/5" />
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-dots opacity-20" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section heading - left aligned on desktop */}
          <div className="text-center md:text-left max-w-3xl mb-20 animate-on-scroll">
            <p className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00AACA] mb-3">
              SERVICE
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              왜 YU 수강 플래너인가요?
            </h2>
            <p className="text-gray-500 max-w-lg">
              학생들의 수강 계획을 체계적으로 관리할 수 있는 핵심 기능들
            </p>
          </div>

          {/* Feature rows - alternating layout */}
          <div className="space-y-16 md:space-y-24 max-w-6xl mx-auto">
            {/* Row 1: Number left, Text right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-on-scroll scroll-delay-0">
              <div className="relative flex justify-center md:justify-end">
                <span className="deco-number">01</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="deco-dot-accent" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    드래그앤드롭 플래너
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  직관적인 드래그앤드롭으로 학기별 과목을 손쉽게 배치하세요.
                  마우스 하나로 과목을 원하는 학기에 끌어놓기만 하면 됩니다.
                </p>
              </div>
            </div>

            {/* Row 2: Text left, Number right (reversed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-on-scroll scroll-delay-100">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="deco-dot-accent" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    졸업 요건 추적
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  전공필수, 교양, 자유선택 등 모든 졸업 요건을 한눈에
                  확인하세요.
                </p>
              </div>
              <div className="relative flex justify-center md:justify-start order-1 md:order-2">
                <span className="deco-number">02</span>
              </div>
            </div>

            {/* Row 3: Number left, Text right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-on-scroll scroll-delay-200">
              <div className="relative flex justify-center md:justify-end">
                <span className="deco-number">03</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="deco-dot-accent" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    다른 사람들의 수강 계획 참고
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  같은 학과 학생들의 수강 계획을 참고하여 나만의 최적 로드맵을
                  설계하세요.
                </p>
              </div>
            </div>

            {/* Row 4: Text left, Number right (reversed) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center animate-on-scroll scroll-delay-300">
              <div className="order-2 md:order-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="deco-dot-accent" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    통계 기반 의사결정
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  학과별 인기 과목, 학기별 수강 통계를 확인하고 데이터에 기반한
                  수강 결정을 내리세요.
                </p>
              </div>
              <div className="relative flex justify-center md:justify-start order-1 md:order-2">
                <span className="deco-number">04</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          USAGE FLOW SECTION (#flow) - Dark Navy
          ========================================== */}
      <section id="flow" className="relative scroll-mt-20">
        <div className="relative bg-gradient-to-br from-[#0f2847] to-[#153974] clip-diagonal-both py-32 md:py-40">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-5" />
            <div className="absolute top-10 right-10 deco-ring deco-ring-lg opacity-10" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            {/* Section heading */}
            <div className="text-center mb-16 animate-on-scroll">
              <p className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00AACA] mb-3">
                HOW IT WORKS
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                이렇게 사용하세요
              </h2>
              <p className="text-white/60 max-w-lg mx-auto">
                3단계로 간단하게 나만의 수강 계획을 완성하세요
              </p>
            </div>

            {/* Desktop: horizontal 3-column with dividers */}
            <div className="hidden md:flex items-start justify-center max-w-5xl mx-auto">
              {/* Step 1 */}
              <div className="flex-1 text-center px-8 animate-on-scroll scroll-delay-0">
                <span className="deco-number deco-number-light block mb-4">
                  01
                </span>
                <MousePointerClick className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">가입</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  구글 계정으로 간편하게 가입하거나, 비회원으로 바로
                  체험해보세요.
                </p>
              </div>

              <div className="divider-vertical-gradient self-stretch my-8" />

              {/* Step 2 */}
              <div className="flex-1 text-center px-8 animate-on-scroll scroll-delay-150">
                <span className="deco-number deco-number-light block mb-4">
                  02
                </span>
                <LayoutGrid className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">계획</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  과목을 검색하고 드래그앤드롭으로 학기별로 배치하세요.
                </p>
              </div>

              <div className="divider-vertical-gradient self-stretch my-8" />

              {/* Step 3 */}
              <div className="flex-1 text-center px-8 animate-on-scroll scroll-delay-300">
                <span className="deco-number deco-number-light block mb-4">
                  03
                </span>
                <CheckCircle className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">완성</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  졸업 요건 달성률을 확인하고 최적의 로드맵을 완성하세요.
                </p>
              </div>
            </div>

            {/* Mobile: vertical stack with horizontal dividers */}
            <div className="md:hidden space-y-0">
              {/* Step 1 */}
              <div className="text-center py-8 animate-on-scroll scroll-delay-0">
                <span
                  className="deco-number deco-number-light block mb-4"
                  style={{ fontSize: '56px' }}
                >
                  01
                </span>
                <MousePointerClick className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">가입</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  구글 계정으로 간편하게 가입하거나, 비회원으로 바로
                  체험해보세요.
                </p>
              </div>

              <div className="divider-horizontal-gradient mx-auto w-3/4 my-2" />

              {/* Step 2 */}
              <div className="text-center py-8 animate-on-scroll scroll-delay-100">
                <span
                  className="deco-number deco-number-light block mb-4"
                  style={{ fontSize: '56px' }}
                >
                  02
                </span>
                <LayoutGrid className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">계획</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  과목을 검색하고 드래그앤드롭으로 학기별로 배치하세요.
                </p>
              </div>

              <div className="divider-horizontal-gradient mx-auto w-3/4 my-2" />

              {/* Step 3 */}
              <div className="text-center py-8 animate-on-scroll scroll-delay-200">
                <span
                  className="deco-number deco-number-light block mb-4"
                  style={{ fontSize: '56px' }}
                >
                  03
                </span>
                <CheckCircle className="w-6 h-6 text-[#00AACA] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">완성</h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
                  졸업 요건 달성률을 확인하고 최적의 로드맵을 완성하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          CTA SECTION (#features)
          ========================================== */}
      <section
        id="features"
        className="relative py-24 scroll-mt-20 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#f0f7ff] to-[#e8f4fd]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00AACA]/[0.08] blur-3xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center animate-on-scroll">
            <p className="text-sm uppercase tracking-widest text-[#00AACA] font-medium mb-4">
              지금이 가장 빠릅니다
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              수강 계획을 시작하세요
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed">
              체계적인 수강 계획으로 졸업까지의 여정을 한눈에 관리하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link href="/login">
                <Button size="lg" className="group shadow-glow">
                  바로 시작하기
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="ghost" size="lg" onClick={handleGuestMode}>
                비회원으로 체험하기
              </Button>
            </div>

            <p className="text-sm text-gray-400">가입 없이 바로 체험 가능</p>
          </div>
        </div>
      </section>
    </main>
  );
}
