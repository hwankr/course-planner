'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, type DropResult, type DragStart, type DragUpdate } from '@hello-pangea/dnd';
import { useQueryClient } from '@tanstack/react-query';
import { usePlans, usePlan, useCreatePlan, useAddCourse, useRemoveCourse, useAddSemester, useRemoveSemester } from '@/hooks/usePlans';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useUpdateCourseStatus } from '@/hooks/useCourseStatus';
import { useActivatePlan } from '@/hooks/usePlanActivation';
import { usePlanStore } from '@/stores/planStore';
import { useAutoScrollOnDrag } from '@/hooks/useAutoScrollOnDrag';
import { useGraduationPreviewStore } from '@/stores/graduationPreviewStore';
import { SemesterColumn } from '@/components/features/SemesterColumn';
import { CourseCatalog } from '@/components/features/CourseCatalog';
import { AddSemesterDialog } from '@/components/features/AddSemesterDialog';
import { RequirementsSummary } from '@/components/features/RequirementsSummary';
import { FloatingGradSummary } from '@/components/features/FloatingGradSummary';
import { Button, Card, CardContent } from '@/components/ui';
import type { Term, ICourse } from '@/types';
import { useToastStore } from '@/stores/toastStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import { graduationRequirementKeys } from '@/hooks/useGraduationRequirements';
import { computeGraduationDelta, formatDeltaDescription, computeCurrentTotals, GRADUATION_CATEGORY_LABELS } from '@/lib/graduationDelta';
import type { GraduationRequirementInput } from '@/types';

// Helper to parse droppableId
function parseSemesterId(droppableId: string): { year: number; term: Term } | null {
  if (droppableId === 'catalog') return null;
  const match = droppableId.match(/^semester-(\d+)-(spring|fall)$/);
  if (!match) return null;
  return { year: parseInt(match[1], 10), term: match[2] as Term };
}

