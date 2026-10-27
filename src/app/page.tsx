'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import { useGuestStore } from '@/stores/guestStore';
import { LandingPreview } from '@/app/_components/LandingPreview';

const FEATURES = [
  {
    title: '드래그앤드롭 플래너',
    description:
      '직관적인 드래그앤드롭으로 학기별 과목을 손쉽게 배치하세요. 마우스 하나로 과목을 원하는 학기에 끌어놓기만 하면 됩니다.',
  },
  {
    title: '졸업 요건 추적',
    description: '전공필수, 교양, 자유선택 등 모든 졸업 요건을 한눈에 확인하세요.',
  },
  {
    title: '다른 사람들의 수강 계획 참고',
    description: '같은 학과 학생들의 수강 계획을 참고하여 나만의 최적 로드맵을 설계하세요.',
  },
  {
    title: '통계 기반 의사결정',
    description: '학과별 인기 과목, 학기별 수강 통계를 확인하고 데이터에 기반한 수강 결정을 내리세요.',
  },
];

const STEPS = [
  { title: '가입', description: '구글 계정으로 간편하게 가입하거나, 비회원으로 바로 체험해보세요.' },
  { title: '계획', description: '과목을 검색하고 드래그앤드롭으로 학기별로 배치하세요.' },
  { title: '완성', description: '졸업 요건 달성률을 확인하고 최적의 로드맵을 완성하세요.' },
];

const CONTAINER = 'mx-auto w-full max-w-[1184px] px-5 md:px-8';
const SECTION_TITLE =
  'text-[clamp(32px,3vw,40px)] leading-[1.2] font-bold tracking-[-0.03em] text-balance';
const NAV_LINK =
  'hidden md:inline-flex min-h-11 items-center text-[15px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:text-ink';
const PRIMARY_CTA =
  'inline-flex h-14 items-center justify-center rounded-[12px] bg-primary px-7 text-[17px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover';
const GUEST_CTA =
  'inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-[16px] font-semibold text-ink transition-colors duration-150 ease-out hover:text-primary';

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
    window.location.href = '/planner';
  };

  return (
    <main className="flex flex-col bg-white text-ink">
      <header className={`${CONTAINER} flex min-h-[72px] flex-wrap items-center justify-between gap-6 py-3`}>
        <Link href="/" className="text-[16px] font-bold tracking-[-0.02em] text-ink">
          YU 수강 플래너
        </Link>
        <nav aria-label="페이지 메뉴" className="flex flex-wrap items-center gap-5 md:gap-7">
          <a href="#overview" className={NAV_LINK}>
            서비스 소개
          </a>
          <a href="#flow" className={NAV_LINK}>
            사용 방법
          </a>
          <Link href="/help" className={NAV_LINK}>
            도움말
          </Link>
          {status === 'authenticated' ? (
            <Link
              href="/planner"
              className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-[14px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover"
            >
              플래너로 이동
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ink transition-colors duration-150 ease-out hover:text-primary"
              >
                로그인
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-[10px] bg-primary px-4 text-[14px] font-semibold text-white transition-colors duration-150 ease-out hover:bg-primary-hover"
              >
                시작하기
              </Link>
            </>
          )}
        </nav>
      </header>

      <section aria-labelledby="hero-title" className={`${CONTAINER} flex flex-col pt-14 pb-16 md:pt-[104px] md:pb-20`}>
        <h1
          id="hero-title"
          className="max-w-[900px] text-[clamp(40px,5.2vw,72px)] leading-[1.1] font-bold tracking-[-0.035em] text-balance"
        >
          <span className="block">영남대학교 생활을</span>
          <span className="block text-primary">스마트하게 설계하다.</span>
        </h1>
        <p className="mt-6 max-w-[560px] text-[17px] leading-[26px] text-pretty text-ink-2 md:mt-7 md:text-[20px] md:leading-[30px]">
          1학년부터 졸업까지, 수강 계획을 한눈에 세우세요. 다른 사람들의 수강 이력을 참고하고, 나만의 졸업 로드맵을 완성하세요.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-7">
          <Link href="/login" className={PRIMARY_CTA}>
            바로 시작하기
          </Link>
          <button type="button" onClick={handleGuestMode} className={GUEST_CTA}>
            비회원으로 체험하기
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <span className="mt-3.5 text-[13px] leading-[18px] text-ink-2">비회원 데이터는 이 브라우저에만 저장됩니다</span>

        <LandingPreview />
      </section>

      <section id="overview" aria-labelledby="service-title" className="scroll-mt-4 border-t border-line">
        <div className={`${CONTAINER} flex flex-col py-16 md:py-24`}>
          <h2 id="service-title" className={SECTION_TITLE}>
            왜 YU 수강 플래너인가요?
          </h2>
          <p className="mt-3 text-[17px] leading-[26px] text-ink-2">
            학생들의 수강 계획을 체계적으로 관리할 수 있는 핵심 기능들
          </p>
          <ol className="mt-10 flex flex-col border-t border-line-2 md:mt-14">
            {FEATURES.map((feature, i) => (
              <li key={feature.title} className="flex flex-wrap gap-x-10 gap-y-4 border-b border-line-2 py-8">
                <span className="flex-[0_0_48px] text-[14px] leading-[30px] font-semibold text-ink-2 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="flex-[1_1_240px] text-[22px] leading-[30px] font-bold tracking-[-0.02em]">
                  {feature.title}
                </h3>
                <p className="flex-[2_1_320px] text-[16px] leading-[26px] text-pretty text-ink-2">
                  {feature.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="flow" aria-labelledby="how-title" className="scroll-mt-4 border-t border-line">
        <div className={`${CONTAINER} flex flex-col py-16 md:py-24`}>
          <h2 id="how-title" className={SECTION_TITLE}>
            이렇게 사용하세요
          </h2>
          <ol className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-12 md:mt-14">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col border-t border-line-2 pt-5">
                <span
                  aria-hidden="true"
                  className="text-[56px] leading-[64px] font-light tracking-[-0.04em] text-primary tabular-nums"
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-[20px] leading-7 font-bold tracking-[-0.02em]">
                  <span className="sr-only">{i + 1}단계 · </span>
                  {step.title}
                </h3>
                <p className="mt-2 text-[16px] leading-[26px] text-pretty text-ink-2">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" aria-labelledby="cta-title" className="scroll-mt-4 border-t border-line">
        <div className={`${CONTAINER} flex flex-wrap items-end justify-between gap-10 pt-16 pb-20 md:pt-24 md:pb-28`}>
          <div className="flex max-w-[560px] flex-col">
            <span className="text-[14px] leading-5 font-semibold text-primary">지금이 가장 빠릅니다</span>
            <h2 id="cta-title" className={`mt-3 ${SECTION_TITLE}`}>
              수강 계획을 시작하세요
            </h2>
            <p className="mt-4 text-[17px] leading-[26px] text-pretty text-ink-2">
              체계적인 수강 계획으로 졸업까지의 여정을 한눈에 관리하세요.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3.5">
            <div className="flex flex-wrap items-center gap-7">
              <Link href="/login" className={PRIMARY_CTA}>
                바로 시작하기
              </Link>
              <button type="button" onClick={handleGuestMode} className={GUEST_CTA}>
                비회원으로 체험하기
                <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
            <span className="text-[13px] leading-[18px] text-ink-2">가입 없이 바로 체험 가능</span>
          </div>
        </div>
      </section>
    </main>
  );
}
