'use client';

import { useState } from 'react';
import {
  useGraduationRequirement,
  useGraduationProgress,
  useUpsertGraduationRequirement,
  useCreateDefaultGraduationRequirement,
} from '@/hooks/useGraduationRequirements';
import { RequirementForm } from '@/components/features/RequirementForm';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { usePlanStore } from '@/stores/planStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import type { MajorType } from '@/types';
import { DEFAULT_REQUIREMENT_YEAR } from '@/lib/constants';
import { effectivePriorTotal, isSemesterCoveredByPrior } from '@/lib/priorCredits';
import {
  resolveGraduationSummaryState,
  retryGraduationSummaryQueries,
} from '@/lib/graduationSummaryState';
import * as Sentry from '@sentry/nextjs';

// ============================================
// View-mode presentational components
// ============================================

interface SegmentValues {
  earned: number;
  enrolled?: number;
  planned?: number;
  required: number;
}

function isMet({ earned, required }: SegmentValues) {
  return required > 0 && earned >= required;
}

/** 이수(Primary) → 수강중(Primary 45%) → 예정(중간톤) 순서의 6px 바. 누적 100% 초과분은 클램프. */
function StackedBar({ earned, enrolled = 0, planned = 0, required, label }: SegmentValues & { label: string }) {
  let widths = { earned: 0, enrolled: 0, planned: 0 };
  if (required > 0) {
    const e = Math.min((earned / required) * 100, 100);
    const n = Math.min((enrolled / required) * 100, Math.max(0, 100 - e));
    const p = Math.min((planned / required) * 100, Math.max(0, 100 - e - n));
    widths = { earned: e, enrolled: n, planned: p };
  }

  return (
    <div role="img" aria-label={label} className="flex h-1.5 overflow-hidden rounded-[3px] bg-line">
      <div className="bg-primary transition-[width] duration-200 ease-out" style={{ width: `${widths.earned}%` }} />
      <div className="bg-primary/45 transition-[width] duration-200 ease-out" style={{ width: `${widths.enrolled}%` }} />
      <div className="bg-bar-mid transition-[width] duration-200 ease-out" style={{ width: `${widths.planned}%` }} />
    </div>
  );
}

/** "54 / 72학점" — 충족하면 숫자를 Positive로 */
function CreditValue({ earned, required, unit = '학점', sub = false }: SegmentValues & { unit?: string; sub?: boolean }) {
  return (
    <span
      className={cn(
        'shrink-0 font-semibold tabular-nums',
        sub ? 'text-[14px]' : 'text-[15px]',
        isMet({ earned, required }) ? 'text-positive' : 'text-ink'
      )}
    >
      {earned} <span className="font-medium text-ink-2">/ {required}{unit}</span>
    </span>
  );
}

/** 요건 행 보조 설명: "이수 12 (기이수 6 포함) · 수강중 3 · 예정 6". 0인 수강중/예정은 숨김. */
function breakdownCaption({ earned, enrolled = 0, planned = 0, required, prior = 0 }: SegmentValues & { prior?: number }) {
  if (isMet({ earned, required }) && enrolled === 0 && planned === 0) return '요건 충족';
  if (earned === 0 && enrolled === 0 && planned === 0) return '아직 계획이 없어요';
  const parts = [`이수 ${earned}${prior > 0 ? ` (기이수 ${prior} 포함)` : ''}`];
  if (enrolled > 0) parts.push(`수강중 ${enrolled}`);
  if (planned > 0) parts.push(`예정 ${planned}`);
  return parts.join(' · ');
}

/** 요건 행: 이름 + 보조 설명(12/16 Ink2) · 이수/필요. 높이 52(데스크톱)/56(모바일), 하위 요건은 padding-left 16 */
function TrackRow({
  label,
  sub = false,
  prior = 0,
  unit,
  ...values
}: SegmentValues & { label: string; sub?: boolean; prior?: number; unit?: string }) {
  return (
    <div className={cn('flex min-h-14 items-center gap-3 border-b border-line py-1.5 md:min-h-[52px] md:gap-4', sub && 'pl-4')}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={sub ? 'text-[14px] leading-5 font-medium text-ink-2' : 'text-[15px] leading-5 font-semibold text-ink'}>{label}</span>
        <span className="text-[12px] leading-4 text-ink-2 tabular-nums">{breakdownCaption({ ...values, prior })}</span>
      </span>
      <CreditValue {...values} sub={sub} unit={unit} />
    </div>
  );
}

