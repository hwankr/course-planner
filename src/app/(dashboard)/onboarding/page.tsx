'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { useDepartments, useCompleteOnboarding } from '@/hooks/useOnboarding';
import {
  Check,
  School,
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const { data: departments = [], isLoading: isDeptLoading } = useDepartments();
  const completeMutation = useCompleteOnboarding();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1 data
  const [departmentId, setDepartmentId] = useState('');
  const [enrollmentYear, setEnrollmentYear] = useState('');

  // Step 2 data - graduation requirements
  const [totalCredits, setTotalCredits] = useState(120);
  const [generalCredits, setGeneralCredits] = useState(30);
  const [majorCredits, setMajorCredits] = useState(63);
  const [earnedGeneralCredits, setEarnedGeneralCredits] = useState(0);
  const [earnedMajorCredits, setEarnedMajorCredits] = useState(0);

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
    setStep(2);
  };

  const handleComplete = async () => {
    setError('');
    if (totalCredits < 1) {
      setError('졸업학점은 1 이상이어야 합니다.');
      return;
    }

    try {
      await completeMutation.mutateAsync({
        departmentId,
        enrollmentYear: parseInt(enrollmentYear),
        graduationRequirements: {
          totalCredits,
          majorCredits,
          majorRequiredMin: 0,
          generalCredits,
          earnedMajorCredits,
          earnedGeneralCredits,
        },
      });

      // Refresh JWT to get onboardingCompleted=true
      await updateSession();
      router.push('/dashboard');
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
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-emerald-500 text-white'
            }`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>

            {/* Connecting Line */}
            <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                step > 1 ? 'w-full bg-gradient-to-r from-blue-500 to-indigo-500' : 'w-0'
              }`} />
            </div>

            {/* Step 2 Circle */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              step === 2
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-200 text-gray-500'
            }`}>
              2
            </div>
          </div>

          {/* Step Labels */}
          <div className="flex justify-between w-full max-w-xs mx-auto mt-2 px-0">
            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>학과 선택</span>
            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>졸업 요건</span>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 ? (
          <Card className="border-t-4 border-blue-500 animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-blue-600" />
                <CardTitle>학과 및 입학 정보</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isDeptLoading}
                >
                  <option value="">{isDeptLoading ? '불러오는 중...' : '학과를 선택하세요'}</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
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
            </CardHeader>
            <CardContent className="space-y-6">
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
                      value={majorCredits}
                      onChange={(e) => setMajorCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>

                {/* Right: Earned Credits */}
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 border-b pb-2">
                    <Award className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900">취득 학점</h3>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">기이수 총학점</label>
                    <Input
                      type="number"
                      value={earnedMajorCredits + earnedGeneralCredits}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">전공 + 교양 자동 합산</p>
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
                      value={earnedMajorCredits}
                      onChange={(e) => setEarnedMajorCredits(parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => { setStep(1); setError(''); }} className="inline-flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                <Button onClick={handleComplete} disabled={completeMutation.isPending} className="inline-flex items-center">
                  {completeMutation.isPending ? '처리 중...' : '완료'}
                  {!completeMutation.isPending && <CheckCircle className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
