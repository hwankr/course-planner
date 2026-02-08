'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DepartmentCourseStats,
  AnonymousPlanSummary,
  AnonymousPlanDetail,
  ApiResponse,
} from '@/types';

interface StatisticsError extends Error {
  code?: string;
  redirectTo?: string;
  status?: number;
}

// ============================================
// Query Keys
// ============================================

export const statisticsKeys = {
  all: ['statistics'] as const,
  department: (departmentId?: string) =>
    [...statisticsKeys.all, 'department', departmentId] as const,
  plans: (page: number, limit: number) =>
    [...statisticsKeys.all, 'plans', { page, limit }] as const,
  planDetail: (anonymousId: string) =>
    [...statisticsKeys.all, 'plan', anonymousId] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchDepartmentStats(
  departmentId?: string
): Promise<{ data: DepartmentCourseStats | null; message?: string }> {
  const params = departmentId ? `?departmentId=${departmentId}` : '';
  const response = await fetch(`/api/statistics/department${params}`);
  const result: ApiResponse<DepartmentCourseStats> & { code?: string; redirectTo?: string; message?: string } = await response.json();

  if (!response.ok) {
    const error: StatisticsError = new Error(result.error || 'Failed to fetch statistics') as StatisticsError;
    error.code = result.code;
    error.redirectTo = result.redirectTo;
    throw error;
  }

  return { data: result.data || null, message: result.message };
}

async function fetchAnonymousPlans(
  page: number,
  limit: number
): Promise<{
  plans: AnonymousPlanSummary[];
  total: number;
  page: number;
  limit: number;
}> {
  const response = await fetch(
    `/api/statistics/anonymous-plans?page=${page}&limit=${limit}`
  );
  const result: ApiResponse<{
    plans: AnonymousPlanSummary[];
    total: number;
    page: number;
    limit: number;
  }> & { code?: string } = await response.json();

  if (!response.ok) {
    const error: StatisticsError = new Error(result.error || 'Failed to fetch anonymous plans') as StatisticsError;
    error.code = result.code;
    throw error;
  }

  if (!result.data) {
    throw new Error('No data returned');
  }

  return result.data;
}

async function fetchAnonymousPlanDetail(
  anonymousId: string
): Promise<AnonymousPlanDetail> {
  const response = await fetch(
    `/api/statistics/anonymous-plans/${anonymousId}`
  );
  const result: ApiResponse<AnonymousPlanDetail> = await response.json();

  if (!response.ok || !result.data) {
    const error: StatisticsError = new Error(result.error || 'Failed to fetch plan detail') as StatisticsError;
    error.status = response.status;
    throw error;
  }

  return result.data;
}

// ============================================
// Hooks
// ============================================

/**
 * 학과별 과목 수강 통계 조회
 */
export function useDepartmentStats(departmentId?: string) {
  return useQuery({
    queryKey: statisticsKeys.department(departmentId),
    queryFn: () => fetchDepartmentStats(departmentId),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes
  });
}

/**
 * 같은 학과 익명 계획 목록 (offset 기반 페이지네이션)
 */
export function useAnonymousPlans(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: statisticsKeys.plans(page, limit),
    queryFn: () => fetchAnonymousPlans(page, limit),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,  // keepPreviousData equivalent in v5
  });
}

/**
 * 익명 계획 상세 조회
 * - 404 시 plans 목록 자동 invalidate
 */
export function useAnonymousPlanDetail(anonymousId: string | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: statisticsKeys.planDetail(anonymousId || ''),
    queryFn: () => fetchAnonymousPlanDetail(anonymousId!),
    enabled: !!anonymousId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: StatisticsError) => {
      // Don't retry on 404 (stale anonymousId)
      if (error?.status === 404) return false;
      return failureCount < 3;
    },
    meta: {
      onError: (error: StatisticsError) => {
        if (error?.status === 404) {
          // Invalidate plans list to get fresh anonymousIds
          queryClient.invalidateQueries({ queryKey: statisticsKeys.all });
        }
      },
    },
  });
}
