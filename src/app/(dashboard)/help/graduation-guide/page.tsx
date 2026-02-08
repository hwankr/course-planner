'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  GraduationCap,
  ArrowLeft,
  BookOpen,
  Search,
  FileText,
  ExternalLink,
  X,
} from 'lucide-react';

interface FlowStep {
  id: string;
  badge: string;
  title: string;
  description: string;
  steps: string[];
  imageSrc: string;
  imageAlt: string;
  imageCaption: string;
  imageWidth: number;
  imageHeight: number;
  icon: typeof Search | typeof BookOpen;
  iconColorClass: string;
  iconBgClass: string;
}

const flowSections: FlowStep[] = [
  {
    id: 'homepage-portal',
    badge: 'STEP 1',
    title: '홈페이지 로그인 후 포털 이동',
    description:
      '',
    steps: [
      '홈페이지 접속: https://www.yu.ac.kr/main/index.do',
      '로그인 후 상단 포털 버튼 클릭',
      '포털 페이지 진입',
    ],
    imageSrc: '/help/yu-portal-highlight.png',
    imageAlt: '영남대학교 홈페이지 포털 버튼 강조 화면',
    imageCaption: '',
    imageWidth: 972,
    imageHeight: 691,
    icon: Search,
    iconColorClass: 'text-[#153974]',
    iconBgClass: 'bg-[#153974]/10',
  },
  {
    id: 'system-navigation',
    badge: 'STEP 2',
    title: '종합정보시스템에서 졸업모의사정 이동',
    description:
      '',
    steps: [
      '포털에서 종합정보시스템 클릭 후 접속',
      '좌측 메뉴에서 학적관리 선택',
      '학적관리 하위 메뉴의 졸업모의사정 클릭',
    ],
    imageSrc: '/help/yu-portal-system-highlight.png',
    imageAlt: '종합정보시스템 메뉴 강조 화면',
    imageCaption: '',
    imageWidth: 799,
    imageHeight: 575,
    icon: BookOpen,
    iconColorClass: 'text-[#00AACA]',
    iconBgClass: 'bg-[#00AACA]/10',
  },
];

const auditCheckItems = [
  {
    title: '졸업기준 학점',
    description: '총 졸업학점, 전공학점, 교양학점 등 기준값을 먼저 확인합니다.',
  },
  {
    title: '취득 학점',
    description: '현재까지 실제 이수한 학점을 확인하고 기준값과 비교합니다.',
  },
  {
    title: '전공필수 이수 현황',
    description: '전공필수 항목의 기준·취득값을 비교해 필수 이수 충족 여부를 점검합니다.',
  },
  {
    title: '구분별 학점 표',
    description: '전공, 교양, 총학점 등 구분별 표를 항목 단위로 확인합니다.',
  },
];

interface ZoomImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function GraduationGuidePage() {
  const [zoomImage, setZoomImage] = useState<ZoomImage | null>(null);

