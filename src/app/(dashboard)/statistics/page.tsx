'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonVariants, CategoryLabel, PageHeader, SectionHeader } from '@/components/ui';
import { AnonymousPlanModal } from '@/components/features/AnonymousPlanModal';
import { AllPlansModal } from '@/components/features/AllPlansModal';
import { useDepartmentStats, useAnonymousPlans } from '@/hooks/useStatistics';
import { useAuth } from '@/hooks/useAuth';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { RequirementCategory } from '@/types';

const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  major_required: '전공핵심',
  major_compulsory: '전공필수',
  major_elective: '전공선택',
  general_required: '교양필수',
  general_elective: '교양선택',
  teaching: '교직',
  free_elective: '자유선택',
};

const INITIAL_VISIBLE = 8;
const MORE_STEP = 5;
// 학기별 평균 막대의 기준 학점 (.design-ref/Statistics)
const MAX_SEMESTER_CREDITS = 21;

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}일 전`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}개월 전`;
}

/** 가는 진행 막대: 바탕 Line, 채움 Primary */
function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('h-1.5 overflow-hidden rounded-[3px] bg-line', className)}>
      <div className="h-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

/** 섹션 경계: 모바일은 Fill 10px 띠, 데스크톱은 1px Line2 (섹션 쪽 border-t) */
function SectionBand() {
  return <div aria-hidden="true" className="-mx-5 h-2.5 bg-fill md:hidden" />;
}

const SECTION_CLASS = 'flex flex-col pt-2 pb-8 md:border-t md:border-line-2 md:pt-7 md:pb-9';

/** 로딩·오류·학과 미설정 등 통계 본문 대신 보여주는 상태 */
function StatusSection({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title="학과 통계" />
      <section className="flex flex-col gap-2 border-t border-line-2 pt-7">
        <h2 className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
        <div className="text-[14px] leading-5 text-ink-2">{children}</div>
        {action && <div className="pt-4">{action}</div>}
      </section>
    </div>
  );
}

const profileLink = (
  <Link href="/profile" className={buttonVariants()}>
    프로필 설정하기
  </Link>
);

