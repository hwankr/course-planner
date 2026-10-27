'use client';

import { useEffect, useState, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { DndContext, DragOverlay, pointerWithin, closestCenter, useSensor, useSensors, MouseSensor, TouchSensor, type DragStartEvent, type DragEndEvent, type CollisionDetection } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { useMyPlan, useAddCourse, useRemoveCourse, useMoveCourse, useAddSemester, useRemoveSemester, useClearSemester, useResetPlan } from '@/hooks/usePlans';
import { usePlannerExport } from '@/hooks/usePlannerExport';
import { ChevronRight, Download, Plus } from 'lucide-react';
import { useGuestStore } from '@/stores/guestStore';
import { useGuestPlanStore } from '@/stores/guestPlanStore';
import { useUpdateCourseStatus } from '@/hooks/useCourseStatus';
import { usePlanStore } from '@/stores/planStore';
import { useAutoScrollOnDrag, smoothScrollTo } from '@/hooks/useAutoScrollOnDrag';
import { CourseCard } from '@/components/features/CourseCard';
import { useGraduationPreviewStore } from '@/stores/graduationPreviewStore';
import { SemesterColumn } from '@/components/features/SemesterColumn';
import { SEMESTER_META_WRAP_CLASS, SemesterMeta } from '@/components/features/SemesterMeta';
import { CourseCatalog } from '@/components/features/CourseCatalog';
import { AddSemesterDialog } from '@/components/features/AddSemesterDialog';
import { RequirementsSummary } from '@/components/features/RequirementsSummary';
import { Button, PageHeader, SectionHeader } from '@/components/ui';
import { cn } from '@/lib/utils';
import { DEFAULT_CURRICULUM_YEAR } from '@/lib/constants';
import type { Term, ICourse, RequirementCategory } from '@/types';
import { useToastStore } from '@/stores/toastStore';
import { useGuestGraduationStore } from '@/stores/guestGraduationStore';
import { graduationRequirementKeys, useGraduationRequirement } from '@/hooks/useGraduationRequirements';
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

// md(768px) 이상은 데스크톱 레이아웃(사이드바 + 학기 그리드 + 과목 리스트), 미만은 모바일 레이아웃
const DESKTOP_QUERY = '(min-width: 768px)';
function subscribeDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true
  );
}

type YearSemester = { courses: Array<{ credits: number; status: 'planned' | 'enrolled' | 'completed' | 'failed' }> };

