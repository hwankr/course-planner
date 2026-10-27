'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { validatePriorCredits, isSemesterCoveredByPrior } from '@/lib/priorCredits';
import type { MajorType } from '@/types';

interface RequirementFormData {
  majorType: 'single' | 'double' | 'minor';
  totalCredits: number;
  primaryMajorCredits: number;
  primaryMajorRequiredMin: number;
  generalCredits: number;
  // Double major (optional)
  secondaryMajorCredits?: number;
  secondaryMajorRequiredMin?: number;
  // Minor (optional)
  minorCredits?: number;
  minorRequiredMin?: number;
  minorPrimaryMajorMin?: number;
  // Earned credits
  earnedTotalCredits: number;
  earnedPrimaryMajorCredits: number;
  earnedGeneralCredits: number;
  earnedPrimaryMajorRequiredCredits: number;
  earnedSecondaryMajorCredits?: number;
  earnedSecondaryMajorRequiredCredits?: number;
  earnedMinorCredits?: number;
  earnedMinorRequiredCredits?: number;
  // 기이수에 이미 반영된 마지막 학기 (해당 학기까지의 '이수' 과목은 중복 합산 제외)
  priorCutoffYear?: number | null;
  priorCutoffTerm?: 'spring' | 'fall' | null;
}

interface RequirementFormProps {
  initialData?: RequirementFormData;
  onSubmit: (data: RequirementFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  onLoadFromDeptReq?: (majorType?: MajorType) => Promise<Partial<RequirementFormData> | null>;
  userMajorType?: MajorType;
  requirementYear?: number;
  onYearChange?: (year: number) => void;
  /** 계획에 존재하는 학기 목록 (기이수 반영 기준 학기 선택지) */
  semesterOptions?: Array<{ year: number; term: 'spring' | 'fall'; label: string }>;
  /** 기준 학기 자동 제안: 계획에서 '이수' 과목이 있는 가장 마지막 학기 */
  suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null;
}

const fieldGridClass = 'grid grid-cols-2 gap-x-5 gap-y-5';

/** 폼 섹션: 위 1px Line2 구분선 + 제목 */
function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line-2 py-6">
      <div className="flex flex-col gap-0.5">
        <h3 className="m-0 text-[15px] leading-[22px] font-bold text-ink">{title}</h3>
        {description && <p className="m-0 text-[12px] leading-4 text-ink-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** 밑줄 숫자 입력 — 라벨은 Input이 htmlFor로 연결한다 */
function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min = '0',
  error,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  error?: string;
  helperText?: string;
}) {
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      error={error}
      helperText={helperText}
    />
  );
}

