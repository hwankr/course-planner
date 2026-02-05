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
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleUpsert = async (data: {
    totalCredits: number;
    majorCredits: number;
    majorRequiredMin: number;
    generalCredits: number;
    earnedMajorCredits: number;
    earnedGeneralCredits: number;
  }) => {
    try {
      await upsertMutation.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save graduation requirement:', error);
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
              <RequirementForm
                onSubmit={handleUpsert}
                onCancel={() => setIsEditing(false)}
                isLoading={upsertMutation.isPending}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">졸업 요건을 설정하세요</p>
              <div className="flex gap-2">
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
          <RequirementForm
            initialData={{
              totalCredits: requirement.totalCredits,
              majorCredits: requirement.majorCredits,
              majorRequiredMin: requirement.majorRequiredMin,
              generalCredits: requirement.generalCredits,
              earnedMajorCredits: requirement.earnedMajorCredits || 0,
              earnedGeneralCredits: requirement.earnedGeneralCredits || 0,
            }}
            onSubmit={handleUpsert}
            onCancel={() => setIsEditing(false)}
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

  return (
    <Card>
      <CardContent className="py-3 px-4">
        {/* Collapsed header - always visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-medium text-gray-700">졸업 요건</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[200px]">
              <div
                className={`h-full transition-all rounded-full ${
                  total.percentage >= 100 ? 'bg-green-500' : total.percentage >= 50 ? 'bg-blue-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(total.percentage, 100)}%` }}
              />
            </div>
            <span className={`text-sm font-semibold ${
              total.percentage >= 100 ? 'text-green-600' : 'text-gray-600'
            }`}>
              {total.percentage}%
            </span>
            <span className="text-xs text-gray-400">
              ({total.earned}/{total.required}학점)
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="mt-3 space-y-3 pt-3 border-t">
            {/* 전공학점 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-red-500" />
                <span className="text-xs text-gray-600 w-14">전공</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${major.percentage >= 100 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(major.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  {major.earned}/{major.required}학점
                </span>
              </div>
              {/* 전공핵심 sub-bar */}
              <div className="flex items-center gap-2 pl-4">
                <span className="text-xs text-gray-400 w-14">핵심</span>
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${major.requiredMin.percentage >= 100 ? 'bg-green-400' : 'bg-red-300'}`}
                    style={{ width: `${Math.min(major.requiredMin.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-20 text-right">
                  {major.requiredMin.earned}/{major.requiredMin.required}학점
                </span>
              </div>
            </div>

            {/* 교양학점 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-blue-500" />
                <span className="text-xs text-gray-600 w-14">교양</span>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${general.percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(general.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-20 text-right">
                  {general.earned}/{general.required}학점
                </span>
              </div>
            </div>

            {/* Edit button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setIsExpanded(false);
                }}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                요건 수정
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