/** 학년 머리줄 메타: "24학점 · 수강중 15 · 예정 9" / "21학점 · 모두 이수" */
function getYearMeta(semesters: YearSemester[]) {
  const courses = semesters.flatMap((s) => s.courses);
  const sum = (status: string) => courses.filter((c) => c.status === status).reduce((t, c) => t + c.credits, 0);
  const parts = [`${courses.reduce((t, c) => t + c.credits, 0)}학점`];
  if (courses.length > 0 && courses.every((c) => c.status === 'completed')) {
    parts.push('모두 이수');
  } else {
    const enrolled = sum('enrolled');
    const planned = sum('planned');
    const failed = courses.filter((c) => c.status === 'failed').length;
    if (enrolled) parts.push(`수강중 ${enrolled}`);
    if (planned) parts.push(`예정 ${planned}`);
    if (failed) parts.push(`재수강 ${failed}과목`);
  }
  return parts.join(' · ');
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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

  // 졸업 요건 기준 연도 (요건이 없으면 커리큘럼 연도)
  const { data: requirementData } = useGraduationRequirement();
  const guestCurriculumYear = useGuestProfileStore((s) => s.curriculumYear);
  const requirementYear = requirementData?.requirementYear
    ?? (isGuest ? guestCurriculumYear : session?.user?.curriculumYear)
    ?? DEFAULT_CURRICULUM_YEAR;

  const isDesktop = useIsDesktop();
  // 모바일: 선택 학기 화면 ↔ 전체 학기 목록, 과목 리스트 바텀 시트
  const [mobileShowAll, setMobileShowAll] = useState(false);
  const [isCatalogSheetOpen, setIsCatalogSheetOpen] = useState(false);

  const [isAddSemesterOpen, setIsAddSemesterOpen] = useState(false);
  const [semesterYearFilter, setSemesterYearFilter] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeDragData, setActiveDragData] = useState<{
    id: string;
    containerId: string;
    course: Record<string, unknown>;
    type: 'catalog' | 'semester';
  } | null>(null);

  // @dnd-kit sensors: MouseSensor for desktop, TouchSensor for mobile
  // IMPORTANT: Do NOT use PointerSensor + TouchSensor together — PointerSensor
  // also captures touch events, causing conflicts that break mobile drag.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );
  const requirementsSummaryRef = useRef<HTMLDivElement>(null);
  const semesterGridRef = useRef<HTMLDivElement>(null);
  const courseCatalogRef = useRef<HTMLDivElement>(null);
  const catalogSheetTriggerRef = useRef<HTMLButtonElement>(null);
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

  // 내보내기 캡처 중에는 화면 폭과 관계없이 데스크톱 레이아웃으로 그린다
  const useDesktopLayout = isDesktop || isExporting;
  // 시트는 모바일 레이아웃에서만 그려지므로 포커스 트랩·키 처리도 실제로 그려진 동안에만 건다
  const isCatalogSheetShown = isCatalogSheetOpen && !useDesktopLayout;

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
      priorCutoffYear?: number | null;
      priorCutoffTerm?: 'spring' | 'fall' | null;
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
      priorCutoffYear: raw.priorCutoffYear,
      priorCutoffTerm: raw.priorCutoffTerm,
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
        semesters: guestPlan.semesters.map((sem: { year: number; term: string; courses: Array<{ id: string; code: string; name: string; credits: number; category?: string; departmentId?: string; status: string }> }) => ({
          year: sem.year,
          term: sem.term,
          courses: sem.courses.map((c: { id: string; code: string; name: string; credits: number; category?: string; departmentId?: string; status: string }) => ({
            id: c.id,
            code: c.code,
            name: c.name,
            credits: c.credits,
            category: c.category,
            departmentId: c.departmentId,
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

  // Escape key closes the mobile catalog sheet first, otherwise clears semester focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 시트 안의 모달(커스텀 과목 등)이 먼저 Escape를 처리했으면 건너뛴다
      if (e.key === 'Escape' && !e.defaultPrevented) {
        if (isCatalogSheetShown) {
          setIsCatalogSheetOpen(false);
          return;
        }
        setFocusedSemester(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setFocusedSemester, isCatalogSheetShown]);

  // Mobile catalog sheet: focus the search input on open, keep Tab inside, return focus to the trigger on close
  useEffect(() => {
    if (!isCatalogSheetShown) return;
    const sheet = courseCatalogRef.current;
    if (!sheet) return;
    const trigger = catalogSheetTriggerRef.current;
    const getFocusables = () =>
      Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.getClientRects().length > 0
      );

    const search = sheet.querySelector<HTMLInputElement>('input[type="search"]');
    (search ?? getFocusables()[0] ?? sheet).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // 시트 안에 열린 모달이 있으면 그 모달이 Tab을 가둔다
      if (e.key !== 'Tab' || sheet.querySelector('[aria-modal="true"]')) return;
      const items = getFocusables();
      if (items.length === 0) {
        e.preventDefault();
        sheet.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === sheet || !sheet.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !sheet.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (trigger?.isConnected) trigger.focus();
    };
  }, [isCatalogSheetShown]);

  // 화면 회전·창 확대로 md 이상이 되면 시트 DOM이 사라지므로 열림 상태도 닫는다.
  // 레이아웃 전환 렌더가 먼저 일어나도 변화 이벤트를 놓치지 않도록 열림 상태 기준으로 구독한다.
  useEffect(() => {
    if (!isCatalogSheetOpen) return;
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsCatalogSheetOpen(false);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isCatalogSheetOpen]);

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

    handleDragStartScroll({ droppableId: data.containerId });

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
            departmentId: course.departmentId,
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

      const dragData = active.data.current as {
        containerId?: string;
        course?: ICourse;
        departmentId?: string;
        type?: string;
      } | undefined;
      const sourceContainerId = dragData?.containerId ?? '';
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
        let catalogCourse = dragData?.course;
        if (!catalogCourse) {
          for (const [, courses] of allCourseQueries) {
            if (courses) {
              catalogCourse = courses.find(c => c._id.toString() === draggableId);
              if (catalogCourse) break;
            }
          }
        }

        // Use real data for optimistic update (fall back to placeholder if somehow not found)
        const optimisticCourse = {
          id: draggableId,
          code: catalogCourse?.code ?? 'Loading...',
          name: catalogCourse?.name ?? 'Loading...',
          credits: catalogCourse?.credits ?? 0,
          category: catalogCourse?.category as 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching' | undefined,
          departmentId: dragData?.departmentId,
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
                departmentId: dragData?.departmentId,
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
        // (모바일 바텀 시트는 고정 위치라 되돌아갈 스크롤 위치가 없다)
        if (wasDragScrollActive && courseCatalogRef.current && isDesktop) {
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
    [activePlan, addCourseToSemester, removeCourseFromSemester, moveCourse, addCourseMutation, removeCourseMutation, moveCourseMutation, clearPreview, triggerHighlight, queryClient, isGuest, showAddCourseToast, handleDragEndRestore, isDragScrollActiveRef, isDesktop]
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
    async (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => {
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
        departmentId: courseData.departmentId,
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
            departmentId: courseData.departmentId,
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

  // Remove a course from the plan wherever it is (catalog "✓ 추가됨")
  const handleRemoveFromPlan = useCallback(
    (courseId: string) => {
      const semester = activePlan?.semesters.find((s) => s.courses.some((c) => c.id === courseId));
      if (!semester) return;
      void handleRemoveCourse(semester.year, semester.term, courseId);
    },
    [activePlan, handleRemoveCourse]
  );

  // Loading state
  if (planLoading) {
    return (
      <div role="status" aria-label="계획을 불러오는 중" className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-line-2 border-t-primary" />
      </div>
    );
  }

  // Error state
  if (planError) {
    return (
      <div role="alert" className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <p className="m-0 text-[15px] font-medium text-negative">계획을 불러오는데 실패했습니다.</p>
        <Button size="lg" onClick={() => window.location.reload()}>다시 시도</Button>
      </div>
    );
  }

  const hasSemesters = Boolean(activePlan && activePlan.semesters.length > 0);
  const secondaryLabel = headerMajorType !== 'single' && secondaryDepartmentName
    ? `${headerMajorType === 'double' ? '복수전공' : '부전공'} ${secondaryDepartmentName}`
    : null;
  const headerCaption = departmentName ? (
    <>
      {departmentName}
      {secondaryLabel && <> · {secondaryLabel}</>} · {requirementYear}년 졸업 요건 기준
    </>
  ) : (
    <Link href="/profile" className="font-semibold text-primary hover:text-primary-hover">
      학과를 설정해주세요
    </Link>
  );

  const showMobileFocused = !useDesktopLayout && !!focusedSemester && !mobileShowAll;
  const focusedSemesterData = focusedSemester && activePlan
    ? activePlan.semesters.find((s) => s.year === focusedSemester.year && s.term === focusedSemester.term)
    : undefined;

  const yearTabs = semestersByYear.size > 0 && (
    <div
      data-export-ignore
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line"
    >
      <div role="group" aria-label="학년 필터" className="-mb-px flex gap-6 overflow-x-auto">
        {[null, ...Array.from(semestersByYear.keys()).sort()].map((y) => {
          const active = semesterYearFilter === y;
          return (
            <button
              key={y ?? 'all'}
              type="button"
              onClick={() => setSemesterYearFilter(y)}
              aria-pressed={active}
              className={cn(
                'h-11 shrink-0 border-b-2 px-0.5 text-[15px] transition-colors duration-150 ease-out',
                active ? 'border-ink font-semibold text-ink' : 'border-transparent font-medium text-ink-2 hover:text-ink'
              )}
            >
              {y ? `${y}학년` : '전체'}
            </button>
          );
        })}
      </div>
      <span className="hidden pb-2 text-[13px] leading-[18px] text-ink-2 sm:inline md:pb-0">
        학기 이름을 누르면 선택, 상태를 누르면 예정 ↔ 이수
      </span>
    </div>
  );

  const yearBlocks = Array.from(filteredSemestersByYear.entries()).map(([year, semesters]) => (
    <div key={year} className="flex flex-col gap-4">
      <SectionHeader title={`${year}학년`} meta={getYearMeta(semesters)} />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-x-10 gap-y-6">
        {semesters.map((semester) => (
          <SemesterColumn
            key={`${semester.year}-${semester.term}`}
            semester={semester}
            isFocused={focusedSemester?.year === semester.year && focusedSemester?.term === semester.term}
            onFocus={() => {
              handleSemesterFocus(semester.year, semester.term);
              setMobileShowAll(false);
            }}
            onRemoveCourse={(courseId) => handleRemoveCourse(semester.year, semester.term, courseId)}
            onDelete={() => handleDeleteSemester(semester.year, semester.term)}
            onClear={() => handleClearSemester(semester.year, semester.term)}
            onStatusChange={handleStatusChange}
            focusHint={useDesktopLayout ? undefined : '과목 추가를 누르면 여기에 추가돼요'}
          />
        ))}
      </div>
    </div>
  ));

  const addSemesterButton = (
    <button
      type="button"
      data-export-ignore
      onClick={handleAddSemester}
      className="inline-flex h-11 items-center gap-1.5 self-start text-[15px] font-semibold text-ink transition-colors duration-150 ease-out hover:text-primary"
    >
      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
      학기 추가
    </button>
  );

  const renderCatalog = (headerAction?: React.ReactNode) => (
    <CourseCatalog
      planCourseIds={planCourseIds}
      onClickAdd={handleClickAdd}
      onRemove={handleRemoveFromPlan}
      focusedSemester={focusedSemester}
      isAddingCourse={addCourseMutation.isPending}
      headerAction={headerAction}
      className="h-full"
    />
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="수강 계획"
        description={headerCaption}
        className="pb-6 md:pb-7"
        actions={hasSemesters ? (
          <>
            <div ref={exportMenuRef} className="relative">
              <Button
                variant="text"
                size="sm"
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
                aria-haspopup="menu"
                aria-expanded={showExportMenu}
                className="-ml-2.5 h-11 md:ml-0 md:h-9"
              >
                {isExporting ? (
                  <>
                    <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-2 border-t-ink" />
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <Download aria-hidden="true" className="h-4 w-4" />
                    내보내기
                  </>
                )}
              </Button>
              {showExportMenu && (
                <div
                  role="menu"
                  className="absolute top-full left-0 z-50 mt-1 min-w-[160px] rounded-none border border-line-2 bg-white py-1.5 shadow-float sm:right-0 sm:left-auto"
                >
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center px-3.5 text-left text-[14px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-fill"
                    onClick={() => { exportAsPng(); setShowExportMenu(false); }}
                  >
                    PNG 이미지
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center px-3.5 text-left text-[14px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-fill"
                    onClick={() => { exportAsPdf(); setShowExportMenu(false); }}
                  >
                    PDF 문서
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="textDanger"
              size="sm"
              onClick={handleResetPlan}
              isLoading={resetPlanMutation.isPending}
              className="h-11 md:h-9"
            >
              초기화
            </Button>
          </>
        ) : undefined}
      />

      {/* Drag and Drop Context */}
      {activePlan && (
        <DndContext
          sensors={sensors}
          collisionDetection={smartCollision}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div ref={exportRef} className="flex flex-col bg-white">
            {/* Export-only header (visible only during capture) */}
            {isExporting && (
              <div className="flex flex-col gap-1.5 pb-7">
                <h1 className="m-0 text-[26px] leading-[34px] font-bold tracking-[-0.02em] text-ink">수강 계획</h1>
                {departmentName && (
                  <p className="m-0 text-[14px] leading-5 text-ink-2">
                    {departmentName}
                    {secondaryLabel && <> · {secondaryLabel}</>} · {requirementYear}년 졸업 요건 기준
                  </p>
                )}
              </div>
            )}

            {/* Requirements Summary */}
            <div ref={requirementsSummaryRef}>
              <RequirementsSummary />
            </div>

            {useDesktopLayout ? (
              <div className="flex flex-col xl:flex-row xl:items-start">
                {/* Semester Grid */}
                <section
                  ref={semesterGridRef}
                  aria-label="학기별 계획"
                  className="flex min-w-0 flex-col gap-9 pt-6 xl:flex-[999_1_560px] xl:pr-10"
                >
                  {yearTabs}
                  {yearBlocks}
                  {!hasSemesters && (
                    <p className="m-0 text-[15px] font-medium text-ink-2">아직 학기가 없어요. 학기를 추가해 계획을 시작하세요.</p>
                  )}
                  {addSemesterButton}
                </section>

                {/* Course Catalog */}
                <aside
                  ref={courseCatalogRef}
                  data-export-ignore
                  aria-label="과목 리스트"
                  style={{ scrollMarginTop: '72px' }}
                  className={cn(
                    'order-first flex h-[560px] min-w-0 flex-col border-b border-line-2 pt-6 pb-6',
                    'xl:sticky xl:top-0 xl:order-none xl:h-auto xl:max-h-screen xl:max-w-[340px] xl:flex-[1_1_300px] xl:border-b-0 xl:border-l xl:border-line xl:pb-6 xl:pl-8',
                    isExporting && 'hidden'
                  )}
                >
                  {renderCatalog()}
                </aside>
              </div>
            ) : (
              <>
                <div aria-hidden="true" className="-mx-5 h-2.5 bg-fill" />

                {showMobileFocused && focusedSemester ? (
                  <section ref={semesterGridRef} aria-labelledby="m-sem" className="flex flex-col pt-2">
                    <div className="flex min-h-12 items-center justify-between gap-3 py-1">
                      <h2 id="m-sem" className="m-0 min-w-0 text-[16px] leading-6 font-bold text-ink">
                        {focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}
                        <SemesterMeta courses={focusedSemesterData?.courses ?? []} className={SEMESTER_META_WRAP_CLASS} />
                      </h2>
                      <button
                        type="button"
                        onClick={() => setMobileShowAll(true)}
                        className="-mr-1 inline-flex h-11 shrink-0 items-center gap-0.5 pl-2 text-[13px] font-semibold text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
                      >
                        전체 학기
                        <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                    {focusedSemesterData && (
                      <SemesterColumn
                        semester={focusedSemesterData}
                        isFocused
                        showHeader={false}
                        rowSize="tall"
                        onRemoveCourse={(courseId) => handleRemoveCourse(focusedSemesterData.year, focusedSemesterData.term, courseId)}
                        onDelete={() => handleDeleteSemester(focusedSemesterData.year, focusedSemesterData.term)}
                        onClear={() => handleClearSemester(focusedSemesterData.year, focusedSemesterData.term)}
                        onStatusChange={handleStatusChange}
                      />
                    )}
                    <button
                      ref={catalogSheetTriggerRef}
                      type="button"
                      onClick={() => setIsCatalogSheetOpen(true)}
                      aria-haspopup="dialog"
                      className="inline-flex h-[52px] items-center gap-1.5 self-start text-left text-[15px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
                    >
                      <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
                      과목 추가
                    </button>
                  </section>
                ) : (
                  <section ref={semesterGridRef} aria-labelledby="m-sem" className="flex flex-col gap-7 pt-2">
                    <div className="flex flex-col">
                      <div className="flex h-12 items-center justify-between gap-3">
                        <h2 id="m-sem" className="m-0 text-[16px] leading-6 font-bold text-ink">전체 학기</h2>
                        {focusedSemester && (
                          <button
                            type="button"
                            onClick={() => setMobileShowAll(false)}
                            className="-mr-1 h-11 shrink-0 pl-2 text-[13px] font-semibold text-primary transition-colors duration-150 ease-out hover:text-primary-hover"
                          >
                            {focusedSemester.year}학년 {focusedSemester.term === 'spring' ? '1학기' : '2학기'}로
                          </button>
                        )}
                      </div>
                      <p className="m-0 text-[13px] leading-[18px] text-ink-2">
                        학기 이름을 눌러 과목을 추가할 학기를 고르세요. 상태를 누르면 예정 ↔ 이수로 바뀌어요.
                      </p>
                    </div>
                    {yearTabs}
                    {yearBlocks}
                    {!hasSemesters && (
                      <p className="m-0 text-[15px] font-medium text-ink-2">아직 학기가 없어요. 학기를 추가해 계획을 시작하세요.</p>
                    )}
                    {addSemesterButton}
                  </section>
                )}

                {/* Course Catalog bottom sheet */}
                {isCatalogSheetShown && (
                  <>
                    <div
                      aria-hidden="true"
                      onClick={() => setIsCatalogSheetOpen(false)}
                      className={cn(
                        'fixed inset-0 z-50 bg-black/30 transition-opacity duration-200 ease-out',
                        activeDragData && 'opacity-0'
                      )}
                    />
                    <div
                      ref={courseCatalogRef}
                      role="dialog"
                      aria-modal="true"
                      aria-label="과목 리스트"
                      tabIndex={-1}
                      className="fixed inset-x-0 bottom-0 z-50 outline-none flex h-[85dvh] flex-col rounded-none border-t border-line-2 bg-white px-5 pt-5 pb-[max(16px,env(safe-area-inset-bottom))] shadow-float"
                    >
                      {renderCatalog(
                        <button
                          type="button"
                          onClick={() => setIsCatalogSheetOpen(false)}
                          className="-my-3 -mr-2 h-11 px-2 text-[14px] font-semibold text-ink transition-colors duration-150 ease-out hover:text-primary"
                        >
                          닫기
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <DragOverlay>
            {activeDragData ? (
              <div className="pointer-events-none w-[300px] max-w-[85vw]">
                <CourseCard
                  course={activeDragData.course as Record<string, unknown> & { code: string; name: string; credits: number }}
                  floating
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
