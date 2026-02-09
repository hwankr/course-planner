'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Gift,
  Coffee,
  Trophy,
  Camera,
  Send,
  ExternalLink,
  CalendarPlus,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

export default function EventPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-3xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
        {/* Header Card */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <Link
            href="/planner"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
          >
            <ArrowLeft className="h-4 w-4" />
            플래너로 돌아가기
          </Link>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <Gift className="h-3.5 w-3.5" />
            이벤트
          </div>

          <h1 className="text-3xl font-bold text-[#153974] md:text-4xl">
            스타벅스 기프티콘 이벤트
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            수강계획을 세우고 스타벅스 기프티콘을 받아가세요!
          </p>
        </div>

        {/* 이벤트 정보 Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <h2 className="mb-4 text-xl font-bold text-[#153974]">이벤트 정보</h2>

          <div className="space-y-4">
            {/* 이벤트 기간 */}
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Clock className="h-5 w-5 flex-shrink-0 text-[#153974]" />
              <div>
                <p className="text-sm font-semibold text-[#153974]">
                  이벤트 기간
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  2026년 2월 10일 ~ 2월 28일
                </p>
              </div>
            </div>

            {/* 상품 안내 */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* 일반 당첨 */}
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                <Coffee className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    일반 당첨
                  </p>
                  <p className="mt-1 text-xs text-green-700">
                    스타벅스 5,000원 × 8명
                  </p>
                </div>
              </div>

              {/* 특별 당첨 */}
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <Trophy className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    특별 당첨
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    스타벅스 10,000원 × 1명
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-[#153974]">총 예산:</span>{' '}
                50,000원
              </p>
            </div>
          </div>
        </div>

        {/* 참여 방법 Card */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <h2 className="mb-5 text-xl font-bold text-[#153974]">참여 방법</h2>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#153974] text-lg font-bold text-white">
                1
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5 text-[#153974]" />
                  <h3 className="text-sm font-semibold text-[#153974]">
                    회원가입 후 수강계획 작성
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  YU 수강 플래너에 회원가입 후 수강계획을 작성하세요.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#153974] text-lg font-bold text-white">
                2
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Camera className="h-5 w-5 text-[#153974]" />
                  <h3 className="text-sm font-semibold text-[#153974]">
                    수강계획 화면 캡쳐
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  작성한 수강계획 화면을 캡쳐하세요. (플래너 페이지)
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#153974] text-lg font-bold text-white">
                3
              </div>
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Send className="h-5 w-5 text-[#153974]" />
                  <h3 className="text-sm font-semibold text-[#153974]">
                    Google Form에서 제출
                  </h3>
                </div>
                <p className="text-sm text-slate-600">
                  학교 이메일과 스크린샷을 Google Form으로 제출하세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 유의사항 Card */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <h2 className="mb-4 text-xl font-bold text-[#153974]">유의사항</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#153974]" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#153974]">
                  학교 이메일 필수:
                </span>{' '}
                학교 이메일로 기프티콘이 발송됩니다.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#153974]" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#153974]">
                  1인 1회 참여:
                </span>{' '}
                학교 이메일 기준으로 중복 참여는 불가합니다.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-[#153974]" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#153974]">
                  당첨자 발표:
                </span>{' '}
                이벤트 종료 후 3일 이내에 발표됩니다.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 flex-shrink-0 text-[#153974]" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-[#153974]">
                  기프티콘 발송:
                </span>{' '}
                당첨 시 학교 이메일로 기프티콘이 발송됩니다.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-red-600">
                  부정 참여 금지:
                </span>{' '}
                조작되거나 허위 스크린샷 제출 시 당첨이 취소됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 응모하기 버튼 */}
        <a
          href="https://forms.gle/LBfnVCFcbEnKpHSG6"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#153974] py-4 text-lg font-bold text-white transition-colors hover:bg-[#1a4a8f]"
        >
          <ExternalLink className="h-5 w-5" />
          응모하기
        </a>

        {/* 하단 안내 Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <p className="text-center text-sm text-slate-600">
            문의사항은{' '}
            <Link
              href="/help/feedback"
              className="font-semibold text-[#00AACA] hover:text-[#153974]"
            >
              피드백 페이지
            </Link>
            를 이용해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
