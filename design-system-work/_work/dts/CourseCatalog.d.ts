// CourseCatalog props — adapted from src/components/features/CourseCatalog.tsx (documentation only, not type-checked).

import type { Types } from 'mongoose';

/** Requirement category (src/types/index.ts); drives chip, badge and quick-add colors. */
export type RequirementCategory =
  | 'major_required'    // 전공핵심 · 전핵
  | 'major_compulsory'  // 전공필수 · 전필
  | 'major_elective'    // 전공선택 · 전선
  | 'general_required'  // 교양필수 · 교필
  | 'general_elective'  // 교양선택 · 교선
  | 'free_elective'     // 자유선택 · 자선
  | 'teaching';         // 교직

/** Semester enum (src/types/index.ts); the catalog only filters and groups on 'spring' (1학기) and 'fall' (2학기). */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** Course document as served by the API (src/types/index.ts). */
export interface ICourse {
  /** Mongo id; stringified for planCourseIds and the dnd-kit id `catalog-{id}`. */
  _id: Types.ObjectId;
  /** Course code; matched by the search box, never rendered. */
  code: string;
  /** Course name; one line, truncated. */
  name: string;
  /** Rendered as `{credits}학점`. */
  credits: number;
  /** Owning department. */
  department?: Types.ObjectId;
  /** Prerequisite course ids (unused here). */
  prerequisites: Types.ObjectId[];
  /** Free-text description (unused here). */
  description?: string;
  /** Semesters the course is offered (unused here). */
  semesters: Semester[];
  /** Category badge / chip; missing or unknown falls back to gray. */
  category?: RequirementCategory;
  /** Recommended year; with recommendedSemester it places the course in a grouped column, otherwise under 기타. */
  recommendedYear?: number;
  /** Recommended semester ('spring' → 1학기, 'fall' → 2학기). */
  recommendedSemester?: Semester;
  /** Set for user-created courses → the 커스텀 tag / ribbon. */
  createdBy?: Types.ObjectId;
  /** Soft-delete flag (unused here). */
  isActive: boolean;
  /** Timestamps (unused here). */
  createdAt: Date;
  updatedAt: Date;
}

/** Payload handed to onClickAdd for both catalog items and quick-add tiles. */
export interface CatalogAddData {
  /** Course code (quick-add generates `PLH-{initials}-{base36 timestamp}`). */
  code: string;
  /** Course name (quick-add: `{카테고리} {n}학점`). */
  name: string;
  /** Credits. */
  credits: number;
  /** Category when known. */
  category?: RequirementCategory;
  /** Department the item was listed under; undefined for quick-add courses. */
  departmentId?: string;
}

/** Semester the planner has focused; switches on the focus banner and the add buttons. */
export interface FocusedSemester {
  /** Academic year (1-based). */
  year: number;
  /** 'spring' renders 1학기, anything else 2학기. */
  term: string;
}

export interface CourseCatalogProps {
  /** Ids of courses already in the plan: rendered as 추가됨 at opacity 0.5 with dragging and the add button disabled. */
  planCourseIds: string[];
  /** Called by the row/card add buttons and the quick-add tiles; without it no add button renders. */
  onClickAdd?: (courseId: string, courseData: CatalogAddData) => void;
  /** Focused semester; null/undefined hides the focus banner and the add buttons. */
  focusedSemester?: FocusedSemester | null;
  /** While true every add button is disabled and gray (card view shows "..."). Default false. */
  isAddingCourse?: boolean;
}

/** Card or single-line rows; the panel defaults to 'list'. */
export type CatalogViewMode = 'card' | 'list';

/** Which department tab is active; 'common' shows the quick-add grid instead of courses. */
export type CatalogDeptFilter = 'primary' | 'secondary' | 'common';

/** Internal draggable item (not exported by the source); listed for the anatomy. */
export interface CatalogCourseItemProps {
  /** The course to render. */
  course: ICourse;
  /** True when the id is in planCourseIds. */
  isInPlan: boolean;
  /** 'list' → row with short badge; 'card' → CourseCard with ribbons. */
  viewMode: CatalogViewMode;
  /** Passed through from the panel. */
  focusedSemester: FocusedSemester | null | undefined;
  /** Passed through from the panel. */
  isAddingCourse: boolean;
  /** Passed through from the panel. */
  onClickAdd?: (courseId: string, data: CatalogAddData) => void;
  /** Department the item is listed under; forwarded in the dnd data and onClickAdd payload. */
  departmentId?: string;
  /** Adds the 복수/부전 badge (secondary) or the 공통 badge/ribbon (common). */
  deptFilter: CatalogDeptFilter;
  /** 'double' → 복수(전공) purple, otherwise 부전(공) orange. */
  majorType: string;
  /** Extra classes on the wrapper (the flat card-grid width classes). */
  className?: string;
}

/** One grouped-view column. */
export interface CourseGroup {
  /** Recommended year; 99 for the trailing 기타 group. */
  year: number;
  /** Column semester. */
  semester: 'spring' | 'fall';
  /** Header text: `{year}학년 {1학기|2학기}` or `기타`. */
  label: string;
  /** Courses in the column. */
  courses: ICourse[];
  /** Sum of credits, rendered as `{n}과목 · {n}학점`. */
  totalCredits: number;
}

/** Quick-add tile definition (COMMON_QUICK_ADD_CATEGORIES). */
export interface QuickAddCategory {
  /** Category created for the placeholder course. */
  key: RequirementCategory;
  /** Tile title: 교양필수 | 교양선택 | 자유선택 | 교직. */
  label: string;
  /** Code prefix: PLH-GR | PLH-GE | PLH-FE | PLH-TC. */
  codePrefix: string;
  /** Tailwind classes for the credit buttons and tile: bg-{hue}-500, hover:bg-{hue}-600, border-{hue}-200, text-{hue}-700, bg-{hue}-50. */
  bgColor: string;
  hoverColor: string;
  borderColor: string;
  textColor: string;
  lightBg: string;
}
