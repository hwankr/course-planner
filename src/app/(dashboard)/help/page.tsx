'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpenCheck,
  Compass,
  GraduationCap,
  LayoutDashboard,
  RotateCcw,
  Smartphone,
  CircleHelp,
} from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';

interface GuideSection {
  id: string;
  badge: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  points: string[];
}

const guideSections: GuideSection[] = [
  {
    id: 'start',
    badge: 'STEP 1',
    title: '홈에서 바로 시작',
    description: '로그인 없이도 바로 체험할 수 있습니다.',
    image: '/help/home-landing.png',
    imageAlt: 'YU 수강 플래너 홈 화면',
    points: [
      '"비회원으로 체험하기"를 눌러 즉시 시작할 수 있습니다.',
      '로그인/회원가입 없이 온보딩으로 이동합니다.',
      '모바일에서도 동일한 흐름으로 사용 가능합니다.',
    ],
  },
  {
    id: 'onboarding-profile',
    badge: 'STEP 2',
    title: '학과 및 입학 정보 입력',
    description: '학과와 입학연도를 먼저 설정하면 추천 과목이 맞춰집니다.',
    image: '/help/onboarding-step1.png',
    imageAlt: '온보딩 1단계 화면',
    points: [
      '학과 검색으로 본인 학과를 선택합니다.',
      '입학연도를 입력한 뒤 "다음"으로 이동합니다.',
      '복수전공/부전공도 같은 화면에서 설정할 수 있습니다.',
    ],
  },
  {
    id: 'onboarding-requirement',
    badge: 'STEP 3',
    title: '졸업 요건 확인',
    description: '자동으로 채워진 요건을 확인하고 필요하면 수정하세요.',
    image: '/help/onboarding-step2.png',
    imageAlt: '온보딩 2단계 졸업요건 화면',
    points: [
      '졸업학점, 전공, 교양 기준을 검토합니다.',
      '기이수 학점이 있으면 함께 입력할 수 있습니다.',
      '"완료"를 누르면 플래너로 이동합니다.',
    ],
  },
  {
    id: 'planner-overview',
    badge: 'STEP 4',
    title: '플래너 화면 이해',
    description: '상단은 과목 리스트, 하단은 학기별 계획 영역입니다.',
    image: '/help/planner-overview.png',
    imageAlt: '플래너 개요 화면',
    points: [
      '"학기 추가" 버튼으로 학년/학기를 만들 수 있습니다.',
      '학기를 클릭해 포커스를 주면 + 버튼으로 빠르게 추가합니다.',
      '좌측 요건 요약에서 이수 진행률을 실시간으로 확인합니다.',
    ],
  },
  {
    id: 'planner-add',
    badge: 'STEP 5',
    title: '과목 추가와 상태 관리',
    description: '과목은 + 버튼 또는 드래그앤드롭으로 배치할 수 있습니다.',
    image: '/help/planner-add-course.png',
    imageAlt: '플래너에서 과목을 추가한 화면',
    points: [
      '+ 버튼으로 선택한 학기에 과목을 즉시 추가합니다.',
      '추가된 과목의 상태(계획/수강중/완료/재수강)를 변경할 수 있습니다.',
      '학기별 과목 정리와 초기화 버튼으로 빠르게 관리할 수 있습니다.',
    ],
  },
  {
    id: 'help-page',
    badge: 'STEP 6',
    title: '도움말 다시 보기',
    description: '필요할 때마다 이 페이지에서 흐름을 다시 확인할 수 있습니다.',
    image: '/help/help-overview.png',
    imageAlt: '도움말 페이지 화면',
    points: [
      '상단 "투어 다시 시작" 버튼으로 가이드를 초기화할 수 있습니다.',
      '문제 상황이 생기면 단계별 스크린샷을 보고 바로 복구할 수 있습니다.',
      '문의가 필요하면 페이지 하단 이메일로 연락할 수 있습니다.',
    ],
  },
];

interface FaqItem {
  q: string;
  a: string;
  link?: string;
  linkLabel?: string;
}

