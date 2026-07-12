'use client';

import { useMemo } from 'react';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { usePlanStore } from '@/stores/planStore';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { graduationRequirementKeys } from './useGraduationRequirements';
import { planKeys } from './usePlans';
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

interface CourseStatusMutationContext {
  planId: string;
  courseId: string;
  previousStatus: UpdateCourseStatusInput['status'] | undefined;
  release: () => void;
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
// Mutation Handlers
// ============================================

export function createCourseStatusMutationHandlers(queryClient: QueryClient) {
  const courseMutationQueues = new Map<string, Promise<void>>();

  return {
    onMutate: async (
      variables: UpdateCourseStatusInput
    ): Promise<CourseStatusMutationContext> => {
      const queueKey = JSON.stringify([variables.planId, variables.courseId]);
      const previousLifecycle = courseMutationQueues.get(queueKey) ?? Promise.resolve();
      let releaseCurrent!: () => void;
      let released = false;
      const currentLifecycle = new Promise<void>((resolve) => {
        releaseCurrent = resolve;
      });
      const queuedLifecycle = previousLifecycle.then(() => currentLifecycle);
      courseMutationQueues.set(queueKey, queuedLifecycle);
      const release = () => {
        if (released) return;
        released = true;
        releaseCurrent();
        if (courseMutationQueues.get(queueKey) === queuedLifecycle) {
          courseMutationQueues.delete(queueKey);
        }
      };

      try {
        await previousLifecycle;
        await queryClient.cancelQueries({ queryKey: planKeys.detail('my') });

        const activePlan = usePlanStore.getState().activePlan;
        const previousStatus = activePlan?.id === variables.planId
          ? activePlan.semesters
              .flatMap((semester) => semester.courses)
              .find((course) => course.id === variables.courseId)?.status
          : undefined;

        usePlanStore.getState().updateCourseStatus(
          variables.year,
          variables.term,
          variables.courseId,
          variables.status
        );

        return {
          planId: variables.planId,
          courseId: variables.courseId,
          previousStatus,
          release,
        };
      } catch (error) {
        release();
        throw error;
      }
    },
    onError: (
      _error: Error,
      _variables: UpdateCourseStatusInput,
      context: CourseStatusMutationContext | undefined
    ) => {
      if (!context || context.previousStatus === undefined) return;

      const { activePlan, updateCourseStatus } = usePlanStore.getState();
      if (!activePlan || activePlan.id !== context.planId) return;

      const currentSemester = activePlan.semesters.find((semester) =>
        semester.courses.some((course) => course.id === context.courseId)
      );
      if (!currentSemester) return;

      updateCourseStatus(
        currentSemester.year,
        currentSemester.term,
        context.courseId,
        context.previousStatus
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: graduationRequirementKeys.progress(),
      });
    },
    onSettled: async (
      _data: IPlan | undefined,
      _error: Error | null,
      _variables: UpdateCourseStatusInput,
      context: CourseStatusMutationContext | undefined
    ) => {
      try {
        await queryClient.invalidateQueries({
          queryKey: planKeys.detail('my'),
          refetchType: 'none',
        });
      } finally {
        context?.release();
      }
    },
  };
}

// ============================================
// Hook
// ============================================

/**
 * Update course status with optimistic Zustand update
 */
export function useUpdateCourseStatus() {
  const queryClient = useQueryClient();
  const updateStoreStatus = usePlanStore((s) => s.updateCourseStatus);
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestUpdateStatus = useGuestPlanStore((s) => s.updateCourseStatus);
  const mutationHandlers = useMemo(
    () => createCourseStatusMutationHandlers(queryClient),
    [queryClient]
  );

  const apiMutation = useMutation({
    mutationFn: updateCourseStatus,
    ...mutationHandlers,
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
