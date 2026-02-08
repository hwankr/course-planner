'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, SearchableSelect } from '@/components/ui';
import { useDepartments, useCompleteOnboarding } from '@/hooks/useOnboarding';
import {
  Check,
  School,
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import type { MajorType } from '@/types';

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

  // Step 1 data
  const [departmentId, setDepartmentId] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');
  const [majorType, setMajorType] = useState<MajorType>('single');
  const [secondaryDepartmentId, setSecondaryDepartmentId] = useState('');
  const [availableMajorTypes, setAvailableMajorTypes] = useState<MajorType[]>(['single', 'double', 'minor']);
  const [autoFillMessage, setAutoFillMessage] = useState('');

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
        const res = await fetch(`/api/department-requirements?college=${encodeURIComponent(selectedDept.college!)}&departmentName=${encodeURIComponent(selectedDept.name)}`);
        if (!res.ok) {
          setAvailableMajorTypes(['single', 'double', 'minor']);
          return;
        }
        const data = await res.json();
        if (data.availableMajorTypes) {
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
  }, [departmentId, departments]);

  // Auto-fill from department requirements when entering Step 2
  const autoFillFromDeptReq = async () => {
    const selectedDept = departments.find((d) => d._id === departmentId);
    if (!selectedDept?.college || !selectedDept?.name) return;

    setAutoFillMessage('');

    try {
      // Fetch primary (single track) requirements
      const primaryRes = await fetch(`/api/department-requirements?college=${encodeURIComponent(selectedDept.college!)}&departmentName=${encodeURIComponent(selectedDept.name)}&majorType=single`);
      if (primaryRes.ok) {
        const primaryData = await primaryRes.json();
        if (primaryData.totalCredits) setTotalCredits(primaryData.totalCredits);
        if (primaryData.generalCredits !== undefined && primaryData.generalCredits !== null) setGeneralCredits(primaryData.generalCredits);
        if (primaryData.primaryMajorCredits) setPrimaryMajorCredits(primaryData.primaryMajorCredits);
        if (primaryData.primaryMajorRequiredMin !== undefined && primaryData.primaryMajorRequiredMin !== null) setPrimaryMajorRequiredMin(primaryData.primaryMajorRequiredMin);
      }

      // For double/minor: also fetch secondary department requirements
      if (majorType !== 'single' && secondaryDepartmentId) {
        const secondaryDept = departments.find((d) => d._id === secondaryDepartmentId);
        if (secondaryDept?.college && secondaryDept?.name) {
          const secondaryRes = await fetch(`/api/department-requirements?college=${encodeURIComponent(secondaryDept.college!)}&departmentName=${encodeURIComponent(secondaryDept.name)}&majorType=${majorType}`);
          if (secondaryRes.ok) {
            const secData = await secondaryRes.json();
            if (majorType === 'double') {
              if (secData.secondaryMajorCredits) setSecondaryMajorCredits(secData.secondaryMajorCredits);
              if (secData.secondaryMajorRequiredMin !== undefined) setSecondaryMajorRequiredMin(secData.secondaryMajorRequiredMin);
            } else if (majorType === 'minor') {
              if (secData.minorCredits) setMinorCredits(secData.minorCredits);
              if (secData.minorRequiredMin !== undefined) setMinorRequiredMin(secData.minorRequiredMin);
              if (secData.minorPrimaryMajorMin !== undefined) setMinorPrimaryMajorMin(secData.minorPrimaryMajorMin);
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
    if (totalCredits < 1) {
      setError('졸업학점은 1 이상이어야 합니다.');
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
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center animate-fade-in-down">
          <h1 className="text-3xl font-bold text-gradient">초기 설정</h1>
          <p className="text-gray-600 mt-2">수강 계획을 시작하기 위한 기본 정보를 입력해주세요.</p>
          <p className="text-sm text-gray-400 mt-1">몇 가지 정보만 입력하면 바로 시작할 수 있어요</p>
        </div>

        {/* Premium Progress Stepper */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-0 w-full max-w-xs mx-auto">
            {/* Step 1 Circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              step === 1
                ? 'bg-gradient-to-br from-[#153974] to-[#3069B3] text-white shadow-lg shadow-[#153974]/30'
                : 'bg-emerald-500 text-white'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>

            {/* Connecting Line */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                step > 1 ? 'w-full bg-gradient-to-r from-[#153974] to-[#3069B3]' : 'w-0'
              }`} />
            </div>

            {/* Step 2 Circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              step === 2
                ? 'bg-gradient-to-br from-[#153974] to-[#3069B3] text-white shadow-lg shadow-[#153974]/30'
                : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between w-full max-w-xs mx-auto mt-2 px-0">
            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 1 ? 'text-[#153974]' : 'text-gray-400'}`}>학과 선택</span>
            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 2 ? 'text-[#153974]' : 'text-gray-400'}`}>졸업 요건</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 ? (
          <Card className="border-t-4 border-[#3069B3] animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-[#153974]" />
                <CardTitle>학과 및 입학 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                <SearchableSelect
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  placeholder={isDeptLoading ? '불러오는 중...' : '학과를 검색하세요'}
                  disabled={isDeptLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">입학연도</label>
                <Input
                  type="number"
                  value={enrollmentYear}
                  onChange={(e) => setEnrollmentYear(e.target.value)}
                  placeholder="예: 2024"
                  min={2000}
                  max={new Date().getFullYear() + 1}
                />
                <p className="text-xs text-gray-500 mt-1">입학한 연도를 입력하세요.</p>
              </div>

              {/* 복수전공/부전공 추가 */}
              {departmentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">복수전공 / 부전공</label>
                  <div className="flex gap-2">
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
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                          majorType === 'double'
                            ? 'bg-purple-500 text-white border-purple-500 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:text-purple-600'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {majorType === 'double' ? (
                            <>
                              <Check className="w-4 h-4" />
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
                        className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all ${
                          majorType === 'minor'
                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                            : majorType === 'double'
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400 hover:text-orange-600'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          {majorType === 'minor' ? (
                            <>
                              <Check className="w-4 h-4" />
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
                    <p className="text-xs text-gray-500 mt-1.5">
                      {majorType === 'double' ? '복수전공' : '부전공'}을 선택했습니다. 해제하려면 다시 클릭하세요.
                    </p>
                  )}
                </div>
              )}

              {/* Secondary Department (shown for double/minor) */}
              {majorType !== 'single' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {majorType === 'double' ? '복수전공 학과' : '부전공 학과'}
                  </label>
                  <SearchableSelect
                    options={departmentOptions.filter((d) => d.value !== departmentId)}
                    value={secondaryDepartmentId}
                    onChange={(val) => setSecondaryDepartmentId(val)}
                    placeholder="학과를 검색하세요"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="inline-flex items-center">
                  다음
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-t-4 border-emerald-500 animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <CardTitle>졸업 요건 설정</CardTitle>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                졸업 기준과 취득 학점을 잘 모르시나요?{' '}
                <Link
                  href="/help/graduation-guide"
                  className="text-[#00AACA] hover:text-[#153974] underline"
                >
                  확인 방법 보기
                </Link>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Warning banner for multi-major */}
              {majorType !== 'single' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      {majorType === 'double' ? '복수전공' : '부전공'}을 선택하셨습니다
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      이수 기준이 변경되므로 졸업 요건을 직접 확인하고 설정해주세요.
                      아래 값은 학과 기준표에서 자동으로 불러온 것이며, 실제와 다를 수 있습니다.
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Graduation Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b pb-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">졸업 기준</h3>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">졸업학점</label>
                    <Input
                      type="number"
                      value={totalCredits}
                      onChange={(e) => setTotalCredits(parseInt(e.target.value) || 0)}
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">교양학점</label>
                    <Input
                      type="number"
                      value={generalCredits}
                      onChange={(e) => setGeneralCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">전공학점</label>
                    <Input
                      type="number"
                      value={primaryMajorCredits}
                      onChange={(e) => setPrimaryMajorCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">전공핵심 (최소)</label>
                    <Input
                      type="number"
                      value={primaryMajorRequiredMin}
                      onChange={(e) => setPrimaryMajorRequiredMin(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">전공필수 최소 이수학점</p>
                  </div>
                </div>

                {/* Right: Earned Credits */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b pb-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">취득 학점</h3>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">기이수 졸업학점</label>
                    <Input
                      type="number"
                      value={earnedTotalCredits}
                      onChange={(e) => setEarnedTotalCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">이미 이수한 총 학점 (전공+교양+기타 포함)</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">기이수 교양학점</label>
                    <Input
                      type="number"
                      value={earnedGeneralCredits}
                      onChange={(e) => setEarnedGeneralCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">기이수 전공학점</label>
                    <Input
                      type="number"
                      value={earnedPrimaryMajorCredits}
                      onChange={(e) => setEarnedPrimaryMajorCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">기이수 전공핵심학점</label>
                    <Input
                      type="number"
                      value={earnedPrimaryMajorRequiredCredits}
                      onChange={(e) => setEarnedPrimaryMajorRequiredCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                {/* Conditional: Double Major Requirements */}
                {majorType === 'double' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b pb-2">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-gray-900">복수전공 기준</h3>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">복수전공 전공학점</label>
                        <Input type="number" value={secondaryMajorCredits} onChange={(e) => setSecondaryMajorCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">복수전공 전공핵심 (최소)</label>
                        <Input type="number" value={secondaryMajorRequiredMin} onChange={(e) => setSecondaryMajorRequiredMin(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b pb-2">
                        <Award className="w-4 h-4 text-purple-500" />
                        <h3 className="text-sm font-semibold text-gray-900">복수전공 기이수</h3>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">기이수 복수전공 전공학점</label>
                        <Input type="number" value={earnedSecondaryMajorCredits} onChange={(e) => setEarnedSecondaryMajorCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">기이수 복수전공 전공핵심</label>
                        <Input type="number" value={earnedSecondaryMajorRequiredCredits} onChange={(e) => setEarnedSecondaryMajorRequiredCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                    </div>
                  </>
                )}

                {/* Conditional: Minor Requirements */}
                {majorType === 'minor' && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b pb-2">
                        <BookOpen className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-semibold text-gray-900">부전공 기준</h3>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">부전공 전공학점</label>
                        <Input type="number" value={minorCredits} onChange={(e) => setMinorCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">부전공 전공핵심 (최소)</label>
                        <Input type="number" value={minorRequiredMin} onChange={(e) => setMinorRequiredMin(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">부전공시 주전공 최소학점</label>
                        <Input type="number" value={minorPrimaryMajorMin} onChange={(e) => setMinorPrimaryMajorMin(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 border-b pb-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-semibold text-gray-900">부전공 기이수</h3>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">기이수 부전공 전공학점</label>
                        <Input type="number" value={earnedMinorCredits} onChange={(e) => setEarnedMinorCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">기이수 부전공 전공핵심</label>
                        <Input type="number" value={earnedMinorRequiredCredits} onChange={(e) => setEarnedMinorRequiredCredits(parseInt(e.target.value) || 0)} min={0} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {autoFillMessage && (
                <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-md">{autoFillMessage}</p>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => { setStep(1); setError(''); setAutoFillMessage(''); }} className="inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                <Button onClick={handleComplete} disabled={!isGuest && completeMutation.isPending} className="inline-flex items-center">
                  {!isGuest && completeMutation.isPending ? '처리 중...' : '완료'}
                  {(isGuest || !completeMutation.isPending) && <CheckCircle className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
