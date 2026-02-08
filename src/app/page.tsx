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
  Clock3,
  BookOpen,
  GraduationCap,
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
          HERO SECTION
          ========================================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pb-20 pt-16 sm:pb-24 sm:pt-20 lg:pb-32 lg:pt-28">
        {/* Background mesh overlay */}
        <div className="absolute inset-0 bg-mesh" />

        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#153974]/20 rounded-full blur-3xl animate-gradient" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-[#00AACA]/15 rounded-full blur-3xl animate-gradient anim-delay-300" />
          <div className="absolute bottom-32 left-1/3 w-80 h-80 bg-[#3069B3]/15 rounded-full blur-3xl animate-gradient anim-delay-500" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-7xl mx-auto">
            {/* Left column - Text content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#00AACA]/30 mb-8 animate-scale-in">
                <Sparkles className="w-4 h-4 text-[#153974]" />
                <span className="text-sm font-medium text-gray-700">
                  YU the Future
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tighter animate-fade-in-up anim-delay-100">
                <span className="block text-gray-900">영남대 수강 계획을</span>
                <span className="block text-gradient">완벽하게</span>
              </h1>

              {/* Description */}
              <p className="text-base lg:text-lg text-gray-600 mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0 animate-fade-in-up anim-delay-200">
                1학년부터 졸업까지, 수강 계획을 한눈에 세우세요. 다른 사람들의
                수강 이력을 참고하고, 나만의 졸업 로드맵을 완성하세요.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mt-10 animate-fade-in-up anim-delay-300">
                <Link href="/login">
                  <Button
                    size="lg"
                    className="group shadow-lg shadow-[#153974]/25"
                  >
                    바로 시작하기
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="ghost" size="lg" onClick={handleGuestMode}>
                  비회원으로 체험하기
                </Button>
              </div>

              {/* Small Notice */}
              <p className="text-sm text-gray-400 mt-4 animate-fade-in-up anim-delay-300 text-center lg:text-left">
                비회원은 데이터가 저장되지 않습니다
              </p>

              {/* Stat boxes */}
              <div className="grid grid-cols-3 gap-3 mt-12 max-w-md mx-auto lg:mx-0">
                <div className="glass backdrop-blur-sm rounded-2xl p-4 text-center animate-fade-in-up anim-delay-100">
                  <div className="text-2xl font-bold text-gradient">4년</div>
                  <div className="text-xs text-gray-500 mt-1">전체 학기 관리</div>
                </div>
                <div className="glass backdrop-blur-sm rounded-2xl p-4 text-center animate-fade-in-up anim-delay-200">
                  <div className="text-2xl font-bold text-gradient">130+</div>
                  <div className="text-xs text-gray-500 mt-1">학점 추적</div>
                </div>
                <div className="glass backdrop-blur-sm rounded-2xl p-4 text-center animate-fade-in-up anim-delay-300">
                  <div className="text-2xl font-bold text-gradient">100%</div>
                  <div className="text-xs text-gray-500 mt-1">졸업 요건 달성</div>
                </div>
              </div>
            </div>

            {/* Right column - Mock planner card */}
            <div className="hidden lg:block animate-float">
              <div className="glass-strong rounded-3xl p-6 shadow-2xl shadow-slate-400/30 max-w-md mx-auto">
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      2025년 1학기
                    </h3>
                    <p className="text-sm text-gray-500">18학점 수강중</p>
                  </div>
                  <div className="text-xs font-medium text-[#153974] bg-[#153974]/10 rounded-full px-3 py-1">
                    4학년
                  </div>
                </div>

                {/* Course items */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border-l-4 border-[#153974]">
                    <div className="w-8 h-8 rounded-lg bg-[#153974]/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#153974]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        캡스톤디자인
                      </div>
                      <div className="text-xs text-gray-500">전공필수 | 3학점</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border-l-4 border-[#3069B3]">
                    <div className="w-8 h-8 rounded-lg bg-[#3069B3]/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#3069B3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        소프트웨어공학
                      </div>
                      <div className="text-xs text-gray-500">전공선택 | 3학점</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border-l-4 border-[#00AACA]">
                    <div className="w-8 h-8 rounded-lg bg-[#00AACA]/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#00AACA]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        영어커뮤니케이션
                      </div>
                      <div className="text-xs text-gray-500">교양필수 | 3학점</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border-l-4 border-slate-400">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        창의적사고와글쓰기
                      </div>
                      <div className="text-xs text-gray-500">자유선택 | 3학점</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-500">졸업 요건 달성률</span>
                    <span className="font-semibold text-[#153974]">78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#153974] via-[#3069B3] to-[#00AACA] animate-gradient bg-[length:200%_100%]"
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
      <section
        id="overview"
        className="relative py-24 bg-gray-50 scroll-mt-20"
      >
        {/* Background dots pattern */}
        <div className="absolute inset-0 bg-dots opacity-40 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Section heading */}
          <div className="text-center mb-16">
            <div className="section-line mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              왜 YU 수강 플래너인가요?
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              학생들의 수강 계획을 체계적으로 관리할 수 있는 핵심 기능들
            </p>
          </div>

          {/* Feature cards - asymmetric 12-col grid */}
          <div className="grid grid-cols-12 gap-5 max-w-6xl mx-auto">
            {/* Card 1 - spans 7 cols */}
            <div className="col-span-12 md:col-span-7 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover animate-on-scroll scroll-delay-0">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#3069B3] to-[#153974] w-fit mb-6">
                <LayoutGrid className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                드래그앤드롭 플래너
              </h3>
              <p className="text-gray-600 leading-relaxed">
                직관적인 드래그앤드롭으로 학기별 과목을 손쉽게 배치하세요.
                마우스 하나로 과목을 원하는 학기에 끌어놓기만 하면 됩니다.
              </p>
            </div>

            {/* Card 2 - spans 5 cols */}
            <div className="col-span-12 md:col-span-5 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover animate-on-scroll scroll-delay-150">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00AACA] to-[#3069B3] w-fit mb-6">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                졸업 요건 추적
              </h3>
              <p className="text-gray-600 leading-relaxed">
                전공필수, 교양, 자유선택 등 모든 졸업 요건을 한눈에
                확인하세요.
              </p>
            </div>

            {/* Card 3 - spans 5 cols */}
            <div className="col-span-12 md:col-span-5 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover animate-on-scroll scroll-delay-300">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#153974] to-[#003E7E] w-fit mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                다른 사람들의 수강 계획 참고
              </h3>
              <p className="text-gray-600 leading-relaxed">
                같은 학과 학생들의 수강 계획을 참고하여 나만의 최적 로드맵을
                설계하세요.
              </p>
            </div>

            {/* Card 4 - spans 7 cols */}
            <div className="col-span-12 md:col-span-7 bg-white rounded-2xl p-8 shadow-sm border border-gray-100 card-hover animate-on-scroll scroll-delay-450">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#153974] to-[#00AACA] w-fit mb-6">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                통계 기반 의사결정
              </h3>
              <p className="text-gray-600 leading-relaxed">
                학과별 인기 과목, 학기별 수강 통계를 확인하고 데이터에 기반한
                수강 결정을 내리세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          USAGE FLOW SECTION (#flow)
          ========================================== */}
      <section id="flow" className="relative py-24 bg-white scroll-mt-20">
        <div className="container mx-auto px-4">
          {/* Section heading */}
          <div className="text-center mb-16">
            <div className="section-line mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
              이렇게 사용하세요
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              3단계로 간단하게 나만의 수강 계획을 완성하세요
            </p>
          </div>

          {/* Steps */}
          <ol className="relative max-w-2xl mx-auto space-y-8">
            {/* Vertical connection line */}
            <div className="absolute left-[19px] sm:left-[19px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-[#153974]/20 via-[#3069B3]/20 to-[#00AACA]/20 pointer-events-none" />

            {/* Step 1 */}
            <li className="animate-on-scroll scroll-delay-0">
              <div className="glass rounded-2xl p-6 border-l-4 border-[#153974] ml-12 sm:ml-14">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-gradient text-2xl sm:text-3xl font-bold">
                      01
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      회원가입 또는 게스트 모드
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      구글 계정으로 간편하게 가입하거나, 비회원으로 바로
                      체험해보세요. 가입 후 학과와 입학년도를 설정하면
                      맞춤형 졸업 요건이 자동으로 적용됩니다.
                    </p>
                  </div>
                </div>
              </div>
              {/* Icon on the timeline */}
              <div className="absolute left-0 mt-[-52px]">
                <div className="rounded-full border-2 border-[#153974]/30 p-2.5 bg-white relative z-10">
                  <MousePointerClick className="w-4 h-4 text-[#153974]" />
                </div>
              </div>
            </li>

            {/* Step 2 */}
            <li className="animate-on-scroll scroll-delay-200">
              <div className="glass rounded-2xl p-6 border-l-4 border-[#153974] ml-12 sm:ml-14">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-gradient text-2xl sm:text-3xl font-bold">
                      02
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      과목 배치 및 계획 수립
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      과목 카탈로그에서 원하는 과목을 검색하고, 드래그앤드롭으로
                      학기별로 배치하세요. 선수과목 관계도 자동으로
                      확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
              {/* Icon on the timeline */}
              <div className="absolute left-0 mt-[-52px]">
                <div className="rounded-full border-2 border-[#153974]/30 p-2.5 bg-white relative z-10">
                  <LayoutGrid className="w-4 h-4 text-[#3069B3]" />
                </div>
              </div>
            </li>

            {/* Step 3 */}
            <li className="animate-on-scroll scroll-delay-400">
              <div className="glass rounded-2xl p-6 border-l-4 border-[#153974] ml-12 sm:ml-14">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="text-gradient text-2xl sm:text-3xl font-bold">
                      03
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      졸업 요건 확인 및 완성
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      실시간으로 졸업 요건 달성률을 확인하고, 부족한 영역을
                      파악하세요. 다른 학생들의 계획을 참고하여 최적의
                      졸업 로드맵을 완성합니다.
                    </p>
                  </div>
                </div>
              </div>
              {/* Icon on the timeline */}
              <div className="absolute left-0 mt-[-52px]">
                <div className="rounded-full border-2 border-[#153974]/30 p-2.5 bg-white relative z-10">
                  <CheckCircle className="w-4 h-4 text-[#00AACA]" />
                </div>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ==========================================
          CTA SECTION (#features)
          ========================================== */}
      <section
        id="features"
        className="relative py-24 bg-gradient-to-b from-slate-50 to-slate-100/80 scroll-mt-20"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto animate-on-scroll">
            <div className="glass-strong gradient-border rounded-[2rem] p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
              {/* Subtle mesh bg overlay */}
              <div className="absolute inset-0 bg-mesh opacity-20 rounded-[2rem] pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient tracking-tight">
                  지금 바로 수강 계획을 시작하세요
                </h2>
                <p className="text-gray-600 mb-10 max-w-lg mx-auto leading-relaxed">
                  체계적인 수강 계획으로 졸업까지의 여정을 한눈에 관리하세요.
                  지금 시작하면 가장 빠릅니다.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                  <Link href="/login">
                    <Button
                      size="lg"
                      className="group shadow-glow"
                    >
                      바로 시작하기
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleGuestMode}
                  >
                    비회원으로 체험하기
                  </Button>
                </div>

                {/* Trust signal */}
                <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2">
                  <Clock3 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    가입 없이 바로 체험 가능
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
