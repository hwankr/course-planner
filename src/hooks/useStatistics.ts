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
  plans: (departmentId?: string, page: number = 1, limit: number = 10) =>
    [...statisticsKeys.all, 'plans', departmentId, { page, limit }] as const,
  planDetail: (anonymousId: string, departmentId?: string) =>
    [...statisticsKeys.all, 'plan', anonymousId, departmentId] as const,
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
  departmentId?: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  plans: AnonymousPlanSummary[];
  total: number;
  page: number;
  limit: number;
}> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (departmentId) {
    params.append('departmentId', departmentId);
  }
  const response = await fetch(
    `/api/statistics/anonymous-plans?${params.toString()}`
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
  anonymousId: string,
  departmentId?: string
): Promise<AnonymousPlanDetail> {
  const params = departmentId ? `?departmentId=${departmentId}` : '';
  const response = await fetch(
    `/api/statistics/anonymous-plans/${anonymousId}${params}`
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
export function useAnonymousPlans(departmentId?: string, page: number = 1, limit: number = 10, enabled: boolean = true) {
  return useQuery({
    queryKey: statisticsKeys.plans(departmentId, page, limit),
    queryFn: () => fetchAnonymousPlans(departmentId, page, limit),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,  // keepPreviousData equivalent in v5
  });
}

/**
 * 익명 계획 상세 조회
 * - 404 시 plans 목록 자동 invalidate
 */
export function useAnonymousPlanDetail(anonymousId: string | null, departmentId?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: statisticsKeys.planDetail(anonymousId || '', departmentId),
    queryFn: () => fetchAnonymousPlanDetail(anonymousId!, departmentId),
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
