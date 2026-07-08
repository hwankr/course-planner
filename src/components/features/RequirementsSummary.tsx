'use client';

import { useState } from 'react';
import {
  useGraduationRequirement,
  useGraduationProgress,
  useUpsertGraduationRequirement,
  useCreateDefaultGraduationRequirement,
} from '@/hooks/useGraduationRequirements';
import { RequirementForm } from '@/components/features/RequirementForm';
import { Card, CardContent, Button } from '@/components/ui';
import { useSession } from 'next-auth/react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { DEFAULT_REQUIREMENT_YEAR } from '@/lib/constants';
import * as Sentry from '@sentry/nextjs';

// ============================================
// View-mode presentational components
// ============================================

const PLANNED_STRIPES =
  'repeating-linear-gradient(135deg, #93c5fd 0 3px, #dbeafe 3px 6px)';

interface SegmentValues {
  earned: number;
  enrolled?: number;
  planned?: number;
  required: number;
}

function isMet({ earned, required }: SegmentValues) {
  return required > 0 && earned >= required;
}

/** 이수 → 수강중 → 예정 순서로 나란히 이어지는 스택 바. 누적 100% 초과분은 클램프. */
function StackedBar({ earned, enrolled = 0, planned = 0, required, size = 'md' }: SegmentValues & { size?: 'lg' | 'md' | 'sm' }) {
  const height = size === 'lg' ? 'h-2.5' : size === 'md' ? 'h-2' : 'h-1.5';
  const met = isMet({ earned, required });

  let widths = { earned: 0, enrolled: 0, planned: 0 };
  if (required > 0) {
    const e = Math.min((earned / required) * 100, 100);
    const n = Math.min((enrolled / required) * 100, Math.max(0, 100 - e));
    const p = Math.min((planned / required) * 100, Math.max(0, 100 - e - n));
    widths = { earned: e, enrolled: n, planned: p };
  }

  return (
    <div className={`flex-1 ${height} bg-gray-100 rounded-full overflow-hidden flex`}>
      {widths.earned > 0 && (
        <div className={met ? 'bg-emerald-500' : 'bg-blue-600'} style={{ width: `${widths.earned}%` }} />
      )}
      {widths.enrolled > 0 && (
        <div className="bg-sky-400" style={{ width: `${widths.enrolled}%` }} />
      )}
      {widths.planned > 0 && (
        <div style={{ width: `${widths.planned}%`, backgroundImage: PLANNED_STRIPES }} />
      )}
    </div>
  );
}

