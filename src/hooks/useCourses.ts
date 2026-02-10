'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, ICourse, CourseFilter, CreateCourseInput } from '@/types';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestCourseStore } from '@/stores/guestCourseStore';
import { useGuestProfileStore } from '@/stores/guestProfileStore';

/**
 * Extended filter that supports common courses (department-independent).
 * We extend locally to avoid modifying the shared CourseFilter type.
 */
export interface ExtendedCourseFilter extends CourseFilter {
  common?: boolean;
}

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
function buildCourseFilterParams(filter?: ExtendedCourseFilter): string {
  if (!filter) return '';

  const params = new URLSearchParams();

  if (filter.common) {
    params.set('common', 'true');
  } else if (filter.departmentId) {
    params.set('departmentId', filter.departmentId);
  }
  if (filter.semester) params.set('semester', filter.semester);
  if (filter.category) params.set('category', filter.category);
  if (filter.search) params.set('search', filter.search);
  if (filter.recommendedYear) params.set('recommendedYear', String(filter.recommendedYear));
  if (filter.recommendedSemester) params.set('recommendedSemester', filter.recommendedSemester);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch courses from API
 */
async function fetchCourses(filter?: ExtendedCourseFilter): Promise<ICourse[]> {
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
export function useCourses(filter?: ExtendedCourseFilter) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestDepartmentId = useGuestProfileStore((s) => s.departmentId);
  const guestCustomCourses = useGuestCourseStore((s) => s.customCourses);

  // 공통 과목은 department 불필요, 게스트일 때 department를 게스트 프로필에서 가져옴
  const effectiveFilter: ExtendedCourseFilter | undefined = filter?.common
    ? filter
    : isGuest
      ? { ...filter, departmentId: filter?.departmentId || guestDepartmentId || undefined }
      : filter;

  const apiResult = useQuery({
    queryKey: filter?.common ? ['courses', 'common', effectiveFilter] : ['courses', effectiveFilter],
    queryFn: () => fetchCourses(effectiveFilter),
    staleTime: 5 * 60 * 1000, // 5 minutes - course catalog is relatively static
    refetchOnWindowFocus: false,
  });

  // 게스트 커스텀 과목을 API 결과에 병합
  if (isGuest && guestCustomCourses.length > 0) {
    const apiCourses = apiResult.data ?? [];
    const mergedData = [
      ...apiCourses,
      ...guestCustomCourses.map((c) => ({
        ...c,
        _id: c._id as unknown as ICourse['_id'],
        department: c.department as unknown as ICourse['department'],
        prerequisites: [] as unknown as ICourse['prerequisites'],
      })),
    ] as ICourse[];
    return {
      ...apiResult,
      data: mergedData,
    } as typeof apiResult;
  }

  return apiResult;
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
    staleTime: 5 * 60 * 1000, // 5 minutes - course catalog is relatively static
    refetchOnWindowFocus: false,
  });
}

/**
 * Create a new course (custom or official)
 */
async function createCourse(input: Omit<CreateCourseInput, 'createdBy'>): Promise<ICourse> {
  const response = await fetch('/api/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result: ApiResponse<ICourse> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to create course');
  }

  return result.data;
}

/**
 * Mutation hook for creating a course
 *
 * @example
 * const createCourse = useCreateCourse();
 * createCourse.mutate({ name: '...', code: '...', credits: 3, department: '...' });
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();
  const isGuest = useGuestStore((s) => s.isGuest);
  const guestAddCourse = useGuestCourseStore((s) => s.addCourse);

  const apiMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  if (isGuest) {
    return {
      ...apiMutation,
      mutate: (input: Omit<CreateCourseInput, 'createdBy'>, options?: { onSuccess?: () => void }) => {
        guestAddCourse({
          code: input.code,
          name: input.name,
          credits: input.credits,
          department: input.department ?? '',
          prerequisites: input.prerequisites ?? [],
          description: input.description,
          semesters: input.semesters,
          category: input.category,
          recommendedYear: input.recommendedYear,
          recommendedSemester: input.recommendedSemester,
        });
        options?.onSuccess?.();
      },
      mutateAsync: async (input: Omit<CreateCourseInput, 'createdBy'>) => {
        const course = guestAddCourse({
          code: input.code,
          name: input.name,
          credits: input.credits,
          department: input.department ?? '',
          prerequisites: input.prerequisites ?? [],
          description: input.description,
          semesters: input.semesters,
          category: input.category,
          recommendedYear: input.recommendedYear,
          recommendedSemester: input.recommendedSemester,
        });
        return course as unknown as ICourse;
      },
      isPending: false,
      isError: false,
      error: null,
    } as typeof apiMutation;
  }

  return apiMutation;
}
