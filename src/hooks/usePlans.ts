'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
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
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestPlans = useGuestPlanStore((s) => s.plans);

  const apiResult = useQuery({
    queryKey: planKeys.lists(),
    queryFn: fetchPlans,
    enabled: !isGuest && (options?.enabled ?? true),
  });

  if (isGuest) {
    // Transform guest plans to match IPlan shape
    const data = guestPlans.map((p) => ({
      _id: { toString: () => p.id } as any,
      name: p.name,
      status: p.status,
      semesters: p.semesters,
      user: {} as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as unknown as IPlan[];
    return { ...apiResult, data, isLoading: false, error: null, isError: false } as typeof apiResult;
  }

  return apiResult;
}

/**
 * Fetch a single plan by ID with populated courses
 */
export function usePlan(id: string, options?: { enabled?: boolean }) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestPlans = useGuestPlanStore((s) => s.plans);

  const apiResult = useQuery({
    queryKey: planKeys.detail(id),
    queryFn: () => fetchPlan(id),
    enabled: !isGuest && (options?.enabled ?? true) && !!id,
  });

  if (isGuest) {
    const guestPlan = guestPlans.find((p) => p.id === id);
    if (guestPlan) {
      const data = {
        _id: { toString: () => guestPlan.id } as any,
        name: guestPlan.name,
        status: guestPlan.status,
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
            } as any,
            status: c.status,
          })),
        })),
        user: {} as any,
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
 * Create a new plan
 */
export function useCreatePlan() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestCreatePlan = useGuestPlanStore((s) => s.createPlan);

  const apiMutation = useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (input: CreatePlanInput) => {
        const plan = guestCreatePlan(input.name);
        return {
          _id: { toString: () => plan.id } as any,
          name: plan.name,
          status: plan.status,
          semesters: plan.semesters,
          user: {} as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Delete a plan
 */
export function useDeletePlan() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDeletePlan = useGuestPlanStore((s) => s.deletePlan);

  const apiMutation = useMutation({
    mutationFn: deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (id: string) => {
        guestDeletePlan(id);
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
      // Invalidate both the list and the specific plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(data._id.toString()) });
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
      // Invalidate both the list and the specific plan detail
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(data._id.toString()) });
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
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
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
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
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
