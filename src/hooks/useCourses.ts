'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, ICourse, CourseFilter } from '@/types';

/**
 * TanStack Query hooks for course data fetching
 * @migration-notes 분리 시 API base URL을 환경변수로 변경
 */

// ============================================
// Helper Functions
// ============================================

/**
 * Build URL search params from filter object
 */
function buildCourseFilterParams(filter?: CourseFilter): string {
  if (!filter) return '';

  const params = new URLSearchParams();

  if (filter.departmentId) params.set('departmentId', filter.departmentId);
  if (filter.semester) params.set('semester', filter.semester);
  if (filter.category) params.set('category', filter.category);
  if (filter.search) params.set('search', filter.search);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch courses from API
 */
async function fetchCourses(filter?: CourseFilter): Promise<ICourse[]> {
  const url = `/api/courses${buildCourseFilterParams(filter)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch courses: ${response.statusText}`);
  }

  const result: ApiResponse<ICourse[]> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch courses');
  }

  return result.data;
}

/**
 * Fetch single course by ID
 */
async function fetchCourse(id: string): Promise<ICourse> {
  const response = await fetch(`/api/courses/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch course: ${response.statusText}`);
  }

  const result: ApiResponse<ICourse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to fetch course');
  }

  return result.data;
}

// ============================================
// React Query Hooks
// ============================================

/**
 * Fetch multiple courses with optional filters
 *
 * @example
 * const { data: courses, isLoading, error } = useCourses({
 *   departmentId: '123',
 *   semester: 'spring',
 *   category: 'major_required'
 * });
 */
export function useCourses(filter?: CourseFilter) {
  return useQuery({
    queryKey: ['courses', filter], // Include filter in queryKey for proper caching
    queryFn: () => fetchCourses(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single course by ID
 *
 * @example
 * const { data: course, isLoading, error } = useCourse(courseId);
 */
export function useCourse(id: string) {
  return useQuery({
    queryKey: ['courses', id],
    queryFn: () => fetchCourse(id),
    enabled: !!id, // Only run query when id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