export default function PlannerPage() {
  const isGuest = useGuestStore((s) => s.isGuest);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [semesterYearFilter, setSemesterYearFilter] = useState<number | null>(null);
  const requirementsSummaryRef = useRef<HTMLDivElement>(null);
  const semesterGridRef = useRef<HTMLDivElement>(null);

  // Guest plan store - use serialized selector for stable reference
  const guestActivePlanJson = useGuestPlanStore((s) => {
    const plan = s.plans.find((p) => p.id === s.activePlanId);
    return plan ? JSON.stringify(plan) : null;
  });
  const guestActivePlanId = useGuestPlanStore((s) => s.activePlanId);
  const guestPlans = useGuestPlanStore((s) => s.plans);

  // Fetch all plans
  const { data: plans, isLoading: plansLoading, error: plansError } = usePlans();

  // Fetch selected plan detail
  const { data: planDetail, isLoading: planDetailLoading } = usePlan(selectedPlanId || '');

  // Mutations
  const createPlanMutation = useCreatePlan();
  const addCourseMutation = useAddCourse();
  const removeCourseMutation = useRemoveCourse();
  const addSemesterMutation = useAddSemester();
  const removeSemesterMutation = useRemoveSemester();
  const updateStatusMutation = useUpdateCourseStatus();
  const activatePlanMutation = useActivatePlan();

  // Query client for cache access
  const queryClient = useQueryClient();

  // Zustand store
  const { activePlan, setActivePlan, addCourseToSemester, removeCourseFromSemester, moveCourse, focusedSemester, toggleFocusedSemester, setFocusedSemester } = usePlanStore();

  // Preview store
  const { setPreview, clearPreview, triggerHighlight } = useGraduationPreviewStore();

  // Auto-scroll to semester grid on mobile drag
  const { handleDragStartScroll, handleDragEndRestore, isDragScrollActiveRef } = useAutoScrollOnDrag(semesterGridRef);

  // Helper: get graduation requirement imperatively (for toast delta calculation)
  const getRequirementImperative = useCallback((): GraduationRequirementInput | null => {
    if (isGuest) {
      return useGuestGraduationStore.getState().requirement;
    }
    const raw = queryClient.getQueryData<{ totalCredits: number; majorCredits: number; majorRequiredMin: number; generalCredits: number; earnedTotalCredits?: number; earnedMajorCredits?: number; earnedGeneralCredits?: number; earnedMajorRequiredCredits?: number }>(graduationRequirementKeys.detail());
    if (!raw) return null;
    return {
      totalCredits: raw.totalCredits,
      majorCredits: raw.majorCredits,
      majorRequiredMin: raw.majorRequiredMin,
      generalCredits: raw.generalCredits,
      earnedTotalCredits: raw.earnedTotalCredits ?? 0,
      earnedMajorCredits: raw.earnedMajorCredits ?? 0,
      earnedGeneralCredits: raw.earnedGeneralCredits ?? 0,
      earnedMajorRequiredCredits: raw.earnedMajorRequiredCredits ?? 0,
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
    const majorCats = ['major_required', 'major_elective'];
    const generalCats = ['general_required', 'general_elective'];
    adjustedTotals.totalPlanned -= course.credits;
    if (majorCats.includes(cat)) adjustedTotals.majorPlanned -= course.credits;
    if (generalCats.includes(cat)) adjustedTotals.generalPlanned -= course.credits;

    const delta = computeGraduationDelta(
      { credits: course.credits, category: course.category as any },
      requirement,
      adjustedTotals
    );

    const catLabel = GRADUATION_CATEGORY_LABELS[course.category || 'free_elective'] || '자유선택';
    const description = delta
      ? formatDeltaDescription(delta)
      : `+${course.credits}학점 ${catLabel}`;

    const undoAdd = async () => {
      removeCourseFromSemester(year, term as any, courseId);
      try {
        if (isGuest) {
          const guestRemoveCourse = useGuestPlanStore.getState().removeCourse;
          guestRemoveCourse(activePlan!.id, year, term as any, courseId);
        } else {
          await removeCourseMutation.mutateAsync({
            planId: activePlan!.id,
            year,
            term: term as any,
            courseId,
          });
        }
        useToastStore.getState().addToast({
          message: '실행 취소됨',
          type: 'info',
          duration: 1500,
        });
      } catch (error) {
        console.error('Failed to undo course addition:', error);
      }
    };

    useToastStore.getState().addToast({
      message: `${course.name} 추가됨`,
      description,
      type: 'success',
      action: { label: '실행 취소', onClick: undoAdd },
      duration: 5000,
    });
  }, [getRequirementImperative, activePlan, isGuest, removeCourseFromSemester, removeCourseMutation]);

  // Auto-select first plan when plans are loaded
  useEffect(() => {
    if (plans && plans.length > 0 && !selectedPlanId) {
      const firstPlanId = plans[0]._id.toString();
      // Use a microtask to avoid synchronous setState in effect
      Promise.resolve().then(() => setSelectedPlanId(firstPlanId));
    }
  }, [plans, selectedPlanId]);

  // Sync fetched plan detail to Zustand store (skip for guests — handled by guest sync effect)
  useEffect(() => {
    if (isGuest) return;
    if (planDetail) {
      // Transform API plan to store format
      const storePlan = {
        id: planDetail._id.toString(),
        name: planDetail.name,
        status: planDetail.status,
        semesters: planDetail.semesters.map((sem) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((pc) => {
            // Handle both populated and non-populated course data
            const course = pc.course as unknown as {
              _id: { toString: () => string };
              code: string;
              name: string;
              credits: number;
              category?: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective';
            };
            return {
              id: course._id?.toString() || (pc.course as unknown as string),
              code: course.code || 'N/A',
              name: course.name || 'Unknown Course',
              credits: course.credits || 0,
              category: course.category as 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | undefined,
              status: pc.status,
            };
          }),
        })),
      };
      setActivePlan(storePlan);
    }
  }, [isGuest, planDetail, setActivePlan]);

  // Sync guest plan to Zustand planStore (use serialized selector to avoid infinite loop)
  useEffect(() => {
    if (!isGuest) return;
    if (guestActivePlanJson) {
      const activePlan = JSON.parse(guestActivePlanJson);
      setActivePlan({
        id: activePlan.id,
        name: activePlan.name,
        status: activePlan.status,
        semesters: activePlan.semesters.map((sem: { year: number; term: string; courses: Array<{ id: string; code: string; name: string; credits: number; category?: string; status: string }> }) => ({
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
      category?: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective';
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

  // Handle creating a new plan
  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return;
    try {
      const newPlan = await createPlanMutation.mutateAsync({
        name: newPlanName.trim(),
      });
      setSelectedPlanId(newPlan._id.toString());
      setNewPlanName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create plan:', error);
    }
  };

  // Helper to find course data from draggableId
  const findCourseData = useCallback((courseId: string) => {
    if (!activePlan) return null;
    for (const sem of activePlan.semesters) {
      const course = sem.courses.find(c => c.id === courseId);
      if (course) return course;
    }
    return null;
  }, [activePlan]);

  // Handle drag start - set preview for remove action
  const handleDragStart = useCallback((start: DragStart) => {
    handleDragStartScroll(start.source);
    const { source, draggableId } = start;
    const sourceInfo = parseSemesterId(source.droppableId);

    // Only preview removal if dragging FROM a semester
    if (sourceInfo) {
      const course = findCourseData(draggableId);
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

  // Handle drag update - update preview based on destination
  const handleDragUpdate = useCallback((update: DragUpdate) => {
    const { source, destination, draggableId } = update;

    if (!destination) {
      // No destination - maintain remove preview
      const sourceInfo = parseSemesterId(source.droppableId);
      if (sourceInfo) {
        const course = findCourseData(draggableId);
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
      return;
    }

    const sourceInfo = parseSemesterId(source.droppableId);
    const destInfo = parseSemesterId(destination.droppableId);

    // From catalog to semester - preview add
    if (source.droppableId === 'catalog' && destInfo) {
      // Course data will be fetched in onDragEnd, for now we can't preview accurately
      // Skip preview for catalog drag (hover handles this better)
      clearPreview();
    }
    // From semester to catalog - preview remove
    else if (sourceInfo && destination.droppableId === 'catalog') {
      const course = findCourseData(draggableId);
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
    // Between semesters - no net change in total credits, skip preview
    else if (sourceInfo && destInfo) {
      clearPreview();
    }
  }, [findCourseData, setPreview, clearPreview]);

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
      console.error('Failed to add semester:', error);
      // Dialog stays open on error
    }
  };

  // Handle drag end
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      handleDragEndRestore();
      const { source, destination, draggableId } = result;

      // Clear preview on drag end
      clearPreview();

      // Dropped outside a droppable
      if (!destination) return;

      // Dropped in same position
      if (source.droppableId === destination.droppableId && source.index === destination.index) {
        return;
      }

      const sourceInfo = parseSemesterId(source.droppableId);
      const destInfo = parseSemesterId(destination.droppableId);

      // From catalog to semester (add course)
      if (source.droppableId === 'catalog' && destInfo && activePlan) {
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
          category: catalogCourse?.category as 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | undefined,
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

        // API call (or guest store update)
        try {
          if (isGuest) {
            // For guest mode, add full course data directly to guest store
            const guestAddCourse = useGuestPlanStore.getState().addCourse;
            guestAddCourse(activePlan.id, destInfo.year, destInfo.term, optimisticCourse);
          } else {
            await addCourseMutation.mutateAsync({
              planId: activePlan.id,
              year: destInfo.year,
              term: destInfo.term,
              courseId: draggableId,
            });
          }
          triggerHighlight();
        } catch (error) {
          // Only rollback if course still exists (wasn't undone)
          const currentState = usePlanStore.getState().activePlan;
          const stillExists = currentState?.semesters.some(sem =>
            sem.courses.some(c => c.id === draggableId)
          );
          if (stillExists) {
            removeCourseFromSemester(destInfo.year, destInfo.term, draggableId);
          }
          console.error('Failed to add course:', error);
        }
        return;
      }

      // From semester to catalog (remove course)
      if (sourceInfo && destination.droppableId === 'catalog' && activePlan) {
        // Find course data before removing
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToRemove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        removeCourseFromSemester(sourceInfo.year, sourceInfo.term, draggableId);

        // API call
        try {
          await removeCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: sourceInfo.year,
            term: sourceInfo.term,
            courseId: draggableId,
          });
          triggerHighlight();
        } catch (error) {
          // Rollback on error
          if (courseToRemove) {
            addCourseToSemester(sourceInfo.year, sourceInfo.term, courseToRemove);
          }
          console.error('Failed to remove course:', error);
        }
        return;
      }

      // Between semesters (move course)
      if (sourceInfo && destInfo && activePlan) {
        // Find course data before moving
        const semester = activePlan.semesters.find(
          (s) => s.year === sourceInfo.year && s.term === sourceInfo.term
        );
        const courseToMove = semester?.courses.find((c) => c.id === draggableId);

        // Optimistic update
        moveCourse(sourceInfo.year, sourceInfo.term, destInfo.year, destInfo.term, draggableId);

        // API call: remove from source, add to destination
        try {
          await removeCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: sourceInfo.year,
            term: sourceInfo.term,
            courseId: draggableId,
          });
          await addCourseMutation.mutateAsync({
            planId: activePlan.id,
            year: destInfo.year,
            term: destInfo.term,
            courseId: draggableId,
          });
        } catch (error) {
          // Rollback on error
          if (courseToMove) {
            moveCourse(destInfo.year, destInfo.term, sourceInfo.year, sourceInfo.term, draggableId);
          }
          console.error('Failed to move course:', error);
        }
        return;
      }
    },
    [activePlan, addCourseToSemester, removeCourseFromSemester, moveCourse, addCourseMutation, removeCourseMutation, clearPreview, triggerHighlight, queryClient, isGuest, showAddCourseToast, handleDragEndRestore]
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
        console.error('Failed to remove course:', error);
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
        console.error('Failed to delete semester:', error);
      }
    },
    [activePlan, removeSemesterMutation]
  );

  // Handle click-to-add course to focused semester
  const handleClickAdd = useCallback(
    async (courseId: string, courseData: { code: string; name: string; credits: number; category?: 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' }) => {
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
        category: courseData.category as 'major_required' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | undefined,
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
        console.error('Failed to add course:', error);
      }
    },
    [activePlan, focusedSemester, planCourseIds, addCourseToSemester, removeCourseFromSemester, addCourseMutation, showAddCourseToast]
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
        console.error('Failed to update course status:', error);
      }
    },
    [activePlan, updateStatusMutation]
  );

  // Handle plan activation
  const handleActivatePlan = useCallback(async () => {
    if (!selectedPlanId) return;
    try {
      await activatePlanMutation.mutateAsync(selectedPlanId);
    } catch (error) {
      console.error('Failed to activate plan:', error);
    }
  }, [selectedPlanId, activatePlanMutation]);

  // Loading state
  if (plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (plansError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-red-500 mb-4">계획을 불러오는데 실패했습니다.</p>
        <Button onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  // No plans - show create prompt
  if (!plans || plans.length === 0 || isCreating) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">수강 계획</h1>
          <p className="text-gray-600 mt-1">새 수강 계획을 만들어 시작하세요.</p>
        </div>

        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="planName" className="block text-sm font-medium text-gray-700 mb-1">
                  계획 이름
                </label>
                <input
                  id="planName"
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="예: 2024년 졸업 계획"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreatePlan();
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreatePlan}
                  isLoading={createPlanMutation.isPending}
                  className="flex-1"
                >
                  계획 만들기
                </Button>
                {plans && plans.length > 0 && (
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    취소
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">수강 계획</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">학기를 클릭하여 포커스 후, 카탈로그에서 과목을 추가하세요.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Plan Selector */}
          {plans.length > 1 && (
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {plans.map((plan) => (
                <option key={plan._id.toString()} value={plan._id.toString()}>
                  {plan.name}
                </option>
              ))}
            </select>
          )}
          {/* Plan Status Badge + Activation */}
          {activePlan && (
            activePlan.status === 'active' ? (
              <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                활성
              </span>
            ) : (
              <Button
                variant="outline"
                onClick={handleActivatePlan}
                isLoading={activatePlanMutation.isPending}
                className="text-sm"
              >
                활성화
              </Button>
            )
          )}
          <Button onClick={() => setIsCreating(true)} className="text-sm sm:text-base">새 계획 만들기</Button>
        </div>
      </div>

      {/* Loading plan detail */}
      {planDetailLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Drag and Drop Context */}
      {activePlan && !planDetailLoading && (
        <DragDropContext
          onDragStart={handleDragStart}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {/* Floating Mini Graduation Summary (visible when main summary scrolls out) */}
            <FloatingGradSummary requirementsSummaryRef={requirementsSummaryRef} isDragScrollActiveRef={isDragScrollActiveRef} />

            {/* Requirements Summary Widget */}
            <div ref={requirementsSummaryRef}>
              <RequirementsSummary />
            </div>

            {/* Course Catalog - Full Width Top Row */}
            <CourseCatalog
              planCourseIds={planCourseIds}
              onClickAdd={handleClickAdd}
              focusedSemester={focusedSemester}
              isAddingCourse={addCourseMutation.isPending}
              isDragScrollActiveRef={isDragScrollActiveRef}
            />

            {/* Semester Grid - Full Width Bottom Row */}
            <div ref={semesterGridRef} className="space-y-4">
              {/* Year filter for semester grid */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">학년</span>
                {[null, ...Array.from(semestersByYear.keys()).sort()].map((y) => (
                  <button
                    key={y ?? 'all'}
                    onClick={() => setSemesterYearFilter(y)}
                    className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors flex-shrink-0
                      ${semesterYearFilter === y
                        ? 'bg-indigo-500 text-white'
                        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                  >
                    {y ? `${y}학년` : '전체'}
                  </button>
                ))}
              </div>

              {Array.from(filteredSemestersByYear.entries()).map(([year, semesters]) => (
                <div key={year} className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {year}학년
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({semesters.reduce((total, sem) => total + sem.courses.reduce((sum, c) => sum + c.credits, 0), 0)}학점)
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {semesters.map((semester) => (
                      <SemesterColumn
                        key={`${semester.year}-${semester.term}`}
                        semester={semester}
                        compact={true}
                        isFocused={focusedSemester?.year === semester.year && focusedSemester?.term === semester.term}
                        onFocus={() => handleSemesterFocus(semester.year, semester.term)}
                        onRemoveCourse={(courseId) => handleRemoveCourse(semester.year, semester.term, courseId)}
                        onDelete={() => handleDeleteSemester(semester.year, semester.term)}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Add Semester Button */}
              <div className="flex justify-center py-4">
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
        </DragDropContext>
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
