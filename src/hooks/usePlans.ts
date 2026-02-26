'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { graduationRequirementKeys } from './useGraduationRequirements';
import type {
  IPlan,
  AddCourseToSemesterInput,
  ApiResponse,
  Term
} from '@/types';

// ============================================
// Query Keys
// ============================================

export const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...planKeys.lists(), { filters }] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchMyPlan(): Promise<IPlan> {
  const response = await fetch('/api/plans');
  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch plan');
  }

  return result.data;
}

async function fetchPlan(id: string): Promise<IPlan> {
  const response = await fetch(`/api/plans/${id}`);
  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch plan');
  }

  return result.data;
}

async function resetPlan(id: string): Promise<IPlan> {
  const response = await fetch(`/api/plans/${id}`, {
    method: 'DELETE',
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to reset plan');
  }

  return result.data;
}

async function addCourseToPlan(params: AddCourseToSemesterInput): Promise<IPlan> {
  const { planId, year, term, courseId, category } = params;

  const response = await fetch(`/api/plans/${planId}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, term, courseId, category }),
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to add course to plan');
  }

  return result.data;
}

async function removeCourseFromPlan(params: {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
}): Promise<IPlan> {
  const { planId, year, term, courseId } = params;

  const searchParams = new URLSearchParams({
    year: String(year),
    term,
    courseId,
  });

  const response = await fetch(`/api/plans/${planId}/courses?${searchParams}`, {
    method: 'DELETE',
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to remove course from plan');
  }

  return result.data;
}

async function moveCourseBetweenSemesters(params: {
  planId: string;
  sourceYear: number;
  sourceTerm: Term;
  destYear: number;
  destTerm: Term;
  courseId: string;
}): Promise<IPlan> {
  const { planId, sourceYear, sourceTerm, destYear, destTerm, courseId } = params;

  const response = await fetch(`/api/plans/${planId}/courses/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceYear, sourceTerm, destYear, destTerm, courseId }),
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '과목 이동에 실패했습니다.');
  }

  return result.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch the single plan for the current user (auto-creates if none exists)
 */
export function useMyPlan(options?: { enabled?: boolean }) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestPlan = useGuestPlanStore((s) => s.plan);
  const getOrCreatePlan = useGuestPlanStore((s) => s.getOrCreatePlan);

  const apiResult = useQuery({
    queryKey: planKeys.detail('my'),
    queryFn: fetchMyPlan,
    enabled: !isGuest && (options?.enabled ?? true),
    staleTime: 30 * 1000, // 30 seconds - plan changes frequently via drag-and-drop
  });

  if (isGuest) {
    // Ensure guest plan exists
    const plan = guestPlan || getOrCreatePlan();
    const data = {
      _id: { toString: () => plan.id } as unknown as IPlan['_id'],
      semesters: plan.semesters.map((sem) => ({
        year: sem.year,
        term: sem.term,
        courses: sem.courses.map((c) => ({
          course: {
            _id: { toString: () => c.id },
            code: c.code,
            name: c.name,
            credits: c.credits,
            category: c.category,
          } as unknown as IPlan['semesters'][number]['courses'][number]['course'],
          status: c.status,
        })),
      })),
      user: {} as unknown as IPlan['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IPlan;
    return { ...apiResult, data, isLoading: false, error: null, isError: false } as typeof apiResult;
  }

  return apiResult;
}

/**
 * Fetch a single plan by ID with populated courses
 */
export function usePlan(id: string, options?: { enabled?: boolean }) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestPlan = useGuestPlanStore((s) => s.plan);

  const apiResult = useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => fetchPlan(id),
    enabled: !isGuest && (options?.enabled ?? true) && !!id,
    staleTime: 30 * 1000, // 30 seconds - plan changes frequently via drag-and-drop
  });

  if (isGuest) {
    if (guestPlan) {
      const data = {
        _id: { toString: () => guestPlan.id } as unknown as IPlan['_id'],
        semesters: guestPlan.semesters.map((sem) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((c) => ({
            course: {
              _id: { toString: () => c.id },
              code: c.code,
              name: c.name,
              credits: c.credits,
              category: c.category,
            } as unknown as IPlan['semesters'][number]['courses'][number]['course'],
            status: c.status,
          })),
        })),
        user: {} as unknown as IPlan['user'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IPlan;
      return { ...apiResult, data, isLoading: false, error: null, isError: false } as typeof apiResult;
    }
    return { ...apiResult, data: undefined, isLoading: false, error: null, isError: false } as typeof apiResult;
  }

  return apiResult;
}

