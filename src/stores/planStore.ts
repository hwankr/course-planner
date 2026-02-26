/**
 * Plan Store (Course Planning State)
 * 드래그앤드롭 및 실시간 UI 업데이트를 위한 클라이언트 상태
 */

import { create } from 'zustand';
import type { Term } from '@/types';

interface PlannedCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching';
  status: 'planned' | 'enrolled' | 'completed' | 'failed';
}

interface Semester {
  year: number;
  term: Term;
  courses: PlannedCourse[];
}

interface Plan {
  id: string;
  semesters: Semester[];
}

interface PlanState {
  activePlan: Plan | null;
  isLoading: boolean;
  focusedSemester: { year: number; term: Term } | null;
  isExporting: boolean;

  // Actions
  setActivePlan: (plan: Plan | null) => void;
  setLoading: (loading: boolean) => void;
  setFocusedSemester: (semester: { year: number; term: Term } | null) => void;
  toggleFocusedSemester: (year: number, term: Term) => void;
  setIsExporting: (exporting: boolean) => void;

  // Optimistic updates (for drag & drop)
  addCourseToSemester: (
    year: number,
    term: Term,
    course: PlannedCourse
  ) => void;
  removeCourseFromSemester: (
    year: number,
    term: Term,
    courseId: string
  ) => void;
  clearSemester: (year: number, term: Term) => void;
  moveCourse: (
    sourceYear: number,
    sourceTerm: Term,
    destYear: number,
    destTerm: Term,
    courseId: string
  ) => void;
  updateCourseStatus: (
    year: number,
    term: Term,
    courseId: string,
    status: 'planned' | 'enrolled' | 'completed' | 'failed'
  ) => void;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  activePlan: null,
  isLoading: false,
  focusedSemester: null,
  isExporting: false,

  setActivePlan: (plan) => set({ activePlan: plan }),
  setLoading: (isLoading) => set({ isLoading }),
  setFocusedSemester: (semester) => set({ focusedSemester: semester }),
  setIsExporting: (isExporting) => set({ isExporting }),
  toggleFocusedSemester: (year, term) => {
    const { focusedSemester } = get();
    if (focusedSemester?.year === year && focusedSemester?.term === term) {
      set({ focusedSemester: null });
    } else {
      set({ focusedSemester: { year, term } });
    }
  },

  addCourseToSemester: (year, term, course) => {
    const { activePlan } = get();
    if (!activePlan) return;

    // Duplicate guard: skip if course already exists in any semester
    const alreadyInPlan = activePlan.semesters.some(sem =>
      sem.courses.some(c => c.id === course.id)
    );
    if (alreadyInPlan) return;

    const updatedPlan = { ...activePlan };
    let semester = updatedPlan.semesters.find(
      (s) => s.year === year && s.term === term
    );

    if (!semester) {
      semester = { year, term, courses: [] };
      updatedPlan.semesters.push(semester);
      updatedPlan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.term === 'spring' ? -1 : 1;
      });
    }

    semester.courses.push(course);
    set({ activePlan: updatedPlan });
  },

  removeCourseFromSemester: (year, term, courseId) => {
    const { activePlan } = get();
    if (!activePlan) return;

    const updatedPlan = { ...activePlan };
    const semester = updatedPlan.semesters.find(
      (s) => s.year === year && s.term === term
    );

    if (semester) {
      semester.courses = semester.courses.filter((c) => c.id !== courseId);
      set({ activePlan: updatedPlan });
    }
  },

  clearSemester: (year, term) => {
    const { activePlan } = get();
    if (!activePlan) return;

    const updatedPlan = { ...activePlan };
    const semester = updatedPlan.semesters.find(
      (s) => s.year === year && s.term === term
    );

    if (semester) {
      semester.courses = [];
      set({ activePlan: updatedPlan });
    }
  },

  moveCourse: (sourceYear, sourceTerm, destYear, destTerm, courseId) => {
    const { activePlan } = get();
    if (!activePlan) return;

    const updatedPlan = { ...activePlan };

    // Find source semester and course
    const sourceSemester = updatedPlan.semesters.find(
      (s) => s.year === sourceYear && s.term === sourceTerm
    );
    if (!sourceSemester) return;

    const courseIndex = sourceSemester.courses.findIndex(
      (c) => c.id === courseId
    );
    if (courseIndex === -1) return;

    const [course] = sourceSemester.courses.splice(courseIndex, 1);

    // Find or create destination semester
    let destSemester = updatedPlan.semesters.find(
      (s) => s.year === destYear && s.term === destTerm
    );

    if (!destSemester) {
      destSemester = { year: destYear, term: destTerm, courses: [] };
      updatedPlan.semesters.push(destSemester);
      updatedPlan.semesters.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.term === 'spring' ? -1 : 1;
      });
    }

    destSemester.courses.push(course);
    set({ activePlan: updatedPlan });
  },

  updateCourseStatus: (year, term, courseId, status) => {
    const { activePlan } = get();
    if (!activePlan) return;

    const updatedPlan = { ...activePlan };
    const semester = updatedPlan.semesters.find(
      (s) => s.year === year && s.term === term
    );
    if (!semester) return;

    const course = semester.courses.find((c) => c.id === courseId);
    if (!course) return;

    course.status = status;
    set({ activePlan: updatedPlan });
  },
}));