  useEffect(() => {
    if (!zoomImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomImage(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [zoomImage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <Link
            href="/help"
            className="mb-4 inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-[#00AACA]"
          >
            <ArrowLeft className="h-4 w-4" />
            도움말로 돌아가기
          </Link>

          <p className="inline-flex items-center gap-2 rounded-full bg-[#153974]/5 px-3 py-1 text-xs font-semibold text-[#153974]">
            <GraduationCap className="h-3.5 w-3.5" />
            졸업 정보 가이드
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#153974] md:text-4xl">
            영남대학교 졸업기준·취득학점 확인 방법
          </h1>
        </header>

        <div className="mt-8 space-y-6">
          {flowSections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="grid gap-0 lg:grid-cols-[1.05fr_1fr]">
                  <div className="p-6 md:p-7">
                    <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {section.badge}
                    </p>
                    <h2 className="mt-3 flex items-center gap-3 text-2xl font-bold text-[#153974]">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${section.iconBgClass}`}
                      >
                        <Icon className={`h-5 w-5 ${section.iconColorClass}`} />
                      </span>
                      {section.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
                      {section.description}
                    </p>

                    <ol className="mt-4 space-y-2">
                      {section.steps.map((step, index) => (
                        <li key={step} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#153974] text-xs font-bold text-white">
                            {index + 1}
                          </span>
                          <span className="text-sm leading-relaxed text-slate-700">{step}</span>
                        </li>
                      ))}
                    </ol>

                  </div>

                  <div className="border-t border-slate-200 bg-slate-50 lg:border-l lg:border-t-0">
                    <button
                      type="button"
                      onClick={() =>
                        setZoomImage({
                          src: section.imageSrc,
                          alt: section.imageAlt,
                          width: section.imageWidth,
                          height: section.imageHeight,
                        })
                      }
                      className="group relative block aspect-[4/3] w-full cursor-zoom-in lg:aspect-[1/1]"
                      aria-label={`${section.title} 이미지 확대 보기`}
                    >
                      <Image
                        src={section.imageSrc}
                        alt={section.imageAlt}
                        fill
                        className="object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                        sizes="(max-width: 1024px) 100vw, 42vw"
                      />
                      <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                        클릭하여 확대
                      </span>
                    </button>
                    <p className="border-t border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {section.imageCaption}
                    </p>
                  </div>
                </div>
              </section>
            );
          })}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-[#153974]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <FileText className="h-5 w-5 text-purple-600" />
              </span>
              STEP 3. 졸업모의사정에서 확인할 항목
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
              졸업모의사정 화면에서 기준값과 취득값을 동시에 보며 항목별 충족 여부를 점검하세요.
            </p>

            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() =>
                  setZoomImage({
                    src: '/help/yu-graduation-audit-highlight.png',
                    alt: '종합정보시스템 학적관리의 졸업모의사정 화면',
                    width: 1425,
                    height: 436,
                  })
                }
                className="group relative block aspect-[1425/436] w-full cursor-zoom-in"
                aria-label="졸업모의사정 이미지 확대 보기"
              >
                <Image
                  src="/help/yu-graduation-audit-highlight.png"
                  alt="종합정보시스템 학적관리의 졸업모의사정 화면"
                  fill
                  className="object-contain transition-transform duration-200 group-hover:scale-[1.01]"
                  sizes="(max-width: 768px) 100vw, 1200px"
                />
                <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  클릭하여 확대
                </span>
              </button>

            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {auditCheckItems.map((item) => (
                <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-[#153974]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-8 text-center">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
          >
            <ArrowLeft className="h-4 w-4" />
            도움말 페이지로 돌아가기
          </Link>
          <p className="mt-2 text-xs text-slate-500">
            공식 홈페이지 바로가기:{' '}
            <a
              href="https://www.yu.ac.kr/main/index.do"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#153974] underline decoration-slate-300 underline-offset-2 hover:text-[#00AACA]"
            >
              https://www.yu.ac.kr/main/index.do
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
        </footer>
      </div>

      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 p-4 md:p-8"
          role="dialog"
          aria-modal="true"
          onPointerDown={() => setZoomImage(null)}
          onClick={() => setZoomImage(null)}
        >
          <div className="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div className="relative flex h-full w-full items-center justify-center">
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute -top-10 right-0 inline-flex items-center gap-1 rounded-md bg-white/15 px-2.5 py-1.5 text-sm text-white backdrop-blur transition-colors hover:bg-white/25"
                aria-label="확대 이미지 닫기"
              >
                <X className="h-4 w-4" />
                닫기
              </button>
              <div
                className="overflow-hidden rounded-xl border border-white/20 bg-black/30"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
              >
                <Image
                  src={zoomImage.src}
                  alt={zoomImage.alt}
                  width={zoomImage.width}
                  height={zoomImage.height}
                  className="h-auto max-h-[80vh] w-auto max-w-[calc(100vw-2rem)] object-contain md:max-w-[calc(100vw-4rem)]"
                  sizes="(max-width: 768px) calc(100vw - 2rem), calc(100vw - 4rem)"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
