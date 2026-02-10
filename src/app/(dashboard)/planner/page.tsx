'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, pointerWithin, closestCenter, useSensor, useSensors, PointerSensor, TouchSensor, type DragStartEvent, type DragEndEvent, type CollisionDetection } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { useMyPlan, useAddCourse, useRemoveCourse, useMoveCourse, useAddSemester, useRemoveSemester, useClearSemester, useResetPlan } from '@/hooks/usePlans';
import { usePlannerExport } from '@/hooks/usePlannerExport';
import { Download } from 'lucide-react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useUpdateCourseStatus } from '@/hooks/useCourseStatus';
import { usePlanStore } from '@/stores/planStore';
import { useAutoScrollOnDrag, smoothScrollTo } from '@/hooks/useAutoScrollOnDrag';
import { CourseCard } from '@/components/features/CourseCard';
import { useGraduationPreviewStore } from '@/stores/graduationPreviewStore';
import { SemesterColumn } from '@/components/features/SemesterColumn';
import { CourseCatalog } from '@/components/features/CourseCatalog';
import { AddSemesterDialog } from '@/components/features/AddSemesterDialog';
import { RequirementsSummary } from '@/components/features/RequirementsSummary';
import { Button } from '@/components/ui';
import type { Term, ICourse, RequirementCategory, AddCourseToSemesterInput } from '@/types';
import { useToastStore } from '@/stores/toastStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import { graduationRequirementKeys } from '@/hooks/useGraduationRequirements';
import { computeGraduationDelta, computeCurrentTotals, GRADUATION_CATEGORY_LABELS } from '@/lib/graduationDelta';
import type { GraduationRequirementInput } from '@/types';
import { useSession } from 'next-auth/react';
import { useDepartments } from '@/hooks/useOnboarding';
import { useGuestProfileStore } from '@/stores/guestProfileStore';
import Link from 'next/link';
import * as Sentry from '@sentry/nextjs';

// Custom collision detection: pointerWithin first, then closestCenter excluding source container
const smartCollision: CollisionDetection = (args) => {
  // pointerWithin is most accurate when pointer is inside a droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;

  // Fallback: closestCenter but prefer droppables other than the source container
  const sourceId = (args.active.data.current as { containerId?: string })?.containerId;
  const centerCollisions = closestCenter(args);
  if (sourceId) {
    const nonSource = centerCollisions.filter(c => String(c.id) !== sourceId);
    if (nonSource.length > 0) return nonSource;
  }
  return centerCollisions;
};

// Helper to parse droppableId
function parseSemesterId(droppableId: string): { year: number; term: Term } | null {
  if (droppableId === 'catalog') return null;
  const match = droppableId.match(/^semester-(\d+)-(spring|fall)$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), term: match[2] as Term };
}

