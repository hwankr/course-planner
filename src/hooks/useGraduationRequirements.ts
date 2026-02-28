'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, GraduationProgress, GraduationRequirementInput } from '@/types';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestGraduationStore, calculateGuestProgress } from '@/stores/guestGraduationStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';

// ============================================
// Types (local to this hook)
// ============================================

interface GraduationRequirement {
  _id: string;
  user: string;
  majorType: 'single' | 'double' | 'minor';
  totalCredits: number;
  primaryMajorCredits: number;
  primaryMajorRequiredMin: number;
  generalCredits: number;
  secondaryMajorCredits?: number;
  secondaryMajorRequiredMin?: number;
  minorCredits?: number;
  minorRequiredMin?: number;
  minorPrimaryMajorMin?: number;
  earnedTotalCredits: number;
  earnedPrimaryMajorCredits: number;
  earnedGeneralCredits: number;
  earnedPrimaryMajorRequiredCredits: number;
  earnedSecondaryMajorCredits?: number;
  earnedSecondaryMajorRequiredCredits?: number;
  earnedMinorCredits?: number;
  earnedMinorRequiredCredits?: number;
  requirementYear?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Query Keys
// ============================================

export const graduationRequirementKeys = {
  all: ['graduation-requirement'] as const,
  detail: () => [...graduationRequirementKeys.all, 'detail'] as const,
  progress: () => [...graduationRequirementKeys.all, 'progress'] as const,
};

// ============================================
// Fetch Functions
// ============================================

async function fetchGraduationRequirement(): Promise<GraduationRequirement | null> {
  const response = await fetch('/api/graduation-requirements');
  const result: ApiResponse<GraduationRequirement | null> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch graduation requirement');
  }

  return result.data ?? null;
}

async function fetchGraduationProgress(): Promise<GraduationProgress | null> {
  const response = await fetch('/api/graduation-requirements/progress');
  const result: ApiResponse<GraduationProgress | null> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch graduation progress');
  }

  return result.data ?? null;
}

async function upsertGraduationRequirement(input: GraduationRequirementInput): Promise<GraduationRequirement> {
  const response = await fetch('/api/graduation-requirements', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result: ApiResponse<GraduationRequirement> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to save graduation requirement');
  }

  return result.data;
}

async function createDefaultGraduationRequirement(): Promise<GraduationRequirement> {
  const response = await fetch('/api/graduation-requirements/defaults', {
    method: 'POST',
  });

  const result: ApiResponse<GraduationRequirement> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create default graduation requirement');
  }

  return result.data;
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch the user's graduation requirement (single document)
 */
export function useGraduationRequirement() {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestRequirement = useGuestGraduationStore((s) => s.requirement);

  const apiResult = useQuery({
    queryKey: graduationRequirementKeys.detail(),
    queryFn: fetchGraduationRequirement,
    enabled: !isGuest,
    staleTime: 10 * 60 * 1000, // 10 minutes - requirements change infrequently
    refetchOnWindowFocus: false,
  });

  if (isGuest) {
    return {
      ...apiResult,
      data: guestRequirement,
      isLoading: false,
      error: null,
      isError: false,
    } as typeof apiResult;
  }

  return apiResult;
}

/**
 * Fetch graduation progress (from active plan)
 */
export function useGraduationProgress(options?: { enabled?: boolean }) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestRequirement = useGuestGraduationStore((s) => s.requirement);
  const guestPlan = useGuestPlanStore((s) => s.plan);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestSecondaryDepartmentId = useGuestProfileStore((s) => s.secondaryDepartmentId);

  const apiResult = useQuery({
    queryKey: graduationRequirementKeys.progress(),
    queryFn: fetchGraduationProgress,
    enabled: !isGuest && (options?.enabled ?? true),
    staleTime: 60 * 1000, // 1 minute - progress updates when plan changes
  });

  if (isGuest) {
    let progress = null;
    if (guestRequirement) {
      progress = calculateGuestProgress(
        guestRequirement,
        guestPlan?.semesters ?? [],
        guestDepartmentId,
        guestSecondaryDepartmentId
      );
    }
    return {
      ...apiResult,
      data: progress,
      isLoading: false,
      error: null,
      isError: false,
    } as typeof apiResult;
  }

  return apiResult;
}

/**
 * Upsert (create or update) graduation requirement
 */
export function useUpsertGraduationRequirement() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestSetRequirement = useGuestGraduationStore((s) => s.setRequirement);

  const apiMutation = useMutation({
    mutationFn: upsertGraduationRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.detail() });
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async (input: GraduationRequirementInput) => {
        guestSetRequirement(input);
        return input as unknown as GraduationRequirement;
      },
      mutate: (input: GraduationRequirementInput) => {
        guestSetRequirement(input);
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}

/**
 * Create default graduation requirement
 */
export function useCreateDefaultGraduationRequirement() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestCreateDefaults = useGuestGraduationStore((s) => s.createDefaults);

  const apiMutation = useMutation({
    mutationFn: createDefaultGraduationRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.detail() });
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutateAsync: async () => {
        guestCreateDefaults();
        return {} as unknown as GraduationRequirement;
      },
      isPending: false,
    } as typeof apiMutation;
  }

  return apiMutation;
}