/** 모바일 섹션 구분 띠 (Fill 10px, 페이지 가터만큼 좌우로 확장) */
function MobileBand() {
  return <div aria-hidden="true" className="-mx-5 h-2.5 bg-fill md:hidden" />;
}

const sectionClass = 'border-y border-line-2 py-8 md:pb-9';

export function RequirementsSummary() {
  const [isEditing, setIsEditing] = useState(false);
  const [requirementYear, setRequirementYear] = useState<number>(DEFAULT_REQUIREMENT_YEAR);
  const [retryingAfterError, setRetryingAfterError] = useState(false);

  const requirementQuery = useGraduationRequirement();
  const progressQuery = useGraduationProgress();
  const requirementData = requirementQuery.data;
  const progress = progressQuery.data;
  const upsertMutation = useUpsertGraduationRequirement();
  const createDefaults = useCreateDefaultGraduationRequirement();

  const summaryState = resolveGraduationSummaryState({
    requirement: requirementData,
    progress,
    requirementIsLoading: requirementQuery.isLoading,
    progressIsLoading: progressQuery.isLoading,
    requirementIsError: requirementQuery.isError,
    progressIsError: progressQuery.isError,
    retryingAfterError,
  });
  const isRetrying =
    retryingAfterError || requirementQuery.isFetching || progressQuery.isFetching;

  // Get user's profile majorType for conditional radio display
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestProfileMajorType = useGuestProfileStore((s) => s.majorType);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestSecondaryDepartmentId = useGuestProfileStore((s) => s.secondaryDepartmentId);
  const userMajorType = isGuest ? guestProfileMajorType : (session?.user?.majorType || 'single');

  // 기이수 반영 기준 학기 선택지: 현재 계획에 존재하는 학기 목록
  const activePlanSemesters = usePlanStore((s) => s.activePlan?.semesters);
  const guestPlanSemesters = useGuestPlanStore((s) => s.plan?.semesters);
  const planSemesters = isGuest ? guestPlanSemesters : activePlanSemesters;
  const semesterOptions = (planSemesters ?? [])
    .map((s) => ({ year: s.year, term: s.term }))
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : (a.term === 'spring' ? 1 : 2) - (b.term === 'spring' ? 1 : 2)))
    .map(({ year, term }) => ({
      year,
      term,
      label: `${year}학년 ${term === 'spring' ? '1' : '2'}학기`,
    }));

  // 기준 학기 자동 제안: '이수' 과목이 있는 가장 마지막 학기 (성적표에 반영됐을 가능성이 높은 기준점)
  const suggestedCutoff = (planSemesters ?? [])
    .filter((s) => s.courses.some((c) => c.status === 'completed'))
    .reduce<{ year: number; term: 'spring' | 'fall'; label: string } | null>((acc, s) => {
      if (acc && isSemesterCoveredByPrior(s.year, s.term, acc.year, acc.term)) return acc;
      return { year: s.year, term: s.term, label: `${s.year}학년 ${s.term === 'spring' ? '1' : '2'}학기` };
    }, null);

  // Sync requirementYear from saved requirement on load
  const [yearInitialized, setYearInitialized] = useState(false);
  if (requirementData?.requirementYear && !yearInitialized) {
    setRequirementYear(requirementData.requirementYear);
    setYearInitialized(true);
  }

  // Auto-fill callback: fetches DepartmentRequirement for user's department + selected year
  const handleLoadFromDeptReq = async (majorType: MajorType = userMajorType) => {
    const primaryId = isGuest ? guestDepartmentId : session?.user?.department;
    const secondaryId = isGuest ? guestSecondaryDepartmentId : session?.user?.secondaryDepartment;
    const load = async (departmentId: string, track: 'primary' | 'secondary') => {
      const params = new URLSearchParams({ departmentId, majorType, track, year: String(requirementYear) });
      const response = await fetch(`/api/department-requirements?${params}`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.success ? json.data : null;
    };
    if (!primaryId || (majorType !== 'single' && !secondaryId)) return null;
    const [primary, secondary] = await Promise.all([
      load(primaryId, 'primary'),
      majorType !== 'single' && secondaryId ? load(secondaryId, 'secondary') : {},
    ]);
    return primary && secondary ? { ...primary, ...secondary } : null;
  };

  const handleRetry = async () => {
    try {
      await retryGraduationSummaryQueries({
        setRetryingAfterError,
        refetchRequirement: () => requirementQuery.refetch(),
        refetchProgress: () => progressQuery.refetch(),
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const handleCreateDefault = async () => {
    try {
      await createDefaults.mutateAsync();
    } catch (error) {
      Sentry.captureException(error);
    }
  };

  const [saveError, setSaveError] = useState('');

  const handleUpsert = async (data: {
    majorType: 'single' | 'double' | 'minor';
    totalCredits: number;
    primaryMajorCredits: number;
    primaryMajorRequiredMin: number;
    generalCredits: number;
    secondaryMajorCredits?: number;
    secondaryMajorRequiredMin?: number;
    minorCredits?: number;
    minorRequiredMin?: number;
    minorPrimaryMajorMin?: number;
    earnedTotalCredits: number;
    earnedPrimaryMajorCredits: number;
    earnedGeneralCredits: number;
    earnedPrimaryMajorRequiredCredits: number;
    earnedSecondaryMajorCredits?: number;
    earnedSecondaryMajorRequiredCredits?: number;
    earnedMinorCredits?: number;
    earnedMinorRequiredCredits?: number;
    priorCutoffYear?: number | null;
    priorCutoffTerm?: 'spring' | 'fall' | null;
  }) => {
    setSaveError('');
    try {
      await upsertMutation.mutateAsync({ ...data, requirementYear });
      setIsEditing(false);
    } catch (error) {
      Sentry.captureException(error);
      setSaveError(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  // Loading state
  if (summaryState === 'loading') {
    return (
      <section aria-label="졸업 요건" aria-busy="true" className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] md:gap-14 md:border-y md:border-line-2 md:pt-8 md:pb-9">
        <div className="h-[170px] md:h-auto">
          <div className="h-[22px] w-20 animate-pulse bg-fill" />
          <div className="mt-1 h-[38px] w-56 animate-pulse bg-fill md:h-[52px]" />
          <div className="mt-5 h-1.5 animate-pulse bg-fill" />
        </div>
        <MobileBand />
        <div className="py-2 md:py-0">
          <div className="h-12 md:hidden" />
          {Array.from({ length: (requirementData?.majorType ?? userMajorType) === 'single' ? 4 : (requirementData?.majorType ?? userMajorType) === 'minor' ? 7 : 6 }, (_, i) => (
            <div key={i} className="flex h-14 items-center justify-between border-b border-line md:h-[52px]">
              <div className="h-5 w-20 animate-pulse bg-fill" />
              <div className="h-5 w-24 animate-pulse bg-fill" />
            </div>
          ))}
          <div className="hidden h-8 md:block" />
        </div>
      </section>
    );
  }

  // Error state - one or both queries failed
  if (summaryState === 'error') {
    return (
      <section role="alert" aria-label="졸업 요건" className={cn(sectionClass, 'flex flex-wrap items-center justify-between gap-3')}>
        <p className="m-0 text-[15px] font-medium text-negative">졸업요건 정보를 불러오지 못했습니다.</p>
        <Button size="sm" variant="text" onClick={handleRetry} disabled={isRetrying}>
          {isRetrying ? '다시 시도 중...' : '다시 시도'}
        </Button>
      </section>
    );
  }

  // Empty state - no requirement set
  if (summaryState === 'empty') {
    return (
      <section aria-labelledby="req-title" className={sectionClass}>
        {isEditing ? (
          <div className="flex flex-col gap-4">
            <h2 id="req-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">졸업 요건 입력</h2>
            {saveError && <p role="alert" className="m-0 text-[13px] font-medium text-negative">{saveError}</p>}
            <RequirementForm
              onSubmit={handleUpsert}
              onCancel={() => { setIsEditing(false); setSaveError(''); }}
              isLoading={upsertMutation.isPending}
              userMajorType={userMajorType}
              onLoadFromDeptReq={handleLoadFromDeptReq}
              requirementYear={requirementYear}
              onYearChange={setRequirementYear}
              semesterOptions={semesterOptions}
              suggestedCutoff={suggestedCutoff}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 id="req-title" className="m-0 text-[15px] leading-[22px] font-medium text-ink-2">졸업까지</h2>
              <p className="m-0 text-[22px] leading-[30px] font-bold tracking-[-0.02em] text-ink">졸업 요건을 설정하세요</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button size="sm" variant="text" onClick={() => setIsEditing(true)}>
                직접 입력
              </Button>
              <Button size="sm" variant="textPrimary" onClick={handleCreateDefault} disabled={createDefaults.isPending}>
                {createDefaults.isPending ? '생성 중...' : '기본 요건 생성'}
              </Button>
            </div>
          </div>
        )}
      </section>
    );
  }

  const requirement = requirementData!;

  // Edit mode
  if (isEditing) {
    return (
      <section aria-labelledby="req-title" className={sectionClass}>
        <div className="flex flex-col gap-4">
          <h2 id="req-title" className="m-0 text-[18px] leading-[26px] font-bold tracking-[-0.02em] text-ink">졸업 요건 수정</h2>
          {saveError && <p role="alert" className="m-0 text-[13px] font-medium text-negative">{saveError}</p>}
          <RequirementForm
            initialData={{
              majorType: requirement.majorType,
              totalCredits: requirement.totalCredits,
              primaryMajorCredits: requirement.primaryMajorCredits,
              primaryMajorRequiredMin: requirement.primaryMajorRequiredMin,
              generalCredits: requirement.generalCredits,
              secondaryMajorCredits: requirement.secondaryMajorCredits,
              secondaryMajorRequiredMin: requirement.secondaryMajorRequiredMin,
              minorCredits: requirement.minorCredits,
              minorRequiredMin: requirement.minorRequiredMin,
              minorPrimaryMajorMin: requirement.minorPrimaryMajorMin,
              earnedTotalCredits: requirement.earnedTotalCredits || 0,
              earnedPrimaryMajorCredits: requirement.earnedPrimaryMajorCredits || 0,
              earnedGeneralCredits: requirement.earnedGeneralCredits || 0,
              earnedPrimaryMajorRequiredCredits: requirement.earnedPrimaryMajorRequiredCredits || 0,
              earnedSecondaryMajorCredits: requirement.earnedSecondaryMajorCredits,
              earnedSecondaryMajorRequiredCredits: requirement.earnedSecondaryMajorRequiredCredits,
              earnedMinorCredits: requirement.earnedMinorCredits,
              earnedMinorRequiredCredits: requirement.earnedMinorRequiredCredits,
              priorCutoffYear: requirement.priorCutoffYear,
              priorCutoffTerm: requirement.priorCutoffTerm,
            }}
            onSubmit={handleUpsert}
            onCancel={() => { setIsEditing(false); setSaveError(''); }}
            isLoading={upsertMutation.isPending}
            userMajorType={userMajorType}
            onLoadFromDeptReq={handleLoadFromDeptReq}
            requirementYear={requirementYear}
            onYearChange={setRequirementYear}
            semesterOptions={semesterOptions}
            suggestedCutoff={suggestedCutoff}
          />
        </div>
      </section>
    );
  }

  // View mode - requirement exists
  const total = progress?.total ?? { required: requirement.totalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0 };
  const major = progress?.primaryMajor ?? {
    required: requirement.primaryMajorCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
    requiredMin: { required: requirement.primaryMajorRequiredMin, earned: 0, percentage: 0 },
  };
  const general = progress?.general ?? {
    required: requirement.generalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
  };

  const secondaryMajor = progress?.secondaryMajor;
  const minor = progress?.minor;
  const minorPrimaryMajorMin = progress?.minorPrimaryMajorMin;

  // Prior earned credits (기이수) — 총은 계산부와 동일하게 트랙 합계로 보정된 값 사용
  const priorTotal = effectivePriorTotal(requirement);
  const priorMajor = requirement.earnedPrimaryMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedPrimaryMajorRequiredCredits || 0;

  // Prior earned for secondary/minor
  const priorSecondaryMajor = requirement.earnedSecondaryMajorCredits || 0;
  const priorSecondaryMajorRequired = requirement.earnedSecondaryMajorRequiredCredits || 0;
  const priorMinor = requirement.earnedMinorCredits || 0;
  const priorMinorRequired = requirement.earnedMinorRequiredCredits || 0;

  // 자유선택: 별도 트랙이 없으므로 총합에서 전공(복수·부전공 포함)·교양을 뺀 화면 표시용 파생값 (완료 판정에는 쓰지 않음)
  const trackTotals = [major, general, ...(secondaryMajor ? [secondaryMajor] : []), ...(minor ? [minor] : [])];
  const freeOf = (pick: (t: { required: number; earned: number; enrolled: number; planned: number }) => number) =>
    Math.max(0, pick(total) - trackTotals.reduce((sum, t) => sum + (pick(t) || 0), 0));
  // 입력값이 없으면 NaN/0 이하가 되어 행을 숨긴다
  const free = {
    required: total.required - trackTotals.reduce((sum, t) => sum + (t.required || 0), 0),
    earned: freeOf((t) => t.earned),
    enrolled: freeOf((t) => t.enrolled),
    planned: freeOf((t) => t.planned),
  };
  const priorFree = Math.max(0, priorTotal - priorMajor - priorGeneral - priorSecondaryMajor - priorMinor);

  // 계획 반영 시 예상 진행률 (이수 + 수강중 + 예정)
  const projected = total.required > 0
    ? Math.min(Math.round(((total.earned + total.enrolled + total.planned) / total.required) * 100), 100)
    : 0;
  const remaining = Math.max(0, total.required - total.earned);
  const unplanned = Math.max(0, total.required - total.earned - total.enrolled - total.planned);
  const barLabel = `전체 ${total.required}학점 중 이수 ${total.earned}, 수강중 ${total.enrolled}, 예정 ${total.planned}`;

  // 완료 문구는 총학점과 모든 트랙·하위 요건(전공/핵심, 복수전공, 부전공, 주전공 최소, 교양)을 채웠을 때만
  const trackChecks: SegmentValues[] = [total, major, major.requiredMin, general];
  if (minorPrimaryMajorMin) trackChecks.push(minorPrimaryMajorMin);
  if (secondaryMajor) trackChecks.push(secondaryMajor, secondaryMajor.requiredMin);
  if (minor) trackChecks.push(minor, minor.requiredMin);
  const allRequirementsMet = trackChecks.every((t) => t.required <= 0 || t.earned >= t.required);
  const headline = allRequirementsMet
    ? '졸업 요건을 모두 채웠어요'
    : remaining > 0
      ? `${remaining}학점 남았어요`
      : '총학점은 채웠어요';

  const editLink = (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="-my-2 h-10 shrink-0 py-2 pl-2 text-[13px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover md:text-[14px]"
    >
      요건 수정
    </button>
  );

  return (
    <section
      aria-labelledby="req-title"
      className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(min(420px,100%),1fr))] md:gap-14 md:border-y md:border-line-2 md:pt-8 md:pb-9"
    >
      {/* 졸업까지: 큰 숫자 하나 + 진행 바 */}
      <div className="flex min-w-0 flex-col pb-7 md:pb-0">
        <h2 id="req-title" className="m-0 text-[15px] leading-[22px] font-medium text-ink-2">졸업까지</h2>
        <p className="mt-1 mb-0 text-[30px] leading-[38px] font-bold tracking-[-0.03em] text-ink md:mt-1.5 md:text-[44px] md:leading-[52px]">
          {headline}
        </p>
        <div className="mt-5 md:mt-7">
          <StackedBar earned={total.earned} enrolled={total.enrolled} planned={total.planned} required={total.required} label={barLabel} />
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[13px] leading-[18px] md:mt-3 md:text-[14px] md:leading-5">
          <span className="font-semibold tabular-nums text-ink">
            {total.earned} / {total.required}학점 <span className="font-medium text-ink-2">· 이수 {total.percentage}%</span>
          </span>
          {total.required > 0 && (
            <span className="font-semibold text-primary">계획 반영 시 {projected}%</span>
          )}
        </div>
        <p className="mt-1.5 mb-0 text-[13px] leading-[18px] text-ink-2 tabular-nums">
          이수 {total.earned}
          {priorTotal > 0 && <> (기이수 {priorTotal} 포함)</>}
          {' · '}수강중 {total.enrolled} · 예정 {total.planned} · 미계획 {unplanned}
        </p>
      </div>

      <MobileBand />

      {/* 요건 리스트: 행마다 이수·수강중·예정 보조 설명 */}
      <div className="flex min-w-0 flex-col py-2 md:py-0">
        <div className="flex h-12 items-center justify-between md:hidden">
          <h2 className="m-0 text-[16px] leading-6 font-bold text-ink">졸업 요건</h2>
          {editLink}
        </div>
        <TrackRow label="전공" earned={major.earned} enrolled={major.enrolled} planned={major.planned} required={major.required} prior={priorMajor} />
        <TrackRow label="전공핵심" sub earned={major.requiredMin.earned} enrolled={major.requiredMin.enrolled ?? 0} planned={major.requiredMin.planned ?? 0} required={major.requiredMin.required} prior={priorMajorRequired} />
        {minorPrimaryMajorMin && (
          <TrackRow label="주전공 최소" sub earned={minorPrimaryMajorMin.earned} required={minorPrimaryMajorMin.required} />
        )}
        {secondaryMajor && (
          <>
            <TrackRow label="복수전공" earned={secondaryMajor.earned} enrolled={secondaryMajor.enrolled} planned={secondaryMajor.planned} required={secondaryMajor.required} prior={priorSecondaryMajor} />
            <TrackRow label="복수전공 핵심" sub earned={secondaryMajor.requiredMin.earned} enrolled={secondaryMajor.requiredMin.enrolled ?? 0} planned={secondaryMajor.requiredMin.planned ?? 0} required={secondaryMajor.requiredMin.required} prior={priorSecondaryMajorRequired} />
          </>
        )}
        {minor && (
          <>
            <TrackRow label="부전공" earned={minor.earned} enrolled={minor.enrolled} planned={minor.planned} required={minor.required} prior={priorMinor} />
            <TrackRow label="부전공 핵심" sub earned={minor.requiredMin.earned} enrolled={minor.requiredMin.enrolled ?? 0} planned={minor.requiredMin.planned ?? 0} required={minor.requiredMin.required} prior={priorMinorRequired} />
          </>
        )}
        <TrackRow label="교양" earned={general.earned} enrolled={general.enrolled} planned={general.planned} required={general.required} prior={priorGeneral} />
        {free.required > 0 && (
          <TrackRow label="자유선택" earned={free.earned} enrolled={free.enrolled} planned={free.planned} required={free.required} prior={priorFree} />
        )}
        <div className="hidden flex-wrap items-center justify-between gap-4 pt-3 md:flex">
          <span className="text-[13px] leading-[18px] text-ink-2">과목의 상태를 누르면 바로 반영돼요</span>
          {editLink}
        </div>
      </div>
    </section>
  );
}
