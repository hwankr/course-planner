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

export function RequirementsSummary() {
  const [isEditing, setIsEditing] = useState(false);

  const { data: requirement, isLoading: loadingReq } = useGraduationRequirement();
  const { data: progress, isLoading: loadingProgress } = useGraduationProgress();
  const upsertMutation = useUpsertGraduationRequirement();
  const createDefaults = useCreateDefaultGraduationRequirement();

  const isLoading = loadingReq || loadingProgress;

  const handleCreateDefault = async () => {
    try {
      await createDefaults.mutateAsync();
    } catch (error) {
      console.error('Failed to create default requirements:', error);
    }
  };

  const [saveError, setSaveError] = useState('');

  const handleUpsert = async (data: {
    totalCredits: number;
    majorCredits: number;
    majorRequiredMin: number;
    generalCredits: number;
    earnedTotalCredits: number;
    earnedMajorCredits: number;
    earnedGeneralCredits: number;
    earnedMajorRequiredCredits: number;
  }) => {
    setSaveError('');
    try {
      await upsertMutation.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save graduation requirement:', error);
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
              totalCredits: requirement.totalCredits,
              majorCredits: requirement.majorCredits,
              majorRequiredMin: requirement.majorRequiredMin,
              generalCredits: requirement.generalCredits,
              earnedTotalCredits: requirement.earnedTotalCredits || 0,
              earnedMajorCredits: requirement.earnedMajorCredits || 0,
              earnedGeneralCredits: requirement.earnedGeneralCredits || 0,
              earnedMajorRequiredCredits: requirement.earnedMajorRequiredCredits || 0,
            }}
            onSubmit={handleUpsert}
            onCancel={() => { setIsEditing(false); setSaveError(''); }}
            isLoading={upsertMutation.isPending}
          />
        </CardContent>
      </Card>
    );
  }

  // View mode - requirement exists
  const total = progress?.total ?? { required: requirement.totalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0 };
  const major = progress?.major ?? {
    required: requirement.majorCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
    requiredMin: { required: requirement.majorRequiredMin, earned: 0, percentage: 0 },
  };
  const general = progress?.general ?? {
    required: requirement.generalCredits, earned: 0, enrolled: 0, planned: 0, percentage: 0,
  };

  // Prior earned credits (기이수)
  const priorTotal = requirement.earnedTotalCredits || 0;
  const priorMajor = requirement.earnedMajorCredits || 0;
  const priorGeneral = requirement.earnedGeneralCredits || 0;
  const priorMajorRequired = requirement.earnedMajorRequiredCredits || 0;

  // Format credits display: skip "0+" when earned is 0
  const fmtCredits = (earned: number, planned: number, required: number) => {
    if (earned === 0 && planned > 0) return `${planned}/${required}`;
    if (planned > 0) return `${earned}+${planned}/${required}`;
    return `${earned}/${required}`;
  };

  return (
    <Card>
      <CardContent className="py-3 px-3 sm:px-4">
        {/* Header - always visible */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 flex-wrap">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">졸업 요건</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px] sm:max-w-[200px] relative">
              {/* Planned segment (behind) */}
              {total.planned > 0 && (
                <div
                  className={`h-full absolute inset-y-0 left-0 rounded-full ${
                    total.percentage >= 100 ? 'bg-green-300' : total.percentage >= 50 ? 'bg-blue-300' : 'bg-orange-300'
                  }`}
                  style={{ width: `${Math.min(Math.round(((total.earned + total.planned) / total.required) * 100), 100)}%` }}
                />
              )}
              {/* Earned segment */}
              <div
                className={`h-full relative transition-all rounded-full ${
                  total.percentage >= 100 ? 'bg-green-600' : total.percentage >= 50 ? 'bg-blue-600' : 'bg-orange-600'
                }`}
                style={{ width: `${Math.min(total.percentage, 100)}%` }}
              />
              {/* Prior earned segment (기이수) */}
              {priorTotal > 0 && (
                <div
                  className={`h-full absolute inset-y-0 left-0 rounded-full z-10 ${
                    total.percentage >= 100 ? 'bg-green-400' : total.percentage >= 50 ? 'bg-blue-400' : 'bg-orange-400'
                  }`}
                  style={{ width: `${Math.min(Math.round((priorTotal / total.required) * 100), 100)}%` }}
                />
              )}
            </div>
            <span className={`text-sm font-semibold ${
              total.percentage >= 100 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {total.percentage}%
              {total.planned > 0 && (
                <span className="text-gray-400 font-normal">
                  {' → '}{Math.min(Math.round(((total.earned + total.planned) / total.required) * 100), 100)}%
                </span>
              )}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              ({fmtCredits(total.earned, total.planned, total.required)}학점)
            </span>
          </div>
        </div>

        {/* Detail section - always visible */}
        <div className="mt-3 space-y-3 pt-3 border-t">
          {/* 전공학점 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
              <span className="text-xs text-gray-600 w-14">전공</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                {/* Planned segment (behind) */}
                {major.planned > 0 && (
                  <div
                    className="h-full absolute inset-y-0 left-0 rounded-full bg-red-300"
                    style={{ width: `${Math.min(Math.round(((major.earned + major.planned) / major.required) * 100), 100)}%` }}
                  />
                )}
                {/* Earned segment */}
                <div
                  className={`h-full relative rounded-full ${major.percentage >= 100 ? 'bg-green-600' : 'bg-red-600'}`}
                  style={{ width: `${Math.min(major.percentage, 100)}%` }}
                />
                {/* Prior earned segment (기이수) */}
                {priorMajor > 0 && (
                  <div
                    className={`h-full absolute inset-y-0 left-0 rounded-full z-10 ${major.percentage >= 100 ? 'bg-green-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(Math.round((priorMajor / major.required) * 100), 100)}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500 w-20 text-right">
                {fmtCredits(major.earned, major.planned, major.required)}학점
              </span>
            </div>
            {/* 전공핵심 sub-bar */}
            <div className="flex items-center gap-2 pl-4">
              <span className="text-xs text-gray-400 w-14">핵심</span>
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden relative">
                {/* Planned segment (behind) */}
                {(major.requiredMin.planned ?? 0) > 0 && (
                  <div
                    className="h-full absolute inset-y-0 left-0 rounded-full bg-red-200"
                    style={{ width: `${Math.min(Math.round(((major.requiredMin.earned + (major.requiredMin.planned ?? 0)) / major.requiredMin.required) * 100), 100)}%` }}
                  />
                )}
                {/* Earned segment */}
                <div
                  className={`h-full relative rounded-full ${major.requiredMin.percentage >= 100 ? 'bg-green-500' : 'bg-red-400'}`}
                  style={{ width: `${Math.min(major.requiredMin.percentage, 100)}%` }}
                />
                {/* Prior earned segment (기이수) */}
                {priorMajorRequired > 0 && (
                  <div
                    className={`h-full absolute inset-y-0 left-0 rounded-full z-10 ${major.requiredMin.percentage >= 100 ? 'bg-green-300' : 'bg-red-300'}`}
                    style={{ width: `${Math.min(Math.round((priorMajorRequired / major.requiredMin.required) * 100), 100)}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-400 w-20 text-right">
                {fmtCredits(major.requiredMin.earned, major.requiredMin.planned ?? 0, major.requiredMin.required)}학점
              </span>
            </div>
          </div>

          {/* 교양학점 */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500" />
              <span className="text-xs text-gray-600 w-14">교양</span>
              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden relative">
                {/* Planned segment (behind) */}
                {general.planned > 0 && (
                  <div
                    className="h-full absolute inset-y-0 left-0 rounded-full bg-blue-300"
                    style={{ width: `${Math.min(Math.round(((general.earned + general.planned) / general.required) * 100), 100)}%` }}
                  />
                )}
                {/* Earned segment */}
                <div
                  className={`h-full relative rounded-full ${general.percentage >= 100 ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${Math.min(general.percentage, 100)}%` }}
                />
                {/* Prior earned segment (기이수) */}
                {priorGeneral > 0 && (
                  <div
                    className={`h-full absolute inset-y-0 left-0 rounded-full z-10 ${general.percentage >= 100 ? 'bg-green-400' : 'bg-blue-400'}`}
                    style={{ width: `${Math.min(Math.round((priorGeneral / general.required) * 100), 100)}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-gray-500 w-20 text-right">
                {fmtCredits(general.earned, general.planned, general.required)}학점
              </span>
            </div>
          </div>

          {/* Edit button */}
          <div className="pt-3 flex justify-end border-t mt-1">
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
        </div>
      </CardContent>
    </Card>
  );
}