export default function PlannerPage() {
  const isGuest = useGuestStore((s) => s.isGuest);

  // Department info for header display
  const { data: session } = useSession();
  const { data: departments = [] } = useDepartments();
  const guestDepartmentName = useGuestProfileStore((s) => s.departmentName);
  const guestMajorType = useGuestProfileStore((s) => s.majorType);
  const guestSecondaryDepartmentName = useGuestProfileStore((s) => s.secondaryDepartmentName);

  const departmentName = isGuest
    ? guestDepartmentName
    : departments.find(d => d._id === session?.user?.department)?.name;
  const headerMajorType = isGuest
    ? guestMajorType
    : (session?.user?.majorType || 'single');
  const secondaryDepartmentName = isGuest
    ? guestSecondaryDepartmentName
    : departments.find(d => d._id === session?.user?.secondaryDepartment)?.name;

  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [semesterYearFilter, setSemesterYearFilter] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeDragData, setActiveDragData] = useState<{
    id: string;
    containerId: string;
    course: Record<string, unknown>;
    type: 'catalog' | 'semester';
  } | null>(null);

  // @dnd-kit sensors: distance constraint for mouse, delay for touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );
  const requirementsSummaryRef = useRef<HTMLDivElement>(null);
  const semesterGridRef = useRef<HTMLDivElement>(null);
  const courseCatalogRef = useRef<HTMLDivElement>(null);
  const scrollBackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const semesterYearFilterRef = useRef<number | null>(null);

  // Guest plan store - use serialized selector for stable reference
  const guestActivePlanJson = useGuestPlanStore((s) => {
    return s.plan ? JSON.stringify(s.plan) : null;
  });

  // Fetch my plan (auto-creates for logged-in users)
  const { data: myPlan, isLoading: planLoading, error: planError } = useMyPlan();

  // Mutations
  const addCourseMutation = useAddCourse();
  const removeCourseMutation = useRemoveCourse();
  const moveCourseMutation = useMoveCourse();
  const addSemesterMutation = useAddSemester();
  const removeSemesterMutation = useRemoveSemester();
  const clearSemesterMutation = useClearSemester();
  const updateStatusMutation = useUpdateCourseStatus();
  const resetPlanMutation = useResetPlan();

  // Query client for cache access
  const queryClient = useQueryClient();

  // Zustand store
  const { activePlan, setActivePlan, addCourseToSemester, removeCourseFromSemester, clearSemester, moveCourse, focusedSemester, toggleFocusedSemester, setFocusedSemester } = usePlanStore();

  // Preview store
  const { setPreview, clearPreview, triggerHighlight } = useGraduationPreviewStore();

  // Export hook
  const { exportAsPng, exportAsPdf, isExporting } = usePlannerExport({
    targetRef: exportRef,
    beforeCapture: () => {
      semesterYearFilterRef.current = semesterYearFilter;
      setSemesterYearFilter(null);
      usePlanStore.getState().setFocusedSemester(null);
      // Force desktop layout on mobile for export
      if (exportRef.current) {
        exportRef.current.style.minWidth = '768px';
      }
    },
    afterCapture: () => {
      setSemesterYearFilter(semesterYearFilterRef.current);
      semesterYearFilterRef.current = null;
      // Restore mobile layout
      if (exportRef.current) {
        exportRef.current.style.minWidth = '';
      }
    },
  });

  // Auto-scroll to semester grid on mobile drag
  const { handleDragStartScroll, handleDragEndRestore, isDragScrollActiveRef } = useAutoScrollOnDrag(semesterGridRef, courseCatalogRef);

  // Helper: get graduation requirement imperatively (for toast delta calculation)
  const getRequirementImperative = useCallback((): GraduationRequirementInput | null => {
    if (isGuest) {
      return useGuestGraduationStore.getState().requirement;
    }
    const raw = queryClient.getQueryData<{
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
      earnedTotalCredits?: number;
      earnedPrimaryMajorCredits?: number;
      earnedGeneralCredits?: number;
      earnedPrimaryMajorRequiredCredits?: number;
      earnedSecondaryMajorCredits?: number;
      earnedSecondaryMajorRequiredCredits?: number;
      earnedMinorCredits?: number;
      earnedMinorRequiredCredits?: number;
    }>(graduationRequirementKeys.detail());
    if (!raw) return null;
    return {
      majorType: raw.majorType ?? 'single',
      totalCredits: raw.totalCredits,
      primaryMajorCredits: raw.primaryMajorCredits,
      primaryMajorRequiredMin: raw.primaryMajorRequiredMin,
      generalCredits: raw.generalCredits,
      secondaryMajorCredits: raw.secondaryMajorCredits,
      secondaryMajorRequiredMin: raw.secondaryMajorRequiredMin,
      minorCredits: raw.minorCredits,
      minorRequiredMin: raw.minorRequiredMin,
      minorPrimaryMajorMin: raw.minorPrimaryMajorMin,
      earnedTotalCredits: raw.earnedTotalCredits ?? 0,
      earnedPrimaryMajorCredits: raw.earnedPrimaryMajorCredits ?? 0,
      earnedGeneralCredits: raw.earnedGeneralCredits ?? 0,
      earnedPrimaryMajorRequiredCredits: raw.earnedPrimaryMajorRequiredCredits ?? 0,
      earnedSecondaryMajorCredits: raw.earnedSecondaryMajorCredits,
      earnedSecondaryMajorRequiredCredits: raw.earnedSecondaryMajorRequiredCredits,
      earnedMinorCredits: raw.earnedMinorCredits,
      earnedMinorRequiredCredits: raw.earnedMinorRequiredCredits,
    };
  }, [isGuest, queryClient]);

  // Helper: show toast with graduation impact after adding a course
  const showAddCourseToast = useCallback((course: { name: string; credits: number; category?: string }, year: number, term: string, courseId: string) => {
    const requirement = getRequirementImperative();
    // currentTotals was captured BEFORE the mutation by the caller
    const currentPlanState = usePlanStore.getState().activePlan;
    const currentTotals = computeCurrentTotals(
      currentPlanState?.semesters ?? [],
      requirement
    );
    // The course was ALREADY added to the store by this point, so subtract it back for accurate "before" state
    const adjustedTotals = { ...currentTotals };
    const cat = course.category || 'free_elective';
    const majorCats = ['major_required', 'major_compulsory', 'major_elective'];
    const generalCats = ['general_required', 'general_elective'];
    adjustedTotals.totalPlanned -= course.credits;
    if (majorCats.includes(cat)) adjustedTotals.primaryMajorPlanned -= course.credits;
    if (generalCats.includes(cat)) adjustedTotals.generalPlanned -= course.credits;
    if (cat === 'major_required') adjustedTotals.primaryMajorRequiredPlanned -= course.credits;

    const delta = computeGraduationDelta(
      { credits: course.credits, category: course.category as RequirementCategory | undefined },
      requirement,
      adjustedTotals
    );

    const catLabel = GRADUATION_CATEGORY_LABELS[course.category || 'free_elective'] || '자유선택';

    const undoAdd = async () => {
      removeCourseFromSemester(year, term as Term, courseId);
      try {
        if (isGuest) {
          const guestRemoveCourse = useGuestPlanStore.getState().removeCourse;
          guestRemoveCourse(activePlan!.id, year, term as Term, courseId);
        } else {
          await removeCourseMutation.mutateAsync({
            planId: activePlan!.id,
            year,
            term: term as Term,
            courseId,
          });
        }
        useToastStore.getState().addToast({
          message: '실행 취소됨',
          type: 'info',
          duration: 1500,
        });
      } catch (error) {
        Sentry.captureException(error);
      }
    };

    useToastStore.getState().addToast({
      message: `${course.name} 추가됨 · +${course.credits}학점 ${catLabel}`,
      type: 'success',
      action: { label: '실행 취소', onClick: undoAdd },
      duration: 5000,
      graduationDelta: delta ? {
        creditsDelta: course.credits,
        categoryLabel: catLabel,
        categoryPct: delta.categoryKey !== 'total' ? { before: delta.before.percentage, after: delta.after.percentage } : undefined,
        categoryCredits: delta.categoryKey !== 'total' ? { after: delta.after.credits, required: delta.categoryKey === 'primaryMajor' ? requirement!.primaryMajorCredits : requirement!.generalCredits } : undefined,
        secondRowLabel: delta.secondRowCategoryKey === 'major_required' ? '전공핵심' : '전체',
        secondRowPct: { before: delta.secondRowBefore.percentage, after: delta.secondRowAfter.percentage },
        secondRowCredits: { after: delta.secondRowAfter.credits, required: delta.secondRowCategoryKey === 'major_required' ? requirement!.primaryMajorRequiredMin : requirement!.totalCredits },
      } : undefined,
    });
  }, [getRequirementImperative, activePlan, isGuest, removeCourseFromSemester, removeCourseMutation]);

  // Sync fetched plan to Zustand store (skip for guests — handled by guest sync effect)
  useEffect(() => {
    if (isGuest) return;
    if (myPlan) {
      // Build category lookup from courses query cache (DepartmentCurriculum-enriched data)
      const categoryMap = new Map<string, string>();
      const allCourseQueries = queryClient.getQueriesData<ICourse[]>({ queryKey: ['courses'] });
      for (const [, courses] of allCourseQueries) {
        if (courses) {
          for (const c of courses) {
            if (c.category) {
              categoryMap.set(c._id.toString(), c.category);
            }
          }
        }
      }

      // Transform API plan to store format
      const storePlan = {
        id: myPlan._id.toString(),
        semesters: myPlan.semesters.map((sem) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((pc) => {
            // Handle both populated and non-populated course data
            const course = pc.course as unknown as {
              _id: { toString: () => string };
              code: string;
              name: string;
              credits: number;
              category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
            };
            const courseId = course._id?.toString() || (pc.course as unknown as string);
            return {
              id: courseId,
              code: course.code || 'N/A',
              name: course.name || 'Unknown Course',
              credits: course.credits || 0,
              category: (pc.category || course.category || categoryMap.get(courseId)) as 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching' | undefined,
              status: pc.status,
            };
          }),
        })),
      };
      setActivePlan(storePlan);
    }
  }, [isGuest, myPlan, setActivePlan, queryClient]);

  // Sync guest plan to Zustand planStore (use serialized selector to avoid infinite loop)
  useEffect(() => {
    if (!isGuest) return;
    if (guestActivePlanJson) {
      const guestPlan = JSON.parse(guestActivePlanJson);
      setActivePlan({
        id: guestPlan.id,
        semesters: guestPlan.semesters.map((sem: { year: number; term: string; courses: Array<{ id: string; code: string; name: string; credits: number; category?: string; status: string }> }) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((c: { id: string; code: string; name: string; credits: number; category?: string; status: string }) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            credits: c.credits,
            category: c.category,
            status: c.status,
          })),
        })),
      });
    } else {
      setActivePlan(null);
    }
  }, [isGuest, guestActivePlanJson, setActivePlan]);

  // Close export menu on outside click
  useEffect(() => {
    if (!showExportMenu) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showExportMenu]);

  // Escape key clears semester focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusedSemester(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusedSemester]);

  // Cleanup scroll-back timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollBackTimeoutRef.current) {
        clearTimeout(scrollBackTimeoutRef.current);
      }
    };
  }, []);

  // Clear focus if focused semester no longer exists
  useEffect(() => {
    if (focusedSemester && activePlan) {
      const exists = activePlan.semesters.some(
        (s) => s.year === focusedSemester.year && s.term === focusedSemester.term
      );
      if (!exists) {
        setFocusedSemester(null);
      }
    }
  }, [activePlan, focusedSemester, setFocusedSemester]);

  // Compute all course IDs currently in the plan
  const planCourseIds = useMemo(() => {
    if (!activePlan) return [];
    return activePlan.semesters.flatMap((sem) => sem.courses.map((c) => c.id));
  }, [activePlan]);

  // Group semesters by year for compact layout
  const semestersByYear = useMemo(() => {
    if (!activePlan) return new Map<number, Array<{ year: number; term: Term; courses: Array<{
      id: string;
      code: string;
      name: string;
      credits: number;
      category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
      status: 'planned' | 'enrolled' | 'completed' | 'failed';
    }> }>>();
    const map = new Map<number, typeof activePlan.semesters>();
    for (const sem of activePlan.semesters) {
      if (!map.has(sem.year)) map.set(sem.year, []);
      map.get(sem.year)!.push(sem);
    }
    return map;
  }, [activePlan]);

  const filteredSemestersByYear = useMemo(() => {
    if (!semesterYearFilter) return semestersByYear;
    const filtered = new Map() as typeof semestersByYear;
    const yearData = semestersByYear.get(semesterYearFilter);
    if (yearData) {
      filtered.set(semesterYearFilter, yearData);
    }
    return filtered;
  }, [semestersByYear, semesterYearFilter]);

  // Handle reset plan
  const handleResetPlan = useCallback(async () => {
    if (!activePlan) return;
    const confirmed = window.confirm('모든 학기와 과목이 삭제됩니다. 계획을 초기화하시겠습니까?');
    if (!confirmed) return;

    try {
      await resetPlanMutation.mutateAsync(activePlan.id);
      useToastStore.getState().addToast({
        message: '계획이 초기화되었습니다.',
        type: 'info',
        duration: 3000,
      });
    } catch (error) {
      Sentry.captureException(error);
    }
  }, [activePlan, resetPlanMutation]);

  // Helper to find course data from draggableId
  const findCourseData = useCallback((courseId: string) => {
    if (!activePlan) return null;
    for (const sem of activePlan.semesters) {
      const course = sem.courses.find(c => c.id === courseId);
      if (course) return course;
    }
    return null;
  }, [activePlan]);

  // Handle drag start - set preview and track active drag for DragOverlay
  const handleDragStart = useCallback((event: DragStartEvent) => {
    // Clear pending scroll-back on new drag
    if (scrollBackTimeoutRef.current) {
      clearTimeout(scrollBackTimeoutRef.current);
      scrollBackTimeoutRef.current = null;
    }

    const { active } = event;
    const data = active.data.current as { containerId: string; course: Record<string, unknown>; type: string } | undefined;
    if (!data) return;

    setActiveDragData({
      id: String(active.id),
      containerId: data.containerId,
      course: data.course,
      type: data.type as 'catalog' | 'semester',
    });

    // NOTE: Custom auto-scroll disabled — conflicts with @dnd-kit coordinate tracking.
    // @dnd-kit's built-in autoScroll handles edge-of-viewport scrolling instead.
    // handleDragStartScroll({ droppableId: data.containerId });

    // Only preview removal if dragging FROM a semester
    if (data.type === 'semester') {
      const course = findCourseData(String(active.id));
      if (course) {
        setPreview(
          {
            id: course.id,
            code: course.code,
            name: course.name,
            credits: course.credits,
            category: course.category ?? 'free_elective',
          },
          'remove',
          null
        );
      }
    }
  }, [findCourseData, setPreview, handleDragStartScroll]);

  // Handle adding a new semester
  const handleAddSemester = () => {
    if (!activePlan) return;
    setIsAddSemesterOpen(true);
  };

  const handleAddSemesterSubmit = async (year: number, term: Term) => {
    if (!activePlan) return;
    try {
      await addSemesterMutation.mutateAsync({
        planId: activePlan.id,
        year,
        term,
      });
      setIsAddSemesterOpen(false);
    } catch (error) {
      Sentry.captureException(error);
      // Dialog stays open on error
    }
  };

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const wasDragScrollActive = isDragScrollActiveRef.current;
      handleDragEndRestore();
      clearPreview();
      setActiveDragData(null);

      const { active, over } = event;

      // Dropped outside a droppable
      if (!over) return;

      const sourceContainerId = (active.data.current as { containerId?: string })?.containerId ?? '';
      const destContainerId = String(over.id);

      // Same container drop - ignore
      if (sourceContainerId === destContainerId) return;

      // Extract course ID (strip 'catalog-' prefix for catalog items)
      const rawId = String(active.id);
      const draggableId = rawId.startsWith('catalog-') ? rawId.slice(8) : rawId;

      const sourceInfo = parseSemesterId(sourceContainerId);
      const destInfo = parseSemesterId(destContainerId);

      // From catalog to semester (add course)
      if (sourceContainerId === 'catalog' && destInfo && activePlan) {
        // Duplicate guard: check current state directly to prevent race condition
        const currentPlan = usePlanStore.getState().activePlan;
        const alreadyInPlan = currentPlan?.semesters.some(sem =>
          sem.courses.some(c => c.id === draggableId)
        );
        if (alreadyInPlan) return;

        // Look up real course data from query cache
        const allCourseQueries = queryClient.getQueriesData<ICourse[]>({ queryKey: ['courses'] });
        let catalogCourse: ICourse | undefined;
        for (const [, courses] of allCourseQueries) {
          if (courses) {
            catalogCourse = courses.find(c => c._id.toString() === draggableId);
            if (catalogCourse) break;
          }
        }

        // Use real data for optimistic update (fall back to placeholder if somehow not found)
        const optimisticCourse = {
          id: draggableId,
          code: catalogCourse?.code ?? 'Loading...',
          name: catalogCourse?.name ?? 'Loading...',
          credits: catalogCourse?.credits ?? 0,
          category: catalogCourse?.category as 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching' | undefined,
          status: 'planned' as const,
        };

        // Optimistic update
        addCourseToSemester(destInfo.year, destInfo.term, optimisticCourse);

        // Show toast with graduation impact
        showAddCourseToast(
          { name: optimisticCourse.name, credits: optimisticCourse.credits, category: optimisticCourse.category },
          destInfo.year,
          destInfo.term,
          draggableId
        );

        // Trigger graduation highlight animation (synchronous, fires on optimistic update)
        triggerHighlight();

        // API call (or guest store update) - fire-and-forget async
        void (async () => {
          try {
            if (isGuest) {
              const guestAddCourse = useGuestPlanStore.getState().addCourse;
              guestAddCourse(activePlan.id, destInfo.year, destInfo.term, optimisticCourse);
            } else {
              await addCourseMutation.mutateAsync({
                planId: activePlan.id,
                year: destInfo.year,
                term: destInfo.term,
                courseId: draggableId,
                category: catalogCourse?.category as AddCourseToSemesterInput['category'],
              });
            }
          } catch (error) {
            // Only rollback if course still exists (wasn't undone)
            const currentState = usePlanStore.getState().activePlan;
            const stillExists = currentState?.semesters.some(sem =>
              sem.courses.some(c => c.id === draggableId)
            );
            if (stillExists) {
              removeCourseFromSemester(destInfo.year, destInfo.term, draggableId);
            }
            Sentry.captureException(error);
          }
        })();
        // Auto-scroll back to catalog on touch devices after successful placement
        if (wasDragScrollActive && courseCatalogRef.current) {
          scrollBackTimeoutRef.current = setTimeout(() => {
            const el = courseCatalogRef.current;
            if (el) {
              const rect = el.getBoundingClientRect();
              const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
              smoothScrollTo(scrollTop + rect.top - 72, 250);
            }
            scrollBackTimeoutRef.current = null;
          }, 150);
        }
        return;
      }

      // From semester to catalog (remove course)
      if (sourceInfo && destContainerId === 'catalog' && activePlan) {
        // Find course data before removing
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToRemove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        removeCourseFromSemester(sourceInfo.year, sourceInfo.term, draggableId);

        triggerHighlight();

        // API call - fire-and-forget async
        void (async () => {
          try {
            await removeCourseMutation.mutateAsync({
              planId: activePlan.id,
              year: sourceInfo.year,
              term: sourceInfo.term,
              courseId: draggableId,
            });
          } catch (error) {
            // Rollback on error
            if (courseToRemove) {
              addCourseToSemester(sourceInfo.year, sourceInfo.term, courseToRemove);
            }
            Sentry.captureException(error);
          }
        })();
        return;
      }

      // Between semesters (move course) - atomic operation
      if (sourceInfo && destInfo && activePlan) {
        // Find course data before moving
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToMove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        moveCourse(sourceInfo.year, sourceInfo.term, destInfo.year, destInfo.term, draggableId);

        // API call: atomic move - fire-and-forget async
        void (async () => {
          try {
            if (isGuest) {
              const guestMoveCourse = useGuestPlanStore.getState().moveCourse;
              guestMoveCourse(activePlan.id, sourceInfo.year, sourceInfo.term, destInfo.year, destInfo.term, draggableId);
            } else {
              await moveCourseMutation.mutateAsync({
                planId: activePlan.id,
                sourceYear: sourceInfo.year,
                sourceTerm: sourceInfo.term,
                destYear: destInfo.year,
                destTerm: destInfo.term,
                courseId: draggableId,
              });
            }
          } catch (error) {
            // Rollback on error
            if (courseToMove) {
              moveCourse(destInfo.year, destInfo.term, sourceInfo.year, sourceInfo.term, draggableId);
            }
            Sentry.captureException(error);
          }
        })();
        return;
      }
    },
    [activePlan, addCourseToSemester, removeCourseFromSemester, moveCourse, addCourseMutation, removeCourseMutation, moveCourseMutation, clearPreview, triggerHighlight, queryClient, isGuest, showAddCourseToast, handleDragEndRestore, isDragScrollActiveRef]
  );

  // Handle remove course from semester column
  const handleRemoveCourse = useCallback(
    async (year: number, term: Term, courseId: string) => {
      if (!activePlan) return;

      // Find course data before removing
      const semester = activePlan.semesters.find((s) => s.year === year && s.term === term);
      const courseToRemove = semester?.courses.find((c) => c.id === courseId);

      // Optimistic update
      removeCourseFromSemester(year, term, courseId);

      // API call
      try {
        await removeCourseMutation.mutateAsync({
          planId: activePlan.id,
          year,
          term,
          courseId,
        });
      } catch (error) {
        // Rollback on error
        if (courseToRemove) {
          addCourseToSemester(year, term, courseToRemove);
        }
        Sentry.captureException(error);
      }
    },
    [activePlan, removeCourseFromSemester, addCourseToSemester, removeCourseMutation]
  );

  // Handle delete semester
  const handleDeleteSemester = useCallback(
    async (year: number, term: Term) => {
      if (!activePlan) return;
      try {
        await removeSemesterMutation.mutateAsync({
          planId: activePlan.id,
          year,
          term,
        });
      } catch (error) {
        Sentry.captureException(error);
      }
    },
    [activePlan, removeSemesterMutation]
  );

  // Handle clear semester (remove all courses but keep semester)
  const handleClearSemester = useCallback(
    async (year: number, term: Term) => {
      if (!activePlan) return;

      // Save courses for potential rollback
      const semester = activePlan.semesters.find(
        (s) => s.year === year && s.term === term
      );
      const savedCourses = semester?.courses ? [...semester.courses] : [];

      // Optimistic update
      clearSemester(year, term);

      try {
        if (isGuest) {
          const guestClearSemester = useGuestPlanStore.getState().clearSemester;
          guestClearSemester(activePlan.id, year, term);
        } else {
          await clearSemesterMutation.mutateAsync({
            planId: activePlan.id,
            year,
            term,
          });
        }
      } catch (error) {
        // Rollback: re-add saved courses
        const planStore = usePlanStore.getState();
        if (planStore.activePlan) {
          const semesterExists = planStore.activePlan.semesters.find(
            (s) => s.year === year && s.term === term
          );
          if (semesterExists) {
            for (const course of savedCourses) {
              planStore.addCourseToSemester(year, term, course);
            }
          }
        }
        Sentry.captureException(error);
      }
    },
    [activePlan, clearSemester, clearSemesterMutation, isGuest]
  );

  // Handle click-to-add course to focused semester
  const handleClickAdd = useCallback(
    async (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory }) => {
      if (!activePlan || !focusedSemester) return;

      const { year, term } = focusedSemester;

      // Check if course already in plan (memoized + fresh state)
      if (planCourseIds.includes(courseId)) return;
      const currentPlan = usePlanStore.getState().activePlan;
      const alreadyInPlan = currentPlan?.semesters.some(sem =>
        sem.courses.some(c => c.id === courseId)
      );
      if (alreadyInPlan) return;

      // Optimistic update with real course data
      const optimisticCourse = {
        id: courseId,
        code: courseData.code,
        name: courseData.name,
        credits: courseData.credits,
        category: courseData.category as 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching' | undefined,
        status: 'planned' as const,
      };
      addCourseToSemester(year, term, optimisticCourse);

      // Show toast with graduation impact
      showAddCourseToast(
        { name: courseData.name, credits: courseData.credits, category: courseData.category },
        year,
        term,
        courseId
      );

      // API call (or guest store update)
      try {
        if (isGuest) {
          // For guest mode, add full course data directly to guest store
          const guestAddCourse = useGuestPlanStore.getState().addCourse;
          guestAddCourse(activePlan.id, year, term, optimisticCourse);
        } else {
          await addCourseMutation.mutateAsync({
            planId: activePlan.id,
            year,
            term,
            courseId,
            category: courseData.category,
          });
        }
      } catch (error) {
        // Only rollback if course still exists (wasn't undone)
        const currentState = usePlanStore.getState().activePlan;
        const stillExists = currentState?.semesters.some(sem =>
          sem.courses.some(c => c.id === courseId)
        );
        if (stillExists) {
          removeCourseFromSemester(year, term, courseId);
        }
        Sentry.captureException(error);
      }
    },
    [activePlan, focusedSemester, planCourseIds, addCourseToSemester, removeCourseFromSemester, addCourseMutation, showAddCourseToast, isGuest]
  );

  const handleSemesterFocus = useCallback(
    (year: number, term: Term) => {
      toggleFocusedSemester(year, term);
      setSemesterYearFilter(year);
    },
    [toggleFocusedSemester]
  );

  // Handle course status change
  const handleStatusChange = useCallback(
    async (courseId: string, newStatus: 'planned' | 'enrolled' | 'completed' | 'failed') => {
      if (!activePlan) return;

      // Find which semester this course is in
      const semester = activePlan.semesters.find(s =>
        s.courses.some(c => c.id === courseId)
      );
      if (!semester) return;

      try {
        await updateStatusMutation.mutateAsync({
          planId: activePlan.id,
          year: semester.year,
          term: semester.term,
          courseId,
          status: newStatus,
        });
      } catch (error) {
        Sentry.captureException(error);
      }
    },
    [activePlan, updateStatusMutation]
  );

  // Loading state
  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3069B3]"></div>
      </div>
    );
  }

  // Error state
  if (planError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-500 mb-4">계획을 불러오는데 실패했습니다.</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">수강 계획</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {departmentName ? (
              <>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#153974]/10 text-[#153974]">
                  {departmentName}
                </span>
                {headerMajorType !== 'single' && secondaryDepartmentName && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    headerMajorType === 'double'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {headerMajorType === 'double' ? '복수전공' : '부전공'}: {secondaryDepartmentName}
                  </span>
                )}
              </>
            ) : (
              <Link href="/profile" className="text-xs text-gray-400 hover:text-[#153974] underline">
                학과를 설정해주세요
              </Link>
            )}
          </div>
          <p data-export-ignore className="text-gray-600 mt-1 text-sm sm:text-base">학기를 클릭하여 포커스 후, 과목 리스트에서 과목을 추가하세요.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Export Button */}
          {activePlan && activePlan.semesters.length > 0 && (
            <div ref={exportMenuRef} className="relative">
              <Button
                variant="outline"
                onClick={() => {
                  if (isGuest) {
                    useToastStore.getState().addToast({
                      message: '로그인 후 이용할 수 있는 기능입니다.',
                      type: 'info',
                      duration: 3000,
                    });
                    return;
                  }
                  setShowExportMenu(!showExportMenu);
                }}
                disabled={isExporting}
                className="text-sm"
              >
                {isExporting ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></span>
                    내보내는 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    내보내기
                  </span>
                )}
              </Button>
              {showExportMenu && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => { exportAsPng(); setShowExportMenu(false); }}
                  >
                    PNG 이미지
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => { exportAsPdf(); setShowExportMenu(false); }}
                  >
                    PDF 문서
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Reset Plan Button */}
          {activePlan && activePlan.semesters.length > 0 && (
            <Button
              variant="outline"
              onClick={handleResetPlan}
              isLoading={resetPlanMutation.isPending}
              className="text-sm text-red-600 border-red-300 hover:bg-red-50"
            >
              초기화
            </Button>
          )}
        </div>
      </div>

      {/* Drag and Drop Context */}
      {activePlan && (
        <DndContext
          sensors={sensors}
          collisionDetection={smartCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6" ref={exportRef}>
            {/* Export-only header (visible only during capture) */}
            {isExporting && (
              <div className="pb-2">
                <h1 className="text-xl font-bold text-gray-900">수강 계획</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {departmentName && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#153974]/10 text-[#153974]">
                      {departmentName}
                    </span>
                  )}
                  {headerMajorType !== 'single' && secondaryDepartmentName && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      headerMajorType === 'double' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {headerMajorType === 'double' ? '복수전공' : '부전공'}: {secondaryDepartmentName}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Requirements Summary Widget */}
            <div ref={requirementsSummaryRef}>
              <RequirementsSummary />
            </div>

            {/* Course Catalog - Full Width Top Row */}
            <div ref={courseCatalogRef} data-export-ignore style={{ scrollMarginTop: '72px' }}>
              <CourseCatalog
                planCourseIds={planCourseIds}
                onClickAdd={handleClickAdd}
                focusedSemester={focusedSemester}
                isAddingCourse={addCourseMutation.isPending}
              />
            </div>

            {/* Semester Grid - Full Width Bottom Row */}
            <div ref={semesterGridRef} className="space-y-4">
              {/* Year filter for semester grid */}
              {semestersByYear.size > 0 && (
                <div data-export-ignore className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">학년</span>
                  {[null, ...Array.from(semestersByYear.keys()).sort()].map((y) => (
                    <button
                      key={y ?? 'all'}
                      onClick={() => setSemesterYearFilter(y)}
                      className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors flex-shrink-0
                        ${semesterYearFilter === y
                          ? 'bg-[#153974] text-white'
                          : 'bg-[#153974]/10 text-[#153974] hover:bg-[#153974]/20'}`}
                    >
                      {y ? `${y}학년` : '전체'}
                    </button>
                  ))}
                </div>
              )}

{(() => {
                  let hintShown = false;
                  return Array.from(filteredSemestersByYear.entries()).map(([year, semesters]) => {
                    const showHint = !hintShown;
                    if (showHint) hintShown = true;
                    return (
                  <div key={year} className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        {year}학년
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          ({semesters.reduce((total, sem) => total + sem.courses.reduce((sum, c) => sum + c.credits, 0), 0)}학점)
                        </span>
                      </h3>
                      {showHint && (
                        <span className="flex items-center gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-700">예정</span>
                          <span className="text-gray-400">↔</span>
                          <span className="px-1.5 py-0.5 rounded font-medium bg-emerald-100 text-emerald-700">이수</span>
                          <span className="text-gray-400 ml-0.5">클릭하여 변경</span>
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {semesters.map((semester) => (
                          <div key={`${semester.year}-${semester.term}`}>
                            <SemesterColumn
                              semester={semester}
                              compact={true}
                              isFocused={focusedSemester?.year === semester.year && focusedSemester?.term === semester.term}
                              onFocus={() => handleSemesterFocus(semester.year, semester.term)}
                              onRemoveCourse={(courseId) => handleRemoveCourse(semester.year, semester.term, courseId)}
                              onDelete={() => handleDeleteSemester(semester.year, semester.term)}
                              onClear={() => handleClearSemester(semester.year, semester.term)}
                              onStatusChange={handleStatusChange}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                    );
                  });
                })()}

              {/* Add Semester Button */}
              <div data-export-ignore className="flex justify-center py-4">
                <Button
                  variant="ghost"
                  onClick={handleAddSemester}
                  className="text-gray-500 hover:text-gray-700 border-dashed border-2 px-6 py-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  학기 추가
                </Button>
              </div>
            </div>
          </div>
          <DragOverlay>
            {activeDragData ? (
              <div className="w-[250px] shadow-lg rounded-lg opacity-90 pointer-events-none">
                <CourseCard
                  course={activeDragData.course as Record<string, unknown> & { code: string; name: string; credits: number }}
                  compact={true}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Semester Dialog */}
      {activePlan && (
        <AddSemesterDialog
          isOpen={isAddSemesterOpen}
          onClose={() => setIsAddSemesterOpen(false)}
          onAdd={handleAddSemesterSubmit}
          existingSemesters={activePlan.semesters.map(s => ({ year: s.year, term: s.term }))}
          isLoading={addSemesterMutation.isPending}
        />
      )}

    </div>
  );
}
