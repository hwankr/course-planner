'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, GraduationProgress } from '@/types';

// ============================================
// Types (local to this hook)
// ============================================

interface GraduationRequirement {
  _id: string;
  user: string;
  totalCredits: number;
  majorCredits: number;
  majorRequiredMin: number;
  generalCredits: number;
  earnedMajorCredits: number;
  earnedGeneralCredits: number;
  createdAt: string;
  updatedAt: string;
}

interface GraduationRequirementInput {
  totalCredits: number;
  majorCredits: number;
  majorRequiredMin: number;
  generalCredits: number;
  earnedMajorCredits: number;
  earnedGeneralCredits: number;
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
  return useQuery({
    queryKey: graduationRequirementKeys.detail(),
    queryFn: fetchGraduationRequirement,
  });
}

/**
 * Fetch graduation progress (from active plan)
 */
export function useGraduationProgress() {
  return useQuery({
    queryKey: graduationRequirementKeys.progress(),
    queryFn: fetchGraduationProgress,
  });
}

/**
 * Upsert (create or update) graduation requirement
 */
export function useUpsertGraduationRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: upsertGraduationRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.detail() });
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });
}

/**
 * Create default graduation requirement
 */
export function useCreateDefaultGraduationRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDefaultGraduationRequirement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.detail() });
      queryClient.invalidateQueries({ queryKey: graduationRequirementKeys.progress() });
    },
  });
}
