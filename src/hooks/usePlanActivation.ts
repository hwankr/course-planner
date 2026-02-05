'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graduationRequirementKeys } from './useGraduationRequirements';
import type { ApiResponse, IPlan } from '@/types';

// ============================================
// Fetch Function
// ============================================

async function activatePlan(planId: string): Promise<IPlan> {
  const response = await fetch(`/api/plans/${planId}/activate`, {
    method: 'PATCH',
  });

  const result: ApiResponse<IPlan> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to activate plan');
  }

  return result.data;
}

// ============================================
// Hook
// ============================================

const planKeys = {
  all: ['plans'] as const,
  lists: () => [...planKeys.all, 'list'] as const,
};

/**
 * Activate a plan (deactivates all other plans for the user)
 */
export function useActivatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activatePlan,
    onSuccess: () => {
      // Invalidate plan list (status changed)
      queryClient.invalidateQueries({ queryKey: planKeys.lists() });
      // Invalidate requirement progress (active plan changed)
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });
}