/**
 * Reset a plan (clear all semesters/courses)
 */
export function useResetPlan() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestResetPlan = useGuestPlanStore((s) => s.resetPlan);

  const apiMutation = useMutation({
    mutationFn: resetPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
      // 커스텀 과목은 계획 초기화 시 DB에서도 삭제되므로 카탈로그 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mutateAsync: async (_: string) => {
        guestResetPlan();
        return {} as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Add a course to a semester in a plan
 */
export function useAddCourse() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestAddCourse = useGuestPlanStore((s) => s.addCourse);

  const apiMutation = useMutation({
    mutationFn: addCourseToPlan,
    onSuccess: (data) => {
      queryClient.setQueryData(planKeys.detail('my'), data);
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (params: AddCourseToSemesterInput) => {
        guestAddCourse(params.planId, params.year, params.term, {
          id: params.courseId,
          code: '',
          name: '',
          credits: 0,
          status: 'planned',
        });
        return { _id: { toString: () => params.planId } } as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Remove a course from a semester in a plan
 */
export function useRemoveCourse() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestRemoveCourse = useGuestPlanStore((s) => s.removeCourse);

  const apiMutation = useMutation({
    mutationFn: removeCourseFromPlan,
    onSuccess: (data) => {
      queryClient.setQueryData(planKeys.detail('my'), data);
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
      // 커스텀 과목은 학기에서 제거 시 DB에서도 삭제되므로 카탈로그 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (params: { planId: string; year: number; term: Term; courseId: string }) => {
        guestRemoveCourse(params.planId, params.year, params.term, params.courseId);
        return { _id: { toString: () => params.planId } } as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Move a course between semesters atomically
 */
export function useMoveCourse() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestMoveCourse = useGuestPlanStore((s) => s.moveCourse);

  const apiMutation = useMutation({
    mutationFn: moveCourseBetweenSemesters,
    onSuccess: (data) => {
      queryClient.setQueryData(planKeys.detail('my'), data);
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (params: {
        planId: string;
        sourceYear: number;
        sourceTerm: Term;
        destYear: number;
        destTerm: Term;
        courseId: string;
      }) => {
        guestMoveCourse(params.planId, params.sourceYear, params.sourceTerm, params.destYear, params.destTerm, params.courseId);
        return { _id: { toString: () => params.planId } } as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Add a semester to a plan
 */
export function useAddSemester() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestAddSemester = useGuestPlanStore((s) => s.addSemester);

  const apiMutation = useMutation({
    mutationFn: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
      const res = await fetch(`/api/plans/${planId}/semesters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, term }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add semester');
      }
      const result = await res.json();
      return result.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(planKeys.detail('my'), data);
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
        guestAddSemester(planId, year, term as Term);
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Remove a semester from a plan
 */
export function useRemoveSemester() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestRemoveSemester = useGuestPlanStore((s) => s.removeSemester);

  const apiMutation = useMutation({
    mutationFn: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
      const res = await fetch(`/api/plans/${planId}/semesters`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, term }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove semester');
      }
      const result = await res.json();
      return result.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(planKeys.detail('my'), data);
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
      // 커스텀 과목은 학기 삭제 시 DB에서도 삭제되므로 카탈로그 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
        guestRemoveSemester(planId, year, term as Term);
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Clear all courses from a semester in a plan
 */
export function useClearSemester() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestClearSemester = useGuestPlanStore((s) => s.clearSemester);

  const apiMutation = useMutation({
    mutationFn: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
      const res = await fetch(`/api/plans/${planId}/semesters`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, term }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to clear semester');
      }
      const result = await res.json();
      return result.data;
    },
    onSuccess: (data) => {
      if (data) queryClient.setQueryData(planKeys.detail('my'), data);
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
      // 커스텀 과목은 학기 초기화 시 DB에서도 삭제되므로 카탈로그 캐시 갱신
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async ({ planId, year, term }: { planId: string; year: number; term: string }) => {
        guestClearSemester(planId, year, term as Term);
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}
