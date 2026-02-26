'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlanStore } from '@/stores/planStore';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { graduationRequirementKeys } from './useGraduationRequirements';
import type { ApiResponse, IPlan, Term } from '@/types';

// ============================================
// Types
// ============================================

interface UpdateCourseStatusInput {
  planId: string;
  year: number;
  term: Term;
  courseId: string;
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
  grade?: string;
}

// ============================================
// Fetch Function
// ============================================

async function updateCourseStatus(input: UpdateCourseStatusInput): Promise<IPlan> {
  const { planId, ...body } = input;

  const response = await fetch(`/api/plans/${planId}/courses/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to update course status');
  }

  return result.data;
}

// ============================================
// Hook
// ============================================

const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
  details: () => [...planKeys.all, 'detail'] as const,
  detail: (id: string) => [...planKeys.details(), id] as const,
};

/**
 * Update course status with optimistic Zustand update
 */
export function useUpdateCourseStatus() {
  const queryClient = useQueryClient();
  const updateStoreStatus = usePlanStore((s) => s.updateCourseStatus);
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestUpdateStatus = useGuestPlanStore((s) => s.updateCourseStatus);

  const apiMutation = useMutation({
    mutationFn: updateCourseStatus,
    onMutate: (variables) => {
      // Optimistic update via Zustand store
      updateStoreStatus(
        variables.year,
        variables.term,
        variables.courseId,
        variables.status
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate plan queries to sync with server
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
      // Also invalidate requirement progress since status change affects it
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
    onError: (_, variables) => {
      // On error, refetch to rollback optimistic update
      queryClient.invalidateQueries({ queryKey: planKeys.detail(variables.planId) });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (input: UpdateCourseStatusInput) => {
        guestUpdateStatus(input.planId, input.year, input.term, input.courseId, input.status);
        updateStoreStatus(input.year, input.term, input.courseId, input.status);
        return { _id: { toString: () => input.planId } } as unknown as IPlan;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}