const faq: FaqItem[] = [
  {
    q: '비회원 모드 데이터는 어디에 저장되나요?',
    a: '브라우저 로컬 저장소에만 저장됩니다. 브라우저 데이터를 지우면 함께 삭제됩니다.',
  },
  {
    q: '학기 포커스는 어떻게 해제하나요?',
    a: '학기 카드를 다시 클릭하거나 ESC 키를 눌러 해제할 수 있습니다.',
  },
  {
    q: '졸업 요건이 잘못 설정되었어요.',
    a: '플래너 상단 졸업 요건 위젯의 "요건 수정"에서 값을 다시 입력하면 됩니다.',
  },
  {
    q: '졸업 기준이나 취득 학점을 어떻게 확인하나요?',
    a: '영남대 포털에서 확인할 수 있습니다.',
    link: '/help/graduation-guide',
    linkLabel: '자세한 확인 방법 보기',
  },
];

export default function HelpPage() {
  const router = useRouter();
  const guideStore = useGuideStore();

  const handleRestartTour = () => {
    guideStore.resetGuide();
    router.push('/planner');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        <header className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#153974]/10 px-3 py-1 text-xs font-semibold text-[#153974]">
                <BookOpenCheck className="h-3.5 w-3.5" />
                이미지 기반 도움말
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-[#153974] md:text-4xl">
                YU 수강 플래너 사용 가이드
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                실제 서비스 화면을 기준으로 처음 설정부터 과목 추가까지 핵심 흐름만 빠르게 정리했습니다.
              </p>
            </div>
            <button
              onClick={handleRestartTour}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#00AACA] bg-white px-5 py-3 text-sm font-semibold text-[#00AACA] transition-colors hover:bg-[#00AACA] hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              투어 다시 시작
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {guideSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-[#00AACA] hover:text-[#153974]"
              >
                {section.badge}
              </a>
            ))}
          </div>
        </header>

        <div className="mt-8 grid gap-5">
          {guideSections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
                <div className="p-5 md:p-6 lg:p-7">
                  <p className="text-xs font-bold tracking-wide text-[#00AACA]">
                    {section.badge}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#153974]">{section.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-base">
                    {section.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {section.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#00AACA]" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative min-h-[260px] border-t border-slate-200 bg-slate-50 lg:min-h-[320px] lg:border-l lg:border-t-0">
                  <Image
                    src={section.image}
                    alt={section.imageAlt}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 46vw"
                    priority={section.id === 'start'}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#153974]">
              <CircleHelp className="h-5 w-5 text-[#00AACA]" />
              자주 묻는 질문
            </h2>
            <div className="mt-4 space-y-3">
              {faq.map((item) => (
                <div key={item.q} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-[#153974]">Q. {item.q}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">
                    A. {item.a}
                    {item.link && (
                      <>
                        {' '}
                        <Link
                          href={item.link}
                          className="text-[#00AACA] hover:text-[#153974] underline"
                        >
                          {item.linkLabel || '자세히 보기'}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-xl font-bold text-[#153974]">모바일 화면 안내</h2>
            <p className="mt-2 text-sm text-slate-600">
              모바일에서는 메뉴 버튼으로 화면을 전환하고, 동일한 기능을 터치로 사용할 수 있습니다.
            </p>
            <div className="mt-4 grid grid-cols-[140px_1fr] items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="relative h-[230px] overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Image
                  src="/help/home-mobile.png"
                  alt="모바일 홈 화면"
                  fill
                  className="object-cover object-top"
                  sizes="140px"
                />
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2">
                  <Smartphone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00AACA]" />
                  <span>상단 CTA에서 바로 로그인/체험 시작 가능</span>
                </li>
                <li className="flex items-start gap-2">
                  <LayoutDashboard className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00AACA]" />
                  <span>플래너 메뉴는 모바일 헤더에서 열림</span>
                </li>
                <li className="flex items-start gap-2">
                  <GraduationCap className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00AACA]" />
                  <span>졸업 요건 추적/수정 기능은 데스크탑과 동일</span>
                </li>
                <li className="flex items-start gap-2">
                  <Compass className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00AACA]" />
                  <span>처음 사용자는 도움말의 STEP 순서대로 진행 권장</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600 shadow-sm md:p-6">
          궁금한 사항은{' '}
          <a
            href="mailto:support@yuplanner.com"
            className="font-semibold text-[#00AACA] underline decoration-2 underline-offset-2 transition-colors hover:text-[#153974]"
          >
            support@yuplanner.com
          </a>
          으로 문의해주세요.
        </footer>
      </div>
    </div>
  );
}
