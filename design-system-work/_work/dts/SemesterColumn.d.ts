// SemesterColumn — props adapted from src/components/features/SemesterColumn.tsx (documentation only, not type-checked).

/** Semester term; renders as 1학기 (spring) or 2학기 (fall). */
export type SemesterTerm = 'spring' | 'fall';

/** Course status; drives the row surface tint and the compact status pill. */
export type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** Requirement category; drives the category chip and the header breakdown (전핵 · 전필 · 전선 · 교필 · 교선 · 교직 · 자선). */
export type CourseCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** One course inside a semester (the plan's shape, not the catalog's). */
export interface SemesterCourse {
  /** Plan-side id; also the dnd-kit draggable id. */
  id: string;
  /** Course code (not rendered by the column itself). */
  code: string;
  /** Course name, truncated in the row. */
  name: string;
  /** Credit count, summed into the header total and breakdown. */
  credits: number;
  /** Category; missing counts as free_elective in the breakdown. */
  category?: CourseCategory;
  /** Required here (optional on CourseCard). */
  status: CourseStatus;
}

export interface SemesterColumnProps {
  /** The semester to render; droppable id is `semester-${year}-${term}`. */
  semester: {
    /** Academic year, rendered as `{year}학년`. */
    year: number;
    /** Term, rendered as 1학기 / 2학기. */
    term: SemesterTerm;
    /** Courses in this semester, in display order. */
    courses: SemesterCourse[];
  };
  /** Called with the course id when a row's 과목 제거 button is clicked. */
  onRemoveCourse: (courseId: string) => void;
  /** When given, shows the 학기 삭제 icon button (confirms first if the semester has courses). */
  onDelete?: () => void;
  /** When given and the semester has courses, shows the 학기 초기화 icon button (always confirms). */
  onClear?: () => void;
  /** Cyan ring + border, navy-tinted header, Focus badge and the focused empty-state copy. Default false. */
  isFocused?: boolean;
  /** Fired when the header is clicked. */
  onFocus?: () => void;
  /** Dense mode: p-2, text-sm title, min-height 180px, 4 visible rows with +N개 더 보기 / 접기. Default false. */
  compact?: boolean;
  /** Passed through to each row's status pill (planned <-> completed toggle). */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}

/** Internal (not exported by the source, nor from this file): the dnd-kit draggable wrapper around each compact CourseCard. Documentation only. */
interface DraggableSemesterCourseProps {
  /** The course to render. */
  course: SemesterCourse;
  /** Position in the visible list. */
  index: number;
  /** Mirrors the column's compact flag. */
  compact: boolean;
  /** The parent droppable id, stored in the drag data. */
  containerId: string;
  /** Row-level remove handler (already bound to the course id). */
  onRemove: () => void;
  /** Status toggle handler passed through from the column. */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
}