export function RequirementForm({ initialData, onSubmit, onCancel, isLoading, onLoadFromDeptReq, userMajorType, requirementYear, onYearChange, semesterOptions, suggestedCutoff }: RequirementFormProps) {
  const [majorType, setMajorType] = useState<'single' | 'double' | 'minor'>(initialData?.majorType || 'single');
  const [totalCredits, setTotalCredits] = useState(initialData?.totalCredits?.toString() || '');
  const [primaryMajorCredits, setPrimaryMajorCredits] = useState(initialData?.primaryMajorCredits?.toString() || '');
  const [primaryMajorRequiredMin, setPrimaryMajorRequiredMin] = useState(initialData?.primaryMajorRequiredMin?.toString() || '');
  const [generalCredits, setGeneralCredits] = useState(initialData?.generalCredits?.toString() || '');

  // Double major fields
  const [secondaryMajorCredits, setSecondaryMajorCredits] = useState(initialData?.secondaryMajorCredits?.toString() || '');
  const [secondaryMajorRequiredMin, setSecondaryMajorRequiredMin] = useState(initialData?.secondaryMajorRequiredMin?.toString() || '');

  // Minor fields
  const [minorCredits, setMinorCredits] = useState(initialData?.minorCredits?.toString() || '');
  const [minorRequiredMin, setMinorRequiredMin] = useState(initialData?.minorRequiredMin?.toString() || '');
  const [minorPrimaryMajorMin, setMinorPrimaryMajorMin] = useState(initialData?.minorPrimaryMajorMin?.toString() || '');

  // Earned credits
  const [earnedTotalCredits, setEarnedTotalCredits] = useState(initialData?.earnedTotalCredits?.toString() || '0');
  const [earnedPrimaryMajorCredits, setEarnedPrimaryMajorCredits] = useState(initialData?.earnedPrimaryMajorCredits?.toString() || '0');
  const [earnedGeneralCredits, setEarnedGeneralCredits] = useState(initialData?.earnedGeneralCredits?.toString() || '0');
  const [earnedPrimaryMajorRequiredCredits, setEarnedPrimaryMajorRequiredCredits] = useState(initialData?.earnedPrimaryMajorRequiredCredits?.toString() || '0');
  const [earnedSecondaryMajorCredits, setEarnedSecondaryMajorCredits] = useState(initialData?.earnedSecondaryMajorCredits?.toString() || '0');
  const [earnedSecondaryMajorRequiredCredits, setEarnedSecondaryMajorRequiredCredits] = useState(initialData?.earnedSecondaryMajorRequiredCredits?.toString() || '0');
  const [earnedMinorCredits, setEarnedMinorCredits] = useState(initialData?.earnedMinorCredits?.toString() || '0');
  const [earnedMinorRequiredCredits, setEarnedMinorRequiredCredits] = useState(initialData?.earnedMinorRequiredCredits?.toString() || '0');

  // 기이수 반영 기준 학기 ("YYYY-term" 형식, 빈 문자열 = 미사용)
  const [priorCutoff, setPriorCutoff] = useState(
    initialData?.priorCutoffYear && initialData?.priorCutoffTerm
      ? `${initialData.priorCutoffYear}-${initialData.priorCutoffTerm}`
      : ''
  );

  const cutoffSelectId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadMessage, setLoadMessage] = useState<string>('');

  // ── 기준 학기 자동 제안 ──
  // 기이수 학점 입력값이 초기값에서 변경되었는지 (성적표 갱신 시나리오 감지)
  const earnedEdited =
    earnedTotalCredits !== (initialData?.earnedTotalCredits?.toString() || '0') ||
    earnedGeneralCredits !== (initialData?.earnedGeneralCredits?.toString() || '0') ||
    earnedPrimaryMajorCredits !== (initialData?.earnedPrimaryMajorCredits?.toString() || '0') ||
    earnedPrimaryMajorRequiredCredits !== (initialData?.earnedPrimaryMajorRequiredCredits?.toString() || '0') ||
    earnedSecondaryMajorCredits !== (initialData?.earnedSecondaryMajorCredits?.toString() || '0') ||
    earnedSecondaryMajorRequiredCredits !== (initialData?.earnedSecondaryMajorRequiredCredits?.toString() || '0') ||
    earnedMinorCredits !== (initialData?.earnedMinorCredits?.toString() || '0') ||
    earnedMinorRequiredCredits !== (initialData?.earnedMinorRequiredCredits?.toString() || '0');

  // 기이수가 입력되어 있는지 (0뿐이면 중복 합산 위험 없음)
  const hasPriorCredits =
    (parseInt(earnedTotalCredits, 10) || 0) > 0 ||
    (parseInt(earnedGeneralCredits, 10) || 0) > 0 ||
    (parseInt(earnedPrimaryMajorCredits, 10) || 0) > 0;

  // 제안 학기가 현재 선택된 기준보다 뒤인가 (미설정이면 항상 뒤)
  const suggestionAhead = !!suggestedCutoff && (() => {
    if (!priorCutoff) return true;
    const [cy, ct] = priorCutoff.split('-');
    return !isSemesterCoveredByPrior(suggestedCutoff.year, suggestedCutoff.term, parseInt(cy, 10), ct);
  })();

  // 미설정 상태면 항상 안내(중복 합산 위험), 설정 상태면 기이수를 수정했을 때만 제안
  const showCutoffSuggestion =
    !!suggestedCutoff && suggestionAhead && hasPriorCredits && (priorCutoff === '' || earnedEdited);

  // Determine which major type radio options to show
  // When userMajorType is undefined (prop not passed), show all options (backward compat)
  const showDouble = !userMajorType || userMajorType === 'double' || initialData?.majorType === 'double';
  const showMinor = !userMajorType || userMajorType === 'minor' || initialData?.majorType === 'minor';
  const showMajorTypeSection = showDouble || showMinor;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const total = parseInt(totalCredits, 10);
    const major = parseInt(primaryMajorCredits, 10);
    const majorReq = parseInt(primaryMajorRequiredMin, 10);
    const general = parseInt(generalCredits, 10);
    const eTotal = parseInt(earnedTotalCredits, 10);
    const eMajor = parseInt(earnedPrimaryMajorCredits, 10);
    const eGeneral = parseInt(earnedGeneralCredits, 10);
    const eMajorReq = parseInt(earnedPrimaryMajorRequiredCredits, 10);

    if (isNaN(total) || total < 1) newErrors.totalCredits = '1 이상의 학점을 입력하세요';
    if (isNaN(major) || major < 0) newErrors.primaryMajorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(majorReq) || majorReq < 0) newErrors.primaryMajorRequiredMin = '0 이상의 학점을 입력하세요';
    if (isNaN(general) || general < 0) newErrors.generalCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eTotal) || eTotal < 0) newErrors.earnedTotalCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eMajor) || eMajor < 0) newErrors.earnedPrimaryMajorCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eGeneral) || eGeneral < 0) newErrors.earnedGeneralCredits = '0 이상의 학점을 입력하세요';
    if (isNaN(eMajorReq) || eMajorReq < 0) newErrors.earnedPrimaryMajorRequiredCredits = '0 이상의 학점을 입력하세요';

    // Double major validation
    if (majorType === 'double') {
      const secMajor = parseInt(secondaryMajorCredits, 10);
      const secMajorReq = parseInt(secondaryMajorRequiredMin, 10);
      const eSecMajor = parseInt(earnedSecondaryMajorCredits, 10);
      const eSecMajorReq = parseInt(earnedSecondaryMajorRequiredCredits, 10);

      if (isNaN(secMajor) || secMajor < 0) newErrors.secondaryMajorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(secMajorReq) || secMajorReq < 0) newErrors.secondaryMajorRequiredMin = '0 이상의 학점을 입력하세요';
      if (isNaN(eSecMajor) || eSecMajor < 0) newErrors.earnedSecondaryMajorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(eSecMajorReq) || eSecMajorReq < 0) newErrors.earnedSecondaryMajorRequiredCredits = '0 이상의 학점을 입력하세요';

      if (!newErrors.secondaryMajorRequiredMin && !newErrors.secondaryMajorCredits) {
        if (secMajorReq > secMajor) {
          newErrors.secondaryMajorRequiredMin = '복수전공핵심은 복수전공학점 이하여야 합니다';
        }
      }
    }

    // Minor validation
    if (majorType === 'minor') {
      const minor = parseInt(minorCredits, 10);
      const minorReq = parseInt(minorRequiredMin, 10);
      const minorPrimaryReq = parseInt(minorPrimaryMajorMin, 10);
      const eMinor = parseInt(earnedMinorCredits, 10);
      const eMinorReq = parseInt(earnedMinorRequiredCredits, 10);

      if (isNaN(minor) || minor < 0) newErrors.minorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(minorReq) || minorReq < 0) newErrors.minorRequiredMin = '0 이상의 학점을 입력하세요';
      if (isNaN(minorPrimaryReq) || minorPrimaryReq < 0) newErrors.minorPrimaryMajorMin = '0 이상의 학점을 입력하세요';
      if (isNaN(eMinor) || eMinor < 0) newErrors.earnedMinorCredits = '0 이상의 학점을 입력하세요';
      if (isNaN(eMinorReq) || eMinorReq < 0) newErrors.earnedMinorRequiredCredits = '0 이상의 학점을 입력하세요';

      if (!newErrors.minorRequiredMin && !newErrors.minorCredits) {
        if (minorReq > minor) {
          newErrors.minorRequiredMin = '부전공핵심은 부전공학점 이하여야 합니다';
        }
      }
    }

    // Cross-field validation
    if (!newErrors.primaryMajorRequiredMin && !newErrors.primaryMajorCredits) {
      if (majorReq > major) {
        newErrors.primaryMajorRequiredMin = '전공핵심은 전공학점 이하여야 합니다';
      }
    }

    if (!newErrors.totalCredits && !newErrors.primaryMajorCredits && !newErrors.generalCredits) {
      const secMajor = majorType === 'double' ? parseInt(secondaryMajorCredits, 10) || 0 : 0;
      const minor = majorType === 'minor' ? parseInt(minorCredits, 10) || 0 : 0;

      if (major + secMajor + minor + general > total) {
        newErrors.totalCredits = '전공 + 복수전공/부전공 + 교양 학점이 졸업학점을 초과합니다';
      }
    }

    // 기이수 필드 간 정합성 (총 >= 트랙 합계, 핵심 <= 전공)
    const priorErrors = validatePriorCredits({
      majorType,
      earnedTotalCredits: eTotal,
      earnedGeneralCredits: eGeneral,
      earnedPrimaryMajorCredits: eMajor,
      earnedPrimaryMajorRequiredCredits: eMajorReq,
      earnedSecondaryMajorCredits: parseInt(earnedSecondaryMajorCredits, 10) || 0,
      earnedSecondaryMajorRequiredCredits: parseInt(earnedSecondaryMajorRequiredCredits, 10) || 0,
      earnedMinorCredits: parseInt(earnedMinorCredits, 10) || 0,
      earnedMinorRequiredCredits: parseInt(earnedMinorRequiredCredits, 10) || 0,
    });
    for (const [field, message] of Object.entries(priorErrors)) {
      if (!newErrors[field]) newErrors[field] = message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoadFromDeptReq = async () => {
    if (!onLoadFromDeptReq) return;
    try {
      const data = await onLoadFromDeptReq(majorType);
      if (data) {
        if (data.majorType) setMajorType(data.majorType);
        if (data.totalCredits !== undefined) setTotalCredits(data.totalCredits.toString());
        if (data.primaryMajorCredits !== undefined) setPrimaryMajorCredits(data.primaryMajorCredits.toString());
        if (data.primaryMajorRequiredMin !== undefined) setPrimaryMajorRequiredMin(data.primaryMajorRequiredMin.toString());
        if (data.generalCredits !== undefined) setGeneralCredits(data.generalCredits.toString());
        if (data.secondaryMajorCredits !== undefined) setSecondaryMajorCredits(data.secondaryMajorCredits.toString());
        if (data.secondaryMajorRequiredMin !== undefined) setSecondaryMajorRequiredMin(data.secondaryMajorRequiredMin.toString());
        if (data.minorCredits !== undefined) setMinorCredits(data.minorCredits.toString());
        if (data.minorRequiredMin !== undefined) setMinorRequiredMin(data.minorRequiredMin.toString());
        if (data.minorPrimaryMajorMin !== undefined) setMinorPrimaryMajorMin(data.minorPrimaryMajorMin.toString());
        setLoadMessage('학과 기준표에서 불러왔습니다. 수정할 수 있습니다.');
      }
    } catch {
      // Silently fail - user can manually enter values
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      majorType,
      totalCredits: parseInt(totalCredits, 10),
      primaryMajorCredits: parseInt(primaryMajorCredits, 10),
      primaryMajorRequiredMin: parseInt(primaryMajorRequiredMin, 10),
      generalCredits: parseInt(generalCredits, 10),
      ...(majorType === 'double' ? {
        secondaryMajorCredits: parseInt(secondaryMajorCredits, 10),
        secondaryMajorRequiredMin: parseInt(secondaryMajorRequiredMin, 10),
      } : {}),
      ...(majorType === 'minor' ? {
        minorCredits: parseInt(minorCredits, 10),
        minorRequiredMin: parseInt(minorRequiredMin, 10),
        minorPrimaryMajorMin: parseInt(minorPrimaryMajorMin, 10),
      } : {}),
      earnedTotalCredits: parseInt(earnedTotalCredits, 10),
      earnedPrimaryMajorCredits: parseInt(earnedPrimaryMajorCredits, 10),
      earnedGeneralCredits: parseInt(earnedGeneralCredits, 10),
      earnedPrimaryMajorRequiredCredits: parseInt(earnedPrimaryMajorRequiredCredits, 10),
      ...(majorType === 'double' ? {
        earnedSecondaryMajorCredits: parseInt(earnedSecondaryMajorCredits, 10),
        earnedSecondaryMajorRequiredCredits: parseInt(earnedSecondaryMajorRequiredCredits, 10),
      } : {}),
      ...(majorType === 'minor' ? {
        earnedMinorCredits: parseInt(earnedMinorCredits, 10),
        earnedMinorRequiredCredits: parseInt(earnedMinorRequiredCredits, 10),
      } : {}),
      priorCutoffYear: priorCutoff ? parseInt(priorCutoff.split('-')[0], 10) : null,
      priorCutoffTerm: priorCutoff ? (priorCutoff.split('-')[1] as 'spring' | 'fall') : null,
    });
  };

  const radioOptions: Array<{ value: 'single' | 'double' | 'minor'; label: string; show: boolean }> = [
    { value: 'single', label: '단일전공', show: true },
    { value: 'double', label: '복수전공', show: showDouble },
    { value: 'minor', label: '부전공', show: showMinor },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {/* 안내 링크 */}
      <p className="m-0 flex flex-wrap items-center gap-x-1.5 pb-5 text-[13px] leading-[18px] text-ink-2">
        <HelpCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
        졸업 기준과 취득 학점을 잘 모르시나요?
        <Link href="/help/graduation-guide" className="font-semibold text-primary hover:text-primary-hover">
          확인 방법 보기
        </Link>
      </p>

      {/* 전공 유형 */}
      <FormSection title="전공 유형">
        {showMajorTypeSection ? (
          <fieldset className="m-0 flex flex-wrap gap-x-6 gap-y-2 border-0 p-0">
            <legend className="sr-only">전공 유형</legend>
            {radioOptions.filter((o) => o.show).map((o) => (
              <label key={o.value} className="inline-flex h-11 cursor-pointer items-center gap-2 text-[15px] font-medium text-ink">
                <input
                  type="radio"
                  name="majorType"
                  value={o.value}
                  checked={majorType === o.value}
                  onChange={(e) => setMajorType(e.target.value as 'single' | 'double' | 'minor')}
                  className="h-[18px] w-[18px] accent-primary"
                />
                {o.label}
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="m-0 text-[13px] leading-[18px] text-ink-2">
            단일전공으로 설정되어 있습니다.{' '}
            <Link href="/profile" className="font-semibold text-primary hover:text-primary-hover">
              복수전공/부전공은 프로필에서 변경하세요.
            </Link>
          </p>
        )}
        {onLoadFromDeptReq && (
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3">
              {requirementYear !== undefined && onYearChange && (
                <label className="relative inline-flex items-center text-ink">
                  <span className="sr-only">기준 연도</span>
                  <select
                    value={requirementYear}
                    onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                    className="h-11 cursor-pointer appearance-none border-0 bg-transparent p-0 pr-[18px] text-[14px] font-semibold text-ink outline-none [field-sizing:content] focus-visible:text-primary"
                  >
                    <option value={2025}>2025년</option>
                    <option value={2026}>2026년</option>
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-0 h-3.5 w-3.5" strokeWidth={2.5} />
                </label>
              )}
              <Button type="button" variant="textPrimary" size="sm" onClick={handleLoadFromDeptReq} className="-ml-2.5">
                학과 기준표에서 불러오기
              </Button>
            </div>
            {loadMessage && <p role="status" className="m-0 text-[12px] leading-4 text-positive">{loadMessage}</p>}
          </div>
        )}
      </FormSection>

      {/* 졸업 기준 */}
      <FormSection title="졸업 기준">
        <div className={fieldGridClass}>
          <NumberField label="졸업학점" value={totalCredits} onChange={setTotalCredits} placeholder="예: 130" min="1" error={errors.totalCredits} />
          <NumberField label="교양학점" value={generalCredits} onChange={setGeneralCredits} placeholder="예: 30" error={errors.generalCredits} />
          <NumberField label="전공학점" value={primaryMajorCredits} onChange={setPrimaryMajorCredits} placeholder="예: 60" error={errors.primaryMajorCredits} />
          <NumberField label="전공핵심 (최소)" value={primaryMajorRequiredMin} onChange={setPrimaryMajorRequiredMin} placeholder="예: 24" error={errors.primaryMajorRequiredMin} />
        </div>
      </FormSection>

      {/* 복수전공 */}
      {majorType === 'double' && (
        <FormSection title="복수전공">
          <div className={fieldGridClass}>
            <NumberField label="복수전공 학점" value={secondaryMajorCredits} onChange={setSecondaryMajorCredits} placeholder="예: 60" error={errors.secondaryMajorCredits} />
            <NumberField label="복수전공핵심 (최소)" value={secondaryMajorRequiredMin} onChange={setSecondaryMajorRequiredMin} placeholder="예: 24" error={errors.secondaryMajorRequiredMin} />
          </div>
        </FormSection>
      )}

      {/* 부전공 */}
      {majorType === 'minor' && (
        <FormSection title="부전공">
          <div className={fieldGridClass}>
            <NumberField label="부전공 학점" value={minorCredits} onChange={setMinorCredits} placeholder="예: 21" error={errors.minorCredits} />
            <NumberField label="부전공핵심 (최소)" value={minorRequiredMin} onChange={setMinorRequiredMin} placeholder="예: 9" error={errors.minorRequiredMin} />
            <NumberField label="주전공 최소 학점" value={minorPrimaryMajorMin} onChange={setMinorPrimaryMajorMin} placeholder="예: 63" error={errors.minorPrimaryMajorMin} />
          </div>
        </FormSection>
      )}

      {/* 기이수 학점 */}
      <FormSection title="기이수 학점" description="성적표 기준으로 이미 이수한 학점">
        {showCutoffSuggestion && suggestedCutoff && (
          <div role="status" className="flex flex-col items-start gap-1">
            <p className="m-0 text-[13px] leading-[18px] font-medium text-ink">
              {priorCutoff === ''
                ? <>계획에 &lsquo;이수&rsquo; 과목이 있습니다. 해당 학기가 기이수(성적표)에 이미 반영되어 있다면, 기준 학기를 설정해야 중복 합산되지 않습니다.</>
                : <>기이수 학점을 수정했습니다. 성적표에 새로 반영된 학기가 있다면 기준 학기도 함께 올려주세요.</>}
            </p>
            <Button
              type="button"
              variant="textPrimary"
              size="sm"
              onClick={() => setPriorCutoff(`${suggestedCutoff.year}-${suggestedCutoff.term}`)}
              className="-ml-2.5"
            >
              {suggestedCutoff.label}까지로 설정
            </Button>
          </div>
        )}
        {semesterOptions && semesterOptions.length > 0 && (
          <div className="group w-full">
            <label
              htmlFor={cutoffSelectId}
              className="mb-1.5 block text-[13px] leading-[18px] font-semibold text-ink-2 transition-colors duration-150 group-focus-within:text-primary"
            >
              기이수에 반영된 마지막 학기
            </label>
            <div className="relative">
              <select
                id={cutoffSelectId}
                value={priorCutoff}
                onChange={(e) => setPriorCutoff(e.target.value)}
                aria-describedby={`${cutoffSelectId}-desc`}
                className="h-10 w-full cursor-pointer appearance-none truncate rounded-none border-0 border-b border-line-3 bg-transparent px-0 pr-6 text-[15px] font-medium text-ink outline-none transition-colors duration-150 ease-out focus:border-primary focus:shadow-[inset_0_-1px_0_var(--color-primary)]"
              >
                <option value="">선택 안 함 — 계획의 이수 과목을 모두 합산</option>
                {semesterOptions.map((o) => (
                  <option key={`${o.year}-${o.term}`} value={`${o.year}-${o.term}`}>
                    {o.label}까지 기이수에 반영됨
                  </option>
                ))}
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-0 h-4 w-4 -translate-y-1/2 text-ink-2" />
            </div>
            <p id={`${cutoffSelectId}-desc`} className="mt-1.5 mb-0 text-[12px] leading-4 text-ink-2">
              선택한 학기까지 계획에 &lsquo;이수&rsquo;로 표시한 과목은 기이수 학점에 이미 포함된 것으로 보고 중복 합산하지 않습니다.
            </p>
          </div>
        )}
        <div className={fieldGridClass}>
          <NumberField
            label="졸업학점"
            value={earnedTotalCredits}
            onChange={setEarnedTotalCredits}
            placeholder="0"
            helperText="이미 이수한 총 학점 (전공+교양+기타 포함)"
            error={errors.earnedTotalCredits}
          />
          <NumberField label="교양" value={earnedGeneralCredits} onChange={setEarnedGeneralCredits} placeholder="0" error={errors.earnedGeneralCredits} />
          <NumberField label="전공" value={earnedPrimaryMajorCredits} onChange={setEarnedPrimaryMajorCredits} placeholder="0" error={errors.earnedPrimaryMajorCredits} />
          <NumberField label="전공핵심" value={earnedPrimaryMajorRequiredCredits} onChange={setEarnedPrimaryMajorRequiredCredits} placeholder="0" error={errors.earnedPrimaryMajorRequiredCredits} />
          {majorType === 'double' && (
            <>
              <NumberField label="복수전공" value={earnedSecondaryMajorCredits} onChange={setEarnedSecondaryMajorCredits} placeholder="0" error={errors.earnedSecondaryMajorCredits} />
              <NumberField label="복수전공핵심" value={earnedSecondaryMajorRequiredCredits} onChange={setEarnedSecondaryMajorRequiredCredits} placeholder="0" error={errors.earnedSecondaryMajorRequiredCredits} />
            </>
          )}
          {majorType === 'minor' && (
            <>
              <NumberField label="부전공" value={earnedMinorCredits} onChange={setEarnedMinorCredits} placeholder="0" error={errors.earnedMinorCredits} />
              <NumberField label="부전공핵심" value={earnedMinorRequiredCredits} onChange={setEarnedMinorRequiredCredits} placeholder="0" error={errors.earnedMinorRequiredCredits} />
            </>
          )}
        </div>
      </FormSection>

      <div className="flex items-center gap-2 border-t border-line-2 pt-6">
        <Button type="submit" size="lg" isLoading={isLoading}>
          {initialData ? '수정' : '저장'}
        </Button>
        <Button type="button" variant="text" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
