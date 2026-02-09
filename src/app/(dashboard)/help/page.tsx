import Link from 'next/link';
import {
  ArrowLeft,
  HelpCircle,
  Rocket,
  Calendar,
  GraduationCap,
  BarChart3,
  UserCog,
  ExternalLink,
} from 'lucide-react';
import ZoomableImage from '@/components/ui/ZoomableImage';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 md:px-6 md:pt-10">
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
            <HelpCircle className="h-3.5 w-3.5" />
            도움말 가이드
          </div>

          <h1 className="text-3xl font-bold text-[#153974] md:text-4xl">
            YU 수강 플래너 사용 가이드
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            수강 플래너의 주요 기능을 빠르게 알아보세요
          </p>
        </div>

        {/* Section 1: 시작하기 */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#153974]/10">
              <Rocket className="h-5 w-5 text-[#153974]" />
            </div>
            <h2 className="text-2xl font-bold text-[#153974]">시작하기</h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            YU 수강 플래너는 비회원으로도 바로 사용할 수 있습니다. 비회원
            모드에서는 데이터가 브라우저에 저장되며, 회원 가입 시 어디서든
            접속 가능하고 학과 통계에 기여할 수 있습니다.
          </p>

          <div className="mb-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-2 font-semibold text-[#153974]">비회원</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• 바로 사용 가능</li>
                <li>• 브라우저 저장</li>
                <li>• 통계 공유 불가</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#00AACA]/30 bg-[#00AACA]/5 p-4">
              <h3 className="mb-2 font-semibold text-[#153974]">회원</h3>
              <ul className="space-y-1 text-sm text-slate-600">
                <li>• Google 로그인</li>
                <li>• 데이터 동기화</li>
                <li>• 통계 공유 가능</li>
              </ul>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            처음 사용 시 학과 선택과 졸업요건 입력 과정을 안내합니다.
            졸업요건은 언제든 수정할 수 있으니 정확하지 않아도 괜찮습니다.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <ZoomableImage
              src="/help/onboarding-screen.png"
              alt="온보딩 화면 - 학과 선택과 졸업요건 설정"
              width={1080}
              height={400}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Section 2: 수강 계획 세우기 */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3069B3]/10">
              <Calendar className="h-5 w-5 text-[#3069B3]" />
            </div>
            <h2 className="text-2xl font-bold text-[#153974]">
              수강 계획 세우기
            </h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            수강 플래너에서는 학기를 추가하고, 과목을 배치하여 졸업까지의 수강
            계획을 세울 수 있습니다.
          </p>

          <div className="mb-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-[#153974]">1.</span>{' '}
              <span className="text-sm text-slate-600 md:text-base">
                학기 추가: 화면 하단의 + 버튼으로 새 학기를 추가합니다
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-[#153974]">2.</span>{' '}
              <span className="text-sm text-slate-600 md:text-base">
                과목 추가: 학기를 클릭하여 선택한 뒤, 과목 리스트에서 +
                버튼을 누르거나 드래그하여 추가합니다
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-[#153974]">3.</span>{' '}
              <span className="text-sm text-slate-600 md:text-base">
                과목 이동: 과목을 다른 학기로 드래그하여 옮길 수 있습니다
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-[#153974]">4.</span>{' '}
              <span className="text-sm text-slate-600 md:text-base">
                과목 제거: 과목의 X 버튼을 누르거나 카탈로그 영역으로
                드래그합니다
              </span>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="font-semibold text-[#153974]">5.</span>{' '}
              <span className="text-sm text-slate-600 md:text-base">
                이수 상태: 과목 카드의 상태 버튼으로 예정/이수 중/이수 완료를
                전환합니다
              </span>
            </div>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            목록에 없는 과목은 커스텀 과목 추가 기능으로 직접 등록할 수
            있습니다.
          </p>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ZoomableImage
                src="/help/planner-semesters.png"
                alt="학기 그리드 - 학년별 학기 카드와 과목 배치"
                width={1500}
                height={600}
                className="w-full h-auto"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ZoomableImage
                src="/help/course-catalog.png"
                alt="과목 카탈로그 - 학년/학기/카테고리 필터와 추가 버튼"
                width={1500}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Section 3: 졸업요건 추적 */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00AACA]/10">
              <GraduationCap className="h-5 w-5 text-[#00AACA]" />
            </div>
            <h2 className="text-2xl font-bold text-[#153974]">
              졸업요건 추적
            </h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            플래너 상단의 졸업요건 위젯에서 카테고리별 이수 현황을 한눈에
            확인할 수 있습니다. 진행률 바를 통해 각 영역의 달성도를 실시간으로
            파악하세요.
          </p>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            졸업요건 수정이 필요하면 위젯의 연필 아이콘을 클릭하여 기준 학점을
            변경할 수 있습니다.
          </p>

          <Link
            href="/help/graduation-guide"
            className="mb-4 flex items-center gap-2 rounded-xl border border-[#00AACA]/30 bg-[#00AACA]/5 p-4 text-sm font-medium text-[#153974] transition-colors hover:border-[#00AACA]/50 hover:bg-[#00AACA]/10"
          >
            <ExternalLink className="h-4 w-4 text-[#00AACA]" />
            영남대학교 포털에서 졸업요건 조회하는 방법 →
          </Link>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
            <ZoomableImage
              src="/help/requirements-widget.png"
              alt="졸업요건 위젯 - 전공/교양 카테고리별 진행률 바"
              width={1500}
              height={200}
              className="w-full h-auto"
            />
          </div>
        </div>

        {/* Section 4: 학과 통계 */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3069B3]/10">
              <BarChart3 className="h-5 w-5 text-[#3069B3]" />
            </div>
            <h2 className="text-2xl font-bold text-[#153974]">학과 통계</h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            학과 통계 페이지에서 같은 학과 학생들이 많이 담은 인기 과목을
            확인할 수 있습니다. 학기별 필터로 특정 학기의 인기 과목만 볼 수도
            있습니다.
          </p>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            회원으로 로그인하면 다른 학생들의 익명 수강계획을 열람할 수
            있습니다. 내 계획도 자동으로 익명 공유되어 학과 통계에
            기여합니다. 학기별 평균 수강 현황도 확인할 수 있습니다.
          </p>

          <div className="mt-4 space-y-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ZoomableImage
                src="/help/statistics-ranking.png"
                alt="학과 통계 - 카테고리/학기 필터와 인기 과목 순위"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <ZoomableImage
                src="/help/statistics-overview.png"
                alt="학기별 평균 수강 현황과 익명 수강계획 열람"
                width={1200}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Section 5: 프로필 관리 */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#153974]/10">
              <UserCog className="h-5 w-5 text-[#153974]" />
            </div>
            <h2 className="text-2xl font-bold text-[#153974]">프로필 관리</h2>
          </div>

          <p className="mb-4 text-sm leading-relaxed text-slate-600 md:text-base">
            프로필 페이지에서 학과, 입학년도, 전공 유형(단일전공/복수전공/부전공)을
            변경할 수 있습니다. 복수전공이나 부전공 선택 시 해당 학과의
            졸업요건도 함께 추적됩니다.
          </p>

          <p className="text-sm leading-relaxed text-slate-600 md:text-base">
            비회원에서 회원으로 전환하려면 프로필 페이지에서 Google 로그인을
            진행하세요.
          </p>
        </div>

        {/* 문의하기 안내 */}
        <div className="mb-8 rounded-2xl border border-[#00AACA]/30 bg-[#00AACA]/5 p-6 text-center">
          <p className="mb-3 text-sm text-slate-600 md:text-base">
            궁금한 점이나 오류를 발견하셨나요?
          </p>
          <Link
            href="/help/feedback"
            className="inline-flex items-center gap-2 rounded-xl bg-[#153974] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1a4a8f]"
          >
            문의 및 피드백 보내기
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom Navigation */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/planner"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
          >
            <ArrowLeft className="h-4 w-4" />
            플래너로 이동
          </Link>

          <Link
            href="/help/graduation-guide"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#00AACA] transition-colors hover:text-[#153974]"
          >
            졸업요건 조회 가이드
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
