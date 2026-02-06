'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  IPlan,
  CreatePlanInput,
  AddCourseToSemesterInput,
  ApiResponse,
  Term
} from '@/types';

// ============================================
// Query Keys
// ============================================

const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...planKeys.lists(), { filters }] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchPlans(): Promise<IPlan[]> {
  const response = await fetch('/api/plans');
  const result: ApiResponse<IPlan[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch plans');
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

async function createPlan(input: CreatePlanInput): Promise<IPlan> {
  const response = await fetch('/api/plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create plan');
  }

  return result.data;
}

async function deletePlan(id: string): Promise<void> {
  const response = await fetch(`/api/plans/${id}`, {
    method: 'DELETE',
  });

  const result: ApiResponse<void> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to delete plan');
  }
}

async function addCourseToPlan(params: AddCourseToSemesterInput): Promise<IPlan> {
  const { planId, year, term, courseId } = params;

  const response = await fetch(`/api/plans/${planId}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, term, courseId }),
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

  const response = await fetch(`/api/plans/${planId}/courses`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, term, courseId }),
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to remove course from plan');
  }

  return result.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch all plans for the current user
 */
export function usePlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: planKeys.lists(),
    queryFn: fetchPlans,
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single plan by ID with populated courses
 */
export function usePlan(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => fetchPlan(id),
    enabled: (options?.enabled ?? true) && !!id,
  });
}

/**
 * Create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/**
 * Delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/**
 * Add a course to a semester in a plan
 */
export function useAddCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCourseToPlan,
    onSuccess: (data) => {
      // Invalidate both the list and the specific plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(data._id.toString()) });
    },
  });
}

/**
 * Remove a course from a semester in a plan
 */
export function useRemoveCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeCourseFromPlan,
    onSuccess: (data) => {
      // Invalidate both the list and the specific plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(data._id.toString()) });
    },
  });
}

/**
 * Add a semester to a plan
 */
export function useAddSemester() {
  const queryClient = useQueryClient();

  return useMutation({
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
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}

/**
 * Remove a semester from a plan
 */
export function useRemoveSemester() {
  const queryClient = useQueryClient();

  return useMutation({
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
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });
}
