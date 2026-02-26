'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, IAcademicEvent, CreateAcademicEventInput } from '@/types';

// ============================================
// Types
// ============================================

interface AcademicEventsResponse {
  events: IAcademicEvent[];
  holidays: Array<{
    title: string;
    startDate: string;
    category: 'holiday';
    isHoliday: true;
  }>;
}

// ============================================
// Fetch Functions
// ============================================

async function fetchAcademicEvents(year: number, month: number): Promise<AcademicEventsResponse> {
  const params = new URLSearchParams({ year: String(year), month: String(month) });
  const response = await fetch(`/api/academic-events?${params}`);

  if (!response.ok) {
    throw new Error('학사 일정을 불러오는데 실패했습니다.');
  }

  const result: ApiResponse<AcademicEventsResponse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '학사 일정을 불러오는데 실패했습니다.');
  }

  return result.data;
}

async function createEvent(input: CreateAcademicEventInput): Promise<IAcademicEvent> {
  const response = await fetch('/api/academic-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result: ApiResponse<IAcademicEvent> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '학사 일정 생성에 실패했습니다.');
  }

  return result.data;
}

async function updateEvent({ id, data }: { id: string; data: Partial<CreateAcademicEventInput> }): Promise<IAcademicEvent> {
  const response = await fetch(`/api/academic-events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<IAcademicEvent> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || '학사 일정 수정에 실패했습니다.');
  }

  return result.data;
}

async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`/api/academic-events/${id}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '학사 일정 삭제에 실패했습니다.');
  }
}

// ============================================
// React Query Hooks
// ============================================

/**
 * 특정 월의 학사 일정 + 공휴일 조회
 */
export function useAcademicEvents(year: number, month: number) {
  return useQuery({
    queryKey: ['academic-events', year, month],
    queryFn: () => fetchAcademicEvents(year, month),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * 학사 일정 생성 mutation
 */
export function useCreateAcademicEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-events'] });
    },
  });
}

/**
 * 학사 일정 수정 mutation
 */
export function useUpdateAcademicEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-events'] });
    },
  });
}

/**
 * 학사 일정 삭제 mutation
 */
export function useDeleteAcademicEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-events'] });
    },
  });
}