/** 바 아래 수치 라인: 색 점 + "이수 N · 수강중 N · 예정 N · 미계획 N". 0인 항목은 숨김. */
function BreakdownLine({ earned, enrolled = 0, planned = 0, required, prior = 0, className = '' }: SegmentValues & { prior?: number; className?: string }) {
  const met = isMet({ earned, required });
  const unplanned = Math.max(0, required - earned - enrolled - planned);

  if (met && enrolled === 0 && planned === 0) {
    return <p className={`text-[11px] text-emerald-600 ${className}`}>요건 충족</p>;
  }

  return (
    <p className={`text-[11px] text-gray-400 flex items-center gap-x-2.5 gap-y-0.5 flex-wrap ${className}`}>
      <span className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-[2px] inline-block ${met ? 'bg-emerald-500' : 'bg-blue-600'}`} />
        이수 {earned}
        {prior > 0 && <> (기이수 {prior} 포함)</>}
      </span>
      {enrolled > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block bg-sky-400" />
          수강중 {enrolled}
        </span>
      )}
      {planned > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block" style={{ backgroundImage: PLANNED_STRIPES }} />
          예정 {planned}
        </span>
      )}
      {unplanned > 0 && (
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-[2px] inline-block bg-gray-200" />
          미계획 {unplanned}
        </span>
      )}
    </p>
  );
}

/** 요건 한 줄: 라벨 + 스택 바 + "이수/필요" + 아래 수치 라인. sub=true면 들여쓴 얇은 서브 행. */
function TrackRow({ label, earned, enrolled = 0, planned = 0, required, prior = 0, sub = false }: SegmentValues & { label: string; prior?: number; sub?: boolean }) {
  const met = isMet({ earned, required });
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`w-16 flex-shrink-0 whitespace-nowrap ${sub ? 'pl-3 text-[11px] text-gray-400' : 'text-xs text-gray-600'}`}>
          {sub ? `└ ${label}` : label}
        </span>
        <StackedBar earned={earned} enrolled={enrolled} planned={planned} required={required} size={sub ? 'sm' : 'md'} />
        <span className={`w-16 flex-shrink-0 text-right whitespace-nowrap ${sub ? 'text-[11px]' : 'text-xs'} ${met ? 'text-emerald-600' : 'text-gray-500'}`}>
          {met && '✓ '}
          <span className="font-medium">{earned}</span>/{required}
        </span>
      </div>
      <BreakdownLine
        earned={earned}
        enrolled={enrolled}
        planned={planned}
        required={required}
        prior={prior}
        className="mt-0.5 pl-[72px]"
      />
    </div>
  );
}

export function RequirementsSummary() {
  const [isEditing, setIsEditing] = useState(false);
  const [requirementYear, setRequirementYear] = useState<number>(DEFAULT_REQUIREMENT_YEAR);

  const { data: requirement, isLoading: loadingReq } = useGraduationRequirement();
  const { data: progress, isLoading: loadingProgress } = useGraduationProgress();
  const upsertMutation = useUpsertGraduationRequirement();
  const createDefaults = useCreateDefaultGraduationRequirement();

  // Get user's profile majorType for conditional radio display
  const { data: session } = useSession();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestProfileMajorType = useGuestProfileStore((s) => s.majorType);
  const guestDepartmentCollege = useGuestProfileStore((s) => s.departmentCollege);
  const guestDepartmentName = useGuestProfileStore((s) => s.departmentName);
  const userMajorType = isGuest ? guestProfileMajorType : (session?.user?.majorType || 'single');

  // Sync requirementYear from saved requirement on load
  const [yearInitialized, setYearInitialized] = useState(false);
  if (requirement?.requirementYear && !yearInitialized) {
    setRequirementYear(requirement.requirementYear);
    setYearInitialized(true);
  }

  // Auto-fill callback: fetches DepartmentRequirement for user's department + selected year
  const handleLoadFromDeptReq = async () => {
    let college: string | undefined;
    let departmentName: string | undefined;

    if (isGuest) {
      college = guestDepartmentCollege ?? undefined;
      departmentName = guestDepartmentName ?? undefined;
    } else if (session?.user?.department) {
      // Fetch department info by ID to get college and name
      const deptRes = await fetch(`/api/departments/${session.user.department}`);
      if (deptRes.ok) {
        const deptJson = await deptRes.json();
        if (deptJson.success && deptJson.data) {
          college = deptJson.data.college;
          departmentName = deptJson.data.name;
        }
      }
    }

    if (!college || !departmentName) return null;

    const params = new URLSearchParams({
      college,
      departmentName,
      majorType: userMajorType || 'single',
      year: String(requirementYear),
    });
    const res = await fetch(`/api/department-requirements?${params}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  };

  const isLoading = loadingReq || loadingProgress;

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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Empty state - no requirement set
  if (!requirement) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-4">
          {isEditing ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">졸업 요건 입력</p>
              {saveError && <p className="text-sm text-red-500 mb-2">{saveError}</p>}
              <RequirementForm
                onSubmit={handleUpsert}
                onCancel={() => { setIsEditing(false); setSaveError(''); }}
                isLoading={upsertMutation.isPending}
                userMajorType={userMajorType}
                onLoadFromDeptReq={handleLoadFromDeptReq}
                requirementYear={requirementYear}
                onYearChange={setRequirementYear}
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-gray-500">졸업 요건을 설정하세요</p>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  직접 입력
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateDefault}
                  disabled={createDefaults.isPending}
                >
                  {createDefaults.isPending ? '생성 중...' : '기본 요건 생성'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">졸업 요건 수정</p>
          </div>
          {saveError && <p className="text-sm text-red-500 mb-2">{saveError}</p>}
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
            }}
            onSubmit={handleUpsert}
            onCancel={() => { setIsEditing(false); setSaveError(''); }}
            isLoading={upsertMutation.isPending}
            userMajorType={userMajorType}
            onLoadFromDeptReq={handleLoadFromDeptReq}
            requirementYear={requirementYear}
            onYearChange={setRequirementYear}
          />
        </CardContent>
      </Card>
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

  // Prior earned credits (기이수)
  const priorTotal = requirement.earnedTotalCredits || 0;
  const priorMajor = requirement.earnedPrimaryMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedPrimaryMajorRequiredCredits || 0;

  // Prior earned for secondary/minor
  const priorSecondaryMajor = requirement.earnedSecondaryMajorCredits || 0;
  const priorSecondaryMajorRequired = requirement.earnedSecondaryMajorRequiredCredits || 0;
  const priorMinor = requirement.earnedMinorCredits || 0;
  const priorMinorRequired = requirement.earnedMinorRequiredCredits || 0;

  // 계획 반영 시 예상 진행률 (이수 + 수강중 + 예정)
  const projected = total.required > 0
    ? Math.min(Math.round(((total.earned + total.enrolled + total.planned) / total.required) * 100), 100)
    : 0;

  return (
    <Card>
      <CardContent className="py-3 px-3 sm:px-4">
        {/* 헤더: 제목 + 연도 뱃지 + 진행률 */}
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">졸업 요건</span>
            {requirement?.requirementYear && (
              <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {requirement.requirementYear}년 기준
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-lg font-semibold ${total.percentage >= 100 ? 'text-emerald-600' : 'text-gray-800'}`}>
              {total.percentage}%
            </span>
            {projected > total.percentage && (
              <span className="text-xs text-gray-400 whitespace-nowrap">→ 계획 반영 시 {projected}%</span>
            )}
          </div>
        </div>

        {/* 총 학점 히어로 바 */}
        <div className="mt-2 flex items-center gap-2">
          <StackedBar earned={total.earned} enrolled={total.enrolled} planned={total.planned} required={total.required} size="lg" />
          <span className="text-xs text-gray-500 whitespace-nowrap">
            <span className="font-medium text-gray-700">{total.earned}</span>/{total.required}학점
          </span>
        </div>
        <BreakdownLine
          earned={total.earned}
          enrolled={total.enrolled}
          planned={total.planned}
          required={total.required}
          prior={priorTotal}
          className="mt-1.5"
        />

        {/* 요건별 상세 */}
        <div className="mt-3 pt-3 border-t space-y-2.5">
          <TrackRow label="전공" earned={major.earned} enrolled={major.enrolled} planned={major.planned} required={major.required} prior={priorMajor} />
          <TrackRow label="핵심" sub earned={major.requiredMin.earned} enrolled={major.requiredMin.enrolled ?? 0} planned={major.requiredMin.planned ?? 0} required={major.requiredMin.required} prior={priorMajorRequired} />
          {minorPrimaryMajorMin && (
            <TrackRow label="주전공최소" sub earned={minorPrimaryMajorMin.earned} required={minorPrimaryMajorMin.required} />
          )}

          {secondaryMajor && (
            <>
              <TrackRow label="복수전공" earned={secondaryMajor.earned} enrolled={secondaryMajor.enrolled} planned={secondaryMajor.planned} required={secondaryMajor.required} prior={priorSecondaryMajor} />
              <TrackRow label="핵심" sub earned={secondaryMajor.requiredMin.earned} enrolled={secondaryMajor.requiredMin.enrolled ?? 0} planned={secondaryMajor.requiredMin.planned ?? 0} required={secondaryMajor.requiredMin.required} prior={priorSecondaryMajorRequired} />
            </>
          )}

          {minor && (
            <>
              <TrackRow label="부전공" earned={minor.earned} enrolled={minor.enrolled} planned={minor.planned} required={minor.required} prior={priorMinor} />
              <TrackRow label="핵심" sub earned={minor.requiredMin.earned} enrolled={minor.requiredMin.enrolled ?? 0} planned={minor.requiredMin.planned ?? 0} required={minor.requiredMin.required} prior={priorMinorRequired} />
            </>
          )}

          <TrackRow label="교양" earned={general.earned} enrolled={general.enrolled} planned={general.planned} required={general.required} prior={priorGeneral} />
        </div>

        {/* 푸터: 도움말 + 요건 수정 */}
        <div className="mt-3 pt-2.5 border-t flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-gray-400">과목 카드의 상태(예정·수강중·이수)를 바꾸면 바로 반영됩니다.</span>
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#153974] bg-[#153974]/10 hover:bg-[#153974]/20 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            요건 수정
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
