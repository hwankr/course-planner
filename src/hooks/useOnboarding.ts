'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/types';

interface Department {
  _id: string;
  code: string;
  name: string;
  college?: string;
}

interface CompleteOnboardingInput {
  departmentId: string;
  majorType: 'single' | 'double' | 'minor';
  secondaryDepartmentId?: string;
  enrollmentYear: number;
  graduationRequirements: {
    majorType: 'single' | 'double' | 'minor';
    totalCredits: number;
    generalCredits: number;
    primaryMajorCredits: number;
    primaryMajorRequiredMin: number;
    secondaryMajorCredits?: number;
    secondaryMajorRequiredMin?: number;
    minorCredits?: number;
    minorRequiredMin?: number;
    minorPrimaryMajorMin?: number;
    earnedTotalCredits: number;
    earnedGeneralCredits: number;
    earnedPrimaryMajorCredits: number;
    earnedPrimaryMajorRequiredCredits: number;
    earnedSecondaryMajorCredits?: number;
    earnedSecondaryMajorRequiredCredits?: number;
    earnedMinorCredits?: number;
    earnedMinorRequiredCredits?: number;
  };
}

export function useDepartments() {
  return useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await fetch('/api/departments');
      const result: ApiResponse<Department[]> = await res.json();
      if (!result.success || !result.data) throw new Error(result.error || '학과 목록을 불러올 수 없습니다.');
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - department list is static
    refetchOnWindowFocus: false,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteOnboardingInput) => {
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const result: ApiResponse<unknown> = await res.json();
      if (!result.success) throw new Error(result.error || '온보딩 처리에 실패했습니다.');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['graduation-requirement'] });
    },
  });
}
