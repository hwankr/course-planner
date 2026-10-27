'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, SearchableSelect, SectionHeader } from '@/components/ui';
import { useDepartments, useCompleteOnboarding } from '@/hooks/useOnboarding';
import { Check, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import type { MajorType } from '@/types';
import { DEFAULT_REQUIREMENT_YEAR } from '@/lib/constants';
import { validatePriorCredits } from '@/lib/priorCredits';

const EMPTY_DEPARTMENTS: { _id: string; code: string; name: string; college?: string }[] = [];

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { data: departments = EMPTY_DEPARTMENTS, isLoading: isDeptLoading } = useDepartments();
  const completeMutation = useCompleteOnboarding();

  const departmentOptions = useMemo(() =>
    departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
      group: dept.college || '',
    })),
    [departments]
  );

  const isGuest = useGuestStore((s) => s.isGuest);
  const setGuestProfile = useGuestProfileStore((s) => s.setProfile);
  const setGuestGraduation = useGuestGraduationStore((s) => s.setRequirement);

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  // Step 1 data
  const [departmentId, setDepartmentId] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');
  const [majorType, setMajorType] = useState<MajorType>('single');
  const [secondaryDepartmentId, setSecondaryDepartmentId] = useState('');
  const [availableMajorTypes, setAvailableMajorTypes] = useState<MajorType[]>(['single', 'double', 'minor']);
  const [autoFillMessage, setAutoFillMessage] = useState('');

  // Requirement year
  const [requirementYear, setRequirementYear] = useState(DEFAULT_REQUIREMENT_YEAR);

  // Step 2 data - graduation requirements (primary / common)
  const [totalCredits, setTotalCredits] = useState(120);
  const [generalCredits, setGeneralCredits] = useState(30);
  const [primaryMajorCredits, setPrimaryMajorCredits] = useState(63);
  const [primaryMajorRequiredMin, setPrimaryMajorRequiredMin] = useState(24);
  const [earnedTotalCredits, setEarnedTotalCredits] = useState(0);
  const [earnedGeneralCredits, setEarnedGeneralCredits] = useState(0);
  const [earnedPrimaryMajorCredits, setEarnedPrimaryMajorCredits] = useState(0);
  const [earnedPrimaryMajorRequiredCredits, setEarnedPrimaryMajorRequiredCredits] = useState(0);

  // Step 2 data - double major
  const [secondaryMajorCredits, setSecondaryMajorCredits] = useState(36);
  const [secondaryMajorRequiredMin, setSecondaryMajorRequiredMin] = useState(12);
  const [earnedSecondaryMajorCredits, setEarnedSecondaryMajorCredits] = useState(0);
  const [earnedSecondaryMajorRequiredCredits, setEarnedSecondaryMajorRequiredCredits] = useState(0);

  // Step 2 data - minor
  const [minorCredits, setMinorCredits] = useState(21);
  const [minorRequiredMin, setMinorRequiredMin] = useState(9);
  const [minorPrimaryMajorMin, setMinorPrimaryMajorMin] = useState(0);
  const [earnedMinorCredits, setEarnedMinorCredits] = useState(0);
  const [earnedMinorRequiredCredits, setEarnedMinorRequiredCredits] = useState(0);

  // Fetch available major types when department selected
  useEffect(() => {
    if (!departmentId) {
      setAvailableMajorTypes(['single', 'double', 'minor']);
      return;
    }
    const selectedDept = departments.find((d) => d._id === departmentId);
    if (!selectedDept?.college || !selectedDept?.name) return;

    const fetchAvailable = async () => {
      try {
        const res = await fetch(`/api/department-requirements?college=${encodeURIComponent(selectedDept.college!)}&departmentName=${encodeURIComponent(selectedDept.name)}&year=${requirementYear}`);
        if (!res.ok) {
          setAvailableMajorTypes(['single', 'double', 'minor']);
          return;
        }
        const { data } = await res.json();
        if (data?.availableMajorTypes) {
          setAvailableMajorTypes(data.availableMajorTypes);
          // If currently selected majorType is not available, reset to 'single'
          if (!data.availableMajorTypes.includes(majorType)) {
            setMajorType('single');
          }
        }
      } catch {
        setAvailableMajorTypes(['single', 'double', 'minor']);
      }
    };
    fetchAvailable();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, departments, requirementYear]);

  // Auto-fill from department requirements when entering Step 2
  const autoFillFromDeptReq = async (yearOverride?: number) => {
    const selectedDept = departments.find((d) => d._id === departmentId);
    if (!selectedDept?.college || !selectedDept?.name) return;
    const year = yearOverride ?? requirementYear;

    setAutoFillMessage('');

    try {
      // Fetch the selected primary track independently from the secondary department.
      const primaryRes = await fetch(`/api/department-requirements?college=${encodeURIComponent(selectedDept.college!)}&departmentName=${encodeURIComponent(selectedDept.name)}&majorType=${majorType}&track=primary&year=${year}`);
      if (!primaryRes.ok) throw new Error('학과 기준표를 불러오지 못했습니다.');
      if (primaryRes.ok) {
        const { data: primaryData } = await primaryRes.json();
        if (!primaryData) throw new Error('학과 기준표가 없습니다.');
        if (primaryData.totalCredits != null) setTotalCredits(primaryData.totalCredits);
        if (primaryData.generalCredits !== undefined && primaryData.generalCredits !== null) setGeneralCredits(primaryData.generalCredits);
        if (primaryData.primaryMajorCredits != null) {
          setPrimaryMajorCredits(primaryData.primaryMajorCredits);
          if (majorType === 'minor') setMinorPrimaryMajorMin(primaryData.primaryMajorCredits);
        }
        if (primaryData.primaryMajorRequiredMin !== undefined && primaryData.primaryMajorRequiredMin !== null) setPrimaryMajorRequiredMin(primaryData.primaryMajorRequiredMin);
      }

      // For double/minor: also fetch secondary department requirements
      if (majorType !== 'single' && secondaryDepartmentId) {
        const secondaryDept = departments.find((d) => d._id === secondaryDepartmentId);
        if (secondaryDept?.college && secondaryDept?.name) {
          const secondaryRes = await fetch(`/api/department-requirements?college=${encodeURIComponent(secondaryDept.college!)}&departmentName=${encodeURIComponent(secondaryDept.name)}&majorType=${majorType}&year=${year}`);
          if (secondaryRes.ok) {
            const { data: secData } = await secondaryRes.json();
            if (!secData) throw new Error('학과 기준표가 없습니다.');
            if (majorType === 'double') {
              if (secData.secondaryMajorCredits != null) setSecondaryMajorCredits(secData.secondaryMajorCredits);
              if (secData.secondaryMajorRequiredMin !== undefined) setSecondaryMajorRequiredMin(secData.secondaryMajorRequiredMin);
            } else if (majorType === 'minor') {
              if (secData.minorCredits != null) setMinorCredits(secData.minorCredits);
              if (secData.minorRequiredMin !== undefined) setMinorRequiredMin(secData.minorRequiredMin);
            }
          }
        }
      }

      setAutoFillMessage('학과 기준표에서 불러왔습니다. 수정할 수 있습니다.');
    } catch {
      // Silently fail - user can manually input
    }
  };

  const handleNext = () => {
    setError('');
    if (!departmentId) {
      setError('학과를 선택해주세요.');
      return;
    }
    if (!enrollmentYear || parseInt(enrollmentYear) < 2000 || parseInt(enrollmentYear) > new Date().getFullYear() + 1) {
      setError('올바른 입학연도를 입력해주세요.');
      return;
    }
    if (majorType !== 'single' && !secondaryDepartmentId) {
      setError('복수전공/부전공 학과를 선택해주세요.');
      return;
    }
    if (secondaryDepartmentId === departmentId) {
      setError('주전공과 다른 학과를 선택해주세요.');
      return;
    }
    setStep(2);
    // Auto-fill when entering step 2
    autoFillFromDeptReq();
  };

  const handleComplete = async () => {
    setError('');
    const errors: Record<string, string> = {};
    const inputs = formRef.current?.querySelectorAll<HTMLInputElement>('input[type="number"]') ?? [];
    for (const input of inputs) {
      const label = input.labels?.[0]?.textContent || '학점';
      const min = Number(input.min || 0);
      if (!input.value || !Number.isFinite(input.valueAsNumber)) errors[input.id] = `${label}을 입력해주세요.`;
      else if (!Number.isInteger(input.valueAsNumber)) errors[input.id] = `${label}은 정수로 입력해주세요.`;
      else if (input.valueAsNumber < min) errors[input.id] = `${label}은 ${min} 이상이어야 합니다.`;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setError('입력한 학점을 확인해주세요.');
      document.getElementById(Object.keys(errors)[0])?.focus();
      return;
    }

    // 기이수 필드 간 정합성 (총 >= 트랙 합계, 핵심 <= 전공)
    const priorErrors = validatePriorCredits({
      majorType,
      earnedTotalCredits,
      earnedGeneralCredits,
      earnedPrimaryMajorCredits,
      earnedPrimaryMajorRequiredCredits,
      earnedSecondaryMajorCredits,
      earnedSecondaryMajorRequiredCredits,
      earnedMinorCredits,
      earnedMinorRequiredCredits,
    });
    const firstPriorError = Object.values(priorErrors)[0];
    if (firstPriorError) {
      setError(firstPriorError);
      return;
    }

    if (isGuest) {
      // Guest: save to local stores
      const selectedDept = departments.find((d) => d._id === departmentId);
      const secondaryDept = departments.find((d) => d._id === secondaryDepartmentId);
      setGuestProfile({
        departmentId,
        departmentName: selectedDept?.name || '',
        departmentCollege: selectedDept?.college || undefined,
        majorType,
        secondaryDepartmentId: secondaryDepartmentId || undefined,
        secondaryDepartmentName: secondaryDept?.name,
        secondaryDepartmentCollege: secondaryDept?.college || undefined,
        enrollmentYear: parseInt(enrollmentYear),
      });
      setGuestGraduation({
        majorType,
        totalCredits,
        primaryMajorCredits,
        primaryMajorRequiredMin,
        generalCredits,
        ...(majorType === 'double' ? { secondaryMajorCredits, secondaryMajorRequiredMin } : {}),
        ...(majorType === 'minor' ? { minorCredits, minorRequiredMin, minorPrimaryMajorMin } : {}),
        earnedTotalCredits,
        earnedGeneralCredits,
        earnedPrimaryMajorCredits,
        earnedPrimaryMajorRequiredCredits,
        ...(majorType === 'double' ? { earnedSecondaryMajorCredits, earnedSecondaryMajorRequiredCredits } : {}),
        ...(majorType === 'minor' ? { earnedMinorCredits, earnedMinorRequiredCredits } : {}),
        requirementYear,
      });
      router.push('/planner');
      return;
    }

    try {
      await completeMutation.mutateAsync({
        departmentId,
        majorType,
        secondaryDepartmentId: secondaryDepartmentId || undefined,
        enrollmentYear: parseInt(enrollmentYear),
        graduationRequirements: {
          majorType,
          totalCredits,
          primaryMajorCredits,
          primaryMajorRequiredMin,
          generalCredits,
          ...(majorType === 'double' ? { secondaryMajorCredits, secondaryMajorRequiredMin } : {}),
          ...(majorType === 'minor' ? { minorCredits, minorRequiredMin, minorPrimaryMajorMin } : {}),
          earnedTotalCredits,
          earnedGeneralCredits,
          earnedPrimaryMajorCredits,
          earnedPrimaryMajorRequiredCredits,
          ...(majorType === 'double' ? { earnedSecondaryMajorCredits, earnedSecondaryMajorRequiredCredits } : {}),
          ...(majorType === 'minor' ? { earnedMinorCredits, earnedMinorRequiredCredits } : {}),
          requirementYear,
        },
      });

      // Refresh JWT to get onboardingCompleted=true
      await updateSession();
      router.push('/planner');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  return (
    <div ref={formRef} className="min-h-[60vh] py-6 md:py-10">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <header>
          <h1 className="text-[26px] leading-[34px] font-bold tracking-[-0.02em] text-ink">초기 설정</h1>
          <p className="mt-2 text-[15px] leading-5 text-ink-2">수강 계획을 시작하기 위한 기본 정보를 입력해주세요.</p>
          <p className="mt-1 text-[13px] leading-[18px] text-ink-2">몇 가지 정보만 입력하면 바로 시작할 수 있어요.</p>
        </header>

        <ol aria-label="초기 설정 진행 단계" className="grid grid-cols-2 text-[14px] leading-5 font-semibold">
          <li
            aria-current={step === 1 ? 'step' : undefined}
            className={`border-b pb-3 ${step === 1 ? 'border-primary text-primary' : 'border-line-2 text-ink'}`}
          >
            <span aria-hidden="true">1. </span>학과 선택
            {step > 1 && <span className="sr-only"> 완료</span>}
          </li>
          <li
            aria-current={step === 2 ? 'step' : undefined}
            className={`border-b pb-3 ${step === 2 ? 'border-primary text-primary' : 'border-line-2 text-ink-2'}`}
          >
            <span aria-hidden="true">2. </span>졸업 요건
          </li>
        </ol>

        {step === 1 ? (
          <section aria-labelledby="onboarding-profile-title" className="border-b border-line-2 pb-6">
            <SectionHeader id="onboarding-profile-title" title="학과 및 입학 정보" className="mb-6" />
            <div className="space-y-6">
              <div>
                <label htmlFor="onboarding-department" className="block text-sm font-medium text-ink-2 mb-1">학과</label>
                <SearchableSelect
                  id="onboarding-department"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  placeholder={isDeptLoading ? '불러오는 중...' : '학과를 검색하세요'}
                  disabled={isDeptLoading}
                />
              </div>
              <div>
                <Input
                  label="입학연도"
                  type="number"
                  value={enrollmentYear}
                  onChange={(e) => setEnrollmentYear(e.target.value)}
                  placeholder="예: 2024"
                  helperText="입학한 연도를 입력하세요."
                  min={2000}
                  max={new Date().getFullYear() + 1}
                />
              </div>

              {/* 복수전공/부전공 추가 */}
              {departmentId && (
                <div>
                  <p id="onboarding-major-type-label" className="mb-2 text-[13px] leading-[18px] font-semibold text-ink-2">복수전공 / 부전공</p>
                  <div role="group" aria-labelledby="onboarding-major-type-label" className="flex gap-2">
                    {/* 복수전공 추가 토글 */}
                    {availableMajorTypes.includes('double') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (majorType === 'double') {
                            setMajorType('single');
                            setSecondaryDepartmentId('');
                          } else {
                            setMajorType('double');
                            setSecondaryDepartmentId('');
                          }
                        }}
                        aria-pressed={majorType === 'double'}
                        className={`min-h-11 flex-1 border-b px-2 py-2 text-[14px] font-semibold transition-colors duration-150 ${
                          majorType === 'double' ? 'border-primary text-primary' : 'border-line-2 text-ink-2 hover:text-ink'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {majorType === 'double' ? (
                            <>
                              <Check aria-hidden="true" className="w-4 h-4" />
                              복수전공
                            </>
                          ) : (
                            '+ 복수전공 추가'
                          )}
                        </span>
                      </button>
                    )}
                    {/* 부전공 추가 토글 */}
                    {availableMajorTypes.includes('minor') && (
                      <button
                        type="button"
                        onClick={() => {
                          if (majorType === 'minor') {
                            setMajorType('single');
                            setSecondaryDepartmentId('');
                          } else {
                            setMajorType('minor');
                            setSecondaryDepartmentId('');
                          }
                        }}
                        disabled={majorType === 'double'}
                        aria-pressed={majorType === 'minor'}
                        className={`min-h-11 flex-1 border-b px-2 py-2 text-[14px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                          majorType === 'minor' ? 'border-primary text-primary' : 'border-line-2 text-ink-2 hover:text-ink'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {majorType === 'minor' ? (
                            <>
                              <Check aria-hidden="true" className="w-4 h-4" />
                              부전공
                            </>
                          ) : (
                            '+ 부전공 추가'
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                  {majorType !== 'single' && (
                    <p className="text-xs text-ink-2 mt-1.5">
                      {majorType === 'double' ? '복수전공' : '부전공'}을 선택했습니다. 해제하려면 다시 클릭하세요.
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Department (shown for double/minor) */}
              {majorType !== 'single' && (
                <div>
                  <label htmlFor="onboarding-secondary-department" className="block text-sm font-medium text-ink-2 mb-1">
                    {majorType === 'double' ? '복수전공 학과' : '부전공 학과'}
                  </label>
                  <SearchableSelect
                    id="onboarding-secondary-department"
                    options={departmentOptions.filter((d) => d.value !== departmentId)}
                    value={secondaryDepartmentId}
                    onChange={(val) => setSecondaryDepartmentId(val)}
                    placeholder="학과를 검색하세요"
                  />
                </div>
              )}

              {error && <p role="alert" className="text-[13px] leading-[18px] text-negative">{error}</p>}

              <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="inline-flex items-center">
                  다음
                  <ArrowRight aria-hidden="true" className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section aria-labelledby="onboarding-requirements-title" className="border-b border-line-2 pb-6">
            <div className="mb-6 space-y-4">
              <SectionHeader id="onboarding-requirements-title" title="졸업 요건 설정" />
              <div className="flex items-center gap-3">
                <label htmlFor="onboarding-requirement-year" className="text-[13px] leading-[18px] font-semibold text-ink-2">기준 연도</label>
                <select
                  id="onboarding-requirement-year"
                  value={requirementYear}
                  onChange={(e) => {
                    const newYear = parseInt(e.target.value);
                    setRequirementYear(newYear);
                    autoFillFromDeptReq(newYear);
                  }}
                  className="h-10 border-0 border-b border-line-3 bg-transparent pr-6 text-[15px] font-medium text-ink focus:border-primary"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
              <p className="text-[13px] leading-[18px] text-ink-2">
                졸업 기준과 취득 학점을 잘 모르시나요?{' '}
                <Link href="/help/graduation-guide" className="text-primary hover:text-primary-hover underline underline-offset-4">
                  확인 방법 보기
                </Link>
              </p>
            </div>
            <div className="space-y-6">
              {majorType !== 'single' && (
                <div className="border-y border-line-2 py-4 text-ink-2">
                  <p className="text-[14px] leading-5 font-semibold">
                    {majorType === 'double' ? '복수전공' : '부전공'}을 선택하셨습니다
                  </p>
                  <p className="mt-1 text-[13px] leading-[18px]">
                    이수 기준이 변경되므로 졸업 요건을 직접 확인하고 설정해주세요.
                    아래 값은 학과 기준표에서 자동으로 불러온 것이며, 실제와 다를 수 있습니다.
                  </p>
                </div>
              )}

              {/* Side-by-side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Graduation Requirements */}
                <div className="space-y-4">
                  <SectionHeader title="졸업 기준" className="border-b border-line-2 pb-3" />
                  <div>
                    <Input
                      label="졸업학점"
                      type="number"
                      id="onboarding-totalCredits"
                      error={fieldErrors['onboarding-totalCredits']}
                      required
                      step={1}
                      value={Number.isNaN(totalCredits) ? '' : totalCredits}
                      onChange={(e) => { setTotalCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-totalCredits']: '' })); }}
                      min={1}
                    />
                  </div>
                  <div>
                    <Input
                      label="교양학점"
                      type="number"
                      id="onboarding-generalCredits"
                      error={fieldErrors['onboarding-generalCredits']}
                      required
                      step={1}
                      value={Number.isNaN(generalCredits) ? '' : generalCredits}
                      onChange={(e) => { setGeneralCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-generalCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      label="전공학점"
                      type="number"
                      id="onboarding-primaryMajorCredits"
                      error={fieldErrors['onboarding-primaryMajorCredits']}
                      required
                      step={1}
                      value={Number.isNaN(primaryMajorCredits) ? '' : primaryMajorCredits}
                      onChange={(e) => { setPrimaryMajorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-primaryMajorCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      label="전공핵심 (최소)"
                      type="number"
                      helperText="전공핵심 최소 이수학점"
                      id="onboarding-primaryMajorRequiredMin"
                      error={fieldErrors['onboarding-primaryMajorRequiredMin']}
                      required
                      step={1}
                      value={Number.isNaN(primaryMajorRequiredMin) ? '' : primaryMajorRequiredMin}
                      onChange={(e) => { setPrimaryMajorRequiredMin(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-primaryMajorRequiredMin']: '' })); }}
                      min={0}
                    />
                  </div>
                </div>

                {/* Right: Earned Credits */}
                <div className="space-y-4">
                  <SectionHeader title="취득 학점" className="border-b border-line-2 pb-3" />
                  <div>
                    <Input
                      label="기이수 졸업학점"
                      type="number"
                      helperText="이미 이수한 총 학점 (전공+교양+기타 포함)"
                      id="onboarding-earnedTotalCredits"
                      error={fieldErrors['onboarding-earnedTotalCredits']}
                      required
                      step={1}
                      value={Number.isNaN(earnedTotalCredits) ? '' : earnedTotalCredits}
                      onChange={(e) => { setEarnedTotalCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedTotalCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      label="기이수 교양학점"
                      type="number"
                      id="onboarding-earnedGeneralCredits"
                      error={fieldErrors['onboarding-earnedGeneralCredits']}
                      required
                      step={1}
                      value={Number.isNaN(earnedGeneralCredits) ? '' : earnedGeneralCredits}
                      onChange={(e) => { setEarnedGeneralCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedGeneralCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      label="기이수 전공학점"
                      type="number"
                      id="onboarding-earnedPrimaryMajorCredits"
                      error={fieldErrors['onboarding-earnedPrimaryMajorCredits']}
                      required
                      step={1}
                      value={Number.isNaN(earnedPrimaryMajorCredits) ? '' : earnedPrimaryMajorCredits}
                      onChange={(e) => { setEarnedPrimaryMajorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedPrimaryMajorCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                  <div>
                    <Input
                      label="기이수 전공핵심학점"
                      type="number"
                      id="onboarding-earnedPrimaryMajorRequiredCredits"
                      error={fieldErrors['onboarding-earnedPrimaryMajorRequiredCredits']}
                      required
                      step={1}
                      value={Number.isNaN(earnedPrimaryMajorRequiredCredits) ? '' : earnedPrimaryMajorRequiredCredits}
                      onChange={(e) => { setEarnedPrimaryMajorRequiredCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedPrimaryMajorRequiredCredits']: '' })); }}
                      min={0}
                    />
                  </div>
                </div>

                {/* Conditional: Double Major Requirements */}
                {majorType === 'double' && (
                  <>
                    <div className="space-y-4">
                      <SectionHeader title="복수전공 기준" className="border-b border-line-2 pb-3" />
                      <div>
                        <Input label="복수전공 전공학점" type="number" id="onboarding-secondaryMajorCredits" error={fieldErrors['onboarding-secondaryMajorCredits']} required step={1} value={Number.isNaN(secondaryMajorCredits) ? '' : secondaryMajorCredits} onChange={(e) => { setSecondaryMajorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-secondaryMajorCredits']: '' })); }} min={0} />
                      </div>
                      <div>
                        <Input label="복수전공 전공핵심 (최소)" type="number" id="onboarding-secondaryMajorRequiredMin" error={fieldErrors['onboarding-secondaryMajorRequiredMin']} required step={1} value={Number.isNaN(secondaryMajorRequiredMin) ? '' : secondaryMajorRequiredMin} onChange={(e) => { setSecondaryMajorRequiredMin(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-secondaryMajorRequiredMin']: '' })); }} min={0} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <SectionHeader title="복수전공 기이수" className="border-b border-line-2 pb-3" />
                      <div>
                        <Input label="기이수 복수전공 전공학점" type="number" id="onboarding-earnedSecondaryMajorCredits" error={fieldErrors['onboarding-earnedSecondaryMajorCredits']} required step={1} value={Number.isNaN(earnedSecondaryMajorCredits) ? '' : earnedSecondaryMajorCredits} onChange={(e) => { setEarnedSecondaryMajorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedSecondaryMajorCredits']: '' })); }} min={0} />
                      </div>
                      <div>
                        <Input label="기이수 복수전공 전공핵심" type="number" id="onboarding-earnedSecondaryMajorRequiredCredits" error={fieldErrors['onboarding-earnedSecondaryMajorRequiredCredits']} required step={1} value={Number.isNaN(earnedSecondaryMajorRequiredCredits) ? '' : earnedSecondaryMajorRequiredCredits} onChange={(e) => { setEarnedSecondaryMajorRequiredCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedSecondaryMajorRequiredCredits']: '' })); }} min={0} />
                      </div>
                    </div>
                  </>
                )}

                {/* Conditional: Minor Requirements */}
                {majorType === 'minor' && (
                  <>
                    <div className="space-y-4">
                      <SectionHeader title="부전공 기준" className="border-b border-line-2 pb-3" />
                      <div>
                        <Input label="부전공 전공학점" type="number" id="onboarding-minorCredits" error={fieldErrors['onboarding-minorCredits']} required step={1} value={Number.isNaN(minorCredits) ? '' : minorCredits} onChange={(e) => { setMinorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-minorCredits']: '' })); }} min={0} />
                      </div>
                      <div>
                        <Input label="부전공 전공핵심 (최소)" type="number" id="onboarding-minorRequiredMin" error={fieldErrors['onboarding-minorRequiredMin']} required step={1} value={Number.isNaN(minorRequiredMin) ? '' : minorRequiredMin} onChange={(e) => { setMinorRequiredMin(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-minorRequiredMin']: '' })); }} min={0} />
                      </div>
                      <div>
                        <Input label="부전공시 주전공 최소학점" type="number" id="onboarding-minorPrimaryMajorMin" error={fieldErrors['onboarding-minorPrimaryMajorMin']} required step={1} value={Number.isNaN(minorPrimaryMajorMin) ? '' : minorPrimaryMajorMin} onChange={(e) => { setMinorPrimaryMajorMin(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-minorPrimaryMajorMin']: '' })); }} min={0} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <SectionHeader title="부전공 기이수" className="border-b border-line-2 pb-3" />
                      <div>
                        <Input label="기이수 부전공 전공학점" type="number" id="onboarding-earnedMinorCredits" error={fieldErrors['onboarding-earnedMinorCredits']} required step={1} value={Number.isNaN(earnedMinorCredits) ? '' : earnedMinorCredits} onChange={(e) => { setEarnedMinorCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedMinorCredits']: '' })); }} min={0} />
                      </div>
                      <div>
                        <Input label="기이수 부전공 전공핵심" type="number" id="onboarding-earnedMinorRequiredCredits" error={fieldErrors['onboarding-earnedMinorRequiredCredits']} required step={1} value={Number.isNaN(earnedMinorRequiredCredits) ? '' : earnedMinorRequiredCredits} onChange={(e) => { setEarnedMinorRequiredCredits(e.target.valueAsNumber); setFieldErrors((prev) => ({ ...prev, ['onboarding-earnedMinorRequiredCredits']: '' })); }} min={0} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {autoFillMessage && (
                <p className="text-[13px] leading-[18px] text-ink-2">{autoFillMessage}</p>
              )}

              {error && <p role="alert" className="text-[13px] leading-[18px] text-negative">{error}</p>}

              <div className="flex justify-between pt-2">
                <Button variant="text" onClick={() => { setStep(1); setError(''); setAutoFillMessage(''); }} className="inline-flex items-center">
                  <ArrowLeft aria-hidden="true" className="w-4 h-4 mr-1" />
                  이전
                </Button>
                <Button onClick={handleComplete} disabled={!isGuest && completeMutation.isPending} className="inline-flex items-center">
                  {!isGuest && completeMutation.isPending ? '처리 중...' : '완료'}
                  {(isGuest || !completeMutation.isPending) && <CheckCircle aria-hidden="true" className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