export default function StatisticsPage() {
  const [selectedCategory, setSelectedCategory] = useState<'all' | RequirementCategory>('all');
  const [selectedSemester, setSelectedSemester] = useState<'all' | string>('all');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isAllPlansModalOpen, setIsAllPlansModalOpen] = useState(false);

  const { isGuest, loginWithGoogle } = useAuth();
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const effectiveDepartmentId = isGuest ? (guestDepartmentId || undefined) : undefined;

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useDepartmentStats(effectiveDepartmentId);
  const { data: plansData, isLoading: plansLoading, isError: plansError, refetch: refetchPlans, isFetching: plansFetching } = useAnonymousPlans(effectiveDepartmentId, 1, 3, !isGuest);

  // Error handling - MUST be checked FIRST
  if (statsLoading) {
    return (
      <div role="status" aria-live="polite">
        <PageHeader title="학과 통계" description="통계를 불러오는 중..." />
        <div className="border-t border-line-2 pt-7">
          <div className="h-[26px] w-32 animate-pulse rounded-[4px] bg-fill" />
          <div className="mt-4 flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-5 border-b border-line">
                <div className="h-4 w-6 animate-pulse rounded-[4px] bg-fill" />
                <div className="h-4 flex-1 animate-pulse rounded-[4px] bg-fill" />
                <div className="h-4 w-20 animate-pulse rounded-[4px] bg-fill" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check for specific error codes
  const errorCode = (statsErrorObj as Error & { code?: string })?.code;

  if (errorCode === 'DEPARTMENT_NOT_SET') {
    return (
      <StatusSection title="학과를 설정해주세요" action={profileLink}>
        학과별 수강 통계를 확인하려면 프로필에서 학과를 설정해야 합니다.
      </StatusSection>
    );
  }

  if (statsError || !statsData) {
    return (
      <StatusSection title="통계를 불러오는데 실패했습니다">
        잠시 후 다시 시도해주세요.
      </StatusSection>
    );
  }

  if (!statsData.data) {
    return (
      <StatusSection title="통계 데이터를 찾을 수 없습니다" action={profileLink}>
        설정된 학과 정보를 확인할 수 없습니다. 프로필에서 학과를 다시 설정해주세요.
      </StatusSection>
    );
  }

  const stats = statsData.data;

  // Build DYNAMIC semester options from actual data
  // Extract unique semesters from all courseStats, then from semesterDistribution as fallback
  const semesterOptions = (() => {
    const semesterSet = new Set<string>();
    for (const course of stats.courseStats) {
      for (const sem of course.semesters || []) {
        semesterSet.add(`${sem.year}-${sem.term}`);
      }
    }
    // Also include semesters from semesterDistribution (covers cases where no course maps to it)
    for (const sem of stats.semesterDistribution) {
      semesterSet.add(`${sem.year}-${sem.term}`);
    }
    const sorted = Array.from(semesterSet).sort((a, b) => {
      const [aYear, aTerm] = a.split('-');
      const [bYear] = b.split('-');
      if (aYear !== bYear) return Number(aYear) - Number(bYear);
      return aTerm === 'spring' ? -1 : 1;
    });
    return [
      { value: 'all', label: '전체 학기' },
      ...sorted.map((key) => {
        const [year, term] = key.split('-');
        return { value: key, label: `${year}학년 ${term === 'spring' ? '1' : '2'}학기` };
      }),
    ];
  })();

  // Filter courses by category AND semester
  const filteredCourses = stats.courseStats.filter(c => {
    const categoryMatch = selectedCategory === 'all' || c.category === selectedCategory;
    if (!categoryMatch) return false;
    if (selectedSemester === 'all') return true;
    const [yearStr, term] = selectedSemester.split('-');
    const year = Number(yearStr);
    return (c.semesters || []).some(s => s.year === year && s.term === term);
  });

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const remainingCount = Math.max(0, filteredCourses.length - visibleCount);

  const categoryTabs: { value: 'all' | RequirementCategory; label: string }[] = [
    { value: 'all', label: '전체' },
    ...(Object.keys(CATEGORY_LABELS) as RequirementCategory[]).map((cat) => ({
      value: cat,
      label: CATEGORY_LABELS[cat],
    })),
  ];

  return (
    <div>
      <PageHeader
        title="학과 통계"
        description={`${stats.departmentName} 학생들이 많이 듣는 과목 · ${stats.totalStudents}명의 학생 데이터 기반 · ${formatRelativeTime(new Date(stats.updatedAt))} 갱신`}
      />

      {/* Guest Login Recommendation */}
      {isGuest && (
        <div className="-mt-3 flex flex-wrap items-center gap-x-1 gap-y-0 pb-5 md:pb-6">
          <p className="m-0 mr-2 text-[14px] leading-5 text-ink">
            로그인하면 나의 수강 계획이 통계에 반영되어, 같은 학과 학생들이 더 정확한 데이터를 참고할 수 있어요.
          </p>
          <Button variant="textPrimary" size="sm" onClick={loginWithGoogle} className="-ml-2.5 h-11 md:h-9">
            구글로 로그인
          </Button>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: 'text', size: 'sm' }), 'h-11 md:h-9')}
          >
            회원가입
          </Link>
        </div>
      )}

      {/* Popular Courses */}
      <section aria-labelledby="popular-title" className={SECTION_CLASS}>
        <SectionHeader
          id="popular-title"
          title="인기 과목"
          meta={`${filteredCourses.length}과목`}
          className="min-h-12 flex-wrap items-center md:min-h-0 md:items-end"
          action={
            <div className="flex items-center gap-2">
              <label htmlFor="stats-semester" className="text-[13px] text-ink-2">
                학기
              </label>
              <div className="relative">
                <select
                  id="stats-semester"
                  value={selectedSemester}
                  onChange={(e) => {
                    setSelectedSemester(e.target.value);
                    setVisibleCount(INITIAL_VISIBLE);
                  }}
                  className="h-11 cursor-pointer appearance-none rounded-none border-0 border-b border-line-3 bg-transparent pr-7 pl-2 text-[14px] font-semibold text-ink transition-colors duration-150 focus:border-primary focus:outline-none md:h-9"
                >
                  {semesterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 right-1 h-4 w-4 -translate-y-1/2 text-ink-2"
                />
              </div>
            </div>
          }
        />

        <div
          role="group"
          aria-label="이수구분 필터"
          className="mt-2 flex flex-wrap gap-x-5 border-b border-line md:mt-4 md:gap-x-6"
        >
          {categoryTabs.map((tab) => {
            const active = selectedCategory === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(tab.value);
                  setVisibleCount(INITIAL_VISIBLE);
                }}
                aria-pressed={active}
                className={cn(
                  'h-11 border-b-2 px-0.5 text-[15px] transition-colors duration-150 ease-out',
                  active
                    ? 'border-ink font-semibold text-ink'
                    : 'border-transparent font-medium text-ink-2 hover:text-ink'
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {filteredCourses.length === 0 ? (
          <div className="border-b border-line py-4 text-[14px] leading-5 text-ink-2">
            {stats.courseStats.length === 0 ? (
              <>
                <p className="m-0 font-medium text-ink">아직 수강 계획 데이터가 없습니다</p>
                <p className="m-0 mt-0.5">학과 학생들이 수강 계획을 작성하면 이곳에 인기 과목이 표시됩니다</p>
              </>
            ) : (
              <p className="m-0">해당 조건에 맞는 과목이 없습니다.</p>
            )}
          </div>
        ) : (
          <ol className="m-0 flex list-none flex-col p-0">
            {visibleCourses.map((course, index) => (
              <li
                key={course.courseId}
                className="flex min-h-14 items-center gap-3 border-b border-line py-1.5 lg:gap-5"
              >
                <span className="w-6 shrink-0 text-[13px] font-semibold tabular-nums text-ink-2">
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-[1_1_220px]">
                  <span className="truncate text-[15px] leading-5 font-medium text-ink">{course.name}</span>
                  <CategoryLabel category={course.category} suffix={`${course.code} · ${course.credits}학점`} />
                </div>
                <ProgressBar percent={course.percentage} className="hidden lg:block lg:flex-[2_1_200px]" />
                <div className="flex shrink-0 flex-col items-end gap-1.5 lg:w-[132px]">
                  <span className="text-[15px] font-semibold tabular-nums text-ink">
                    {course.percentage.toFixed(1)}%{' '}
                    <span className="text-[13px] font-medium text-ink-2">({course.studentCount}명)</span>
                  </span>
                  <ProgressBar percent={course.percentage} className="w-20 lg:hidden" />
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3">
          <span className="text-[13px] leading-[18px] text-ink-2">
            해당 학과 전체 가입자 중 비율입니다 (빈 계획 포함) · 직접 추가한 과목은 빼고 공식 교과목만 집계해요
          </span>
          {filteredCourses.length > INITIAL_VISIBLE && (
            remainingCount > 0 ? (
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + MORE_STEP)}
                className="h-11 text-[14px] font-semibold text-ink transition-colors duration-150 hover:text-primary md:h-9"
              >
                {Math.min(MORE_STEP, remainingCount)}개 더보기
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                className="h-11 text-[14px] font-semibold text-ink transition-colors duration-150 hover:text-primary md:h-9"
              >
                접기
              </button>
            )
          )}
        </div>
      </section>

      <SectionBand />

      {/* Semester Distribution */}
      <section aria-labelledby="avg-title" className={SECTION_CLASS}>
        <SectionHeader
          id="avg-title"
          title="학기별 평균 수강 현황"
          className="min-h-12 items-center md:min-h-0"
        />
        <p className="m-0 mb-3 text-[14px] leading-5 text-ink-2 md:mt-1.5">
          같은 학과 학생들의 학기별 평균 수강 과목 수와 학점입니다
        </p>
        {stats.semesterDistribution.length === 0 ? (
          <p className="m-0 border-b border-line py-3.5 text-[14px] leading-5 text-ink-2">
            아직 집계된 학기가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col">
            {stats.semesterDistribution.map((sem) => (
              <div
                key={`${sem.year}-${sem.term}`}
                className="flex h-[46px] items-center gap-3 border-b border-line md:gap-5"
              >
                <span className="w-[84px] shrink-0 text-[14px] font-semibold text-ink md:w-[104px]">
                  {sem.year}학년 {sem.term === 'spring' ? '1' : '2'}학기
                </span>
                <ProgressBar
                  percent={(sem.avgCredits / MAX_SEMESTER_CREDITS) * 100}
                  className="min-w-0 flex-1"
                />
                <span className="shrink-0 text-right text-[14px] font-semibold tabular-nums text-ink md:w-[150px]">
                  {sem.avgCourses.toFixed(1)}과목{' '}
                  <span className="font-medium text-ink-2">· {sem.avgCredits.toFixed(1)}학점</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <SectionBand />

      {/* Anonymous Plans */}
      <section aria-labelledby="anon-title" className="flex flex-col pt-2 md:border-t md:border-line-2 md:pt-7">
        <SectionHeader id="anon-title" title="익명 수강계획 열람" className="min-h-12 items-center md:min-h-0" />
        <p className="m-0 mb-3 text-[14px] leading-5 text-ink-2 md:mt-1.5">
          같은 학과 학생들의 수강 계획을 참고하세요
        </p>

        {isGuest ? (
          <div className="flex flex-col gap-1 border-t border-line pt-4">
            <p className="m-0 text-[15px] leading-5 font-medium text-ink">
              로그인하면 다른 학생들의 수강 계획을 열람할 수 있습니다
            </p>
            <p className="m-0 text-[14px] leading-5 text-ink-2">
              회원가입 후 나의 계획을 등록하면, 같은 학과 학생들의 익명 수강 계획도 참고할 수 있어요.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-4">
              <Button onClick={loginWithGoogle}>구글로 로그인</Button>
              <Link href="/register" className={buttonVariants({ variant: 'text' })}>
                회원가입하기
              </Link>
            </div>
          </div>
        ) : plansLoading ? (
          <div className="flex flex-col" role="status" aria-label="수강계획을 불러오는 중">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex h-14 items-center gap-4 border-b border-line">
                <div className="h-4 flex-1 animate-pulse rounded-[4px] bg-fill" />
                <div className="h-4 w-8 animate-pulse rounded-[4px] bg-fill" />
              </div>
            ))}
          </div>
        ) : plansError ? (
          <div role="alert" className="flex flex-col items-start gap-2 border-t border-line py-4">
            <p className="m-0 text-[14px] text-negative">
              수강 계획을 불러오지 못했습니다.
            </p>
            <Button variant="textPrimary" onClick={() => refetchPlans()} disabled={plansFetching}>
              {plansFetching ? '다시 불러오는 중...' : '다시 시도'}
            </Button>
          </div>
        ) : plansData?.plans.length === 0 ? (
          <div className="border-t border-line py-4 text-[14px] leading-5 text-ink-2">
            <p className="m-0 font-medium text-ink">아직 공개된 수강 계획이 없습니다</p>
            <p className="m-0 mt-0.5">학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다</p>
          </div>
        ) : (
          <>
            <ul className="m-0 flex list-none flex-col p-0">
              {plansData?.plans.slice(0, 3).map((plan, index) => {
                const label = index + 1;
                return (
                  <li key={plan.anonymousId}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanId(plan.anonymousId)}
                      className="group flex min-h-14 w-full items-center gap-4 border-b border-line py-1.5 text-left transition-colors duration-150 hover:bg-fill/60"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[15px] leading-5 font-medium text-ink">계획 {label}</span>
                        <span className="text-[12px] leading-4 text-ink-2">
                          {plan.semesterCount}학기 계획 · {plan.totalCourses}과목 · {plan.totalCredits}학점
                        </span>
                      </span>
                      <span className="text-[13px] font-semibold text-ink-2 transition-colors duration-150 group-hover:text-ink">
                        보기
                      </span>
                      <ChevronRight aria-hidden="true" className="h-[18px] w-[18px] text-placeholder" />
                    </button>
                  </li>
                );
              })}
            </ul>

            {plansData && plansData.plans.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 pt-3">
                <span className="text-[13px] leading-[18px] text-ink-2">모든 계획은 익명으로 표시됩니다</span>
                {plansData.total > 3 && (
                  <button
                    type="button"
                    onClick={() => setIsAllPlansModalOpen(true)}
                    className="inline-flex h-11 items-center gap-0.5 text-[14px] font-semibold text-ink transition-colors duration-150 hover:text-primary md:h-9"
                  >
                    전체 {plansData.total}개 수강계획 보기
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Anonymous Plan Detail Modal */}
      {!isGuest && selectedPlanId && (
        <AnonymousPlanModal
          isOpen={true}
          anonymousId={selectedPlanId}
          planNumber={(plansData?.plans.findIndex((plan) => plan.anonymousId === selectedPlanId) ?? -1) + 1}
          departmentId={effectiveDepartmentId}
          onClose={() => setSelectedPlanId(null)}
        />
      )}

      {/* All Plans Modal */}
      {!isGuest && isAllPlansModalOpen && (
        <AllPlansModal
          isOpen={isAllPlansModalOpen}
          onClose={() => setIsAllPlansModalOpen(false)}
          departmentId={effectiveDepartmentId}
        />
      )}
    </div>
  );
}
