'use client';

import { useState, useCallback, useMemo } from 'react';
import { useGraduationPreviewStore } from '@/stores/graduationPreviewStore';
import type { ICourse, RequirementCategory } from '@/types';

/**
 * Hook for mobile tap-to-preview on course cards.
 * On touch devices (pointer: coarse), tapping a course toggles inline preview.
 * On desktop, this is a no-op (hover handles preview via RequirementsSummary).
 */
export function useTouchPreview(focusedSemester: { year: number; term: string } | null | undefined) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { setPreview, clearPreview } = useGraduationPreviewStore();

  const isTouchDevice = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  }, []);

  const togglePreview = useCallback(
    (course: ICourse) => {
      const courseId = course._id.toString();

      if (selectedCourseId === courseId) {
        // Deselect
        setSelectedCourseId(null);
        clearPreview();
      } else {
        // Select new course
        setSelectedCourseId(courseId);
        // Also set preview store for RequirementsSummary consistency
        setPreview(
          {
            id: courseId,
            code: course.code,
            name: course.name,
            credits: course.credits,
            category: (course.category ?? 'free_elective') as RequirementCategory,
          },
          'add',
          focusedSemester ?? null
        );
      }
    },
    [selectedCourseId, focusedSemester, setPreview, clearPreview]
  );

  const clearSelection = useCallback(() => {
    setSelectedCourseId(null);
    clearPreview();
  }, [clearPreview]);

  return { selectedCourseId, isTouchDevice, togglePreview, clearSelection };
}
