// CourseCard props — adapted from src/components/features/CourseCard.tsx (documentation only, not type-checked).

import type { Types } from 'mongoose';

/** Course status enum shared by the card surface, the default-mode label and the compact pill. */
export type CourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** Requirement category; drives the category chip label and colors. */
export type CourseCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** The course object the card renders (inline type in the source). */
export interface CourseCardCourse {
  /** Mongo id from the API (catalog items). */
  _id?: Types.ObjectId | string;
  /** Plan-side id (courses inside a semester). */
  id?: string;
  /** Course code — accepted but never rendered by CourseCard. */
  code: string;
  /** Course name; truncated to one line. */
  name: string;
  /** Credit count rendered as `{credits}학점`. */
  credits: number;
  /** Category chip; chip is hidden when missing or unknown. */
  category?: CourseCategory;
  /** Status; undefined falls back to 'planned' for the surface and hides the default-mode status pill. */
  status?: CourseStatus;
}

export interface CourseCardProps {
  /** The course to render. */
  course: CourseCardCourse;
  /** Position in the semester list; accepted for SemesterColumn, unused in render. */
  index?: number;
  /** Shows the remove X when set (and isDragDisabled is false); called on click with propagation stopped. */
  onRemove?: () => void;
  /** Enables the status toggle (default: outlined pill; compact: filled pill). Toggles completed <-> planned; other statuses go to completed. */
  onStatusChange?: (courseId: string, newStatus: CourseStatus) => void;
  /** Catalog item already in the plan: opacity-60, cursor-not-allowed, remove X hidden. No declared default (undefined is falsy). */
  isDragDisabled?: boolean;
  /** Single-line condensed layout with the 9px filled status pill. Default false. */
  compact?: boolean;
  /** Department chip text; '복수전공' is purple, '부전공' is orange, anything else gray. */
  departmentLabel?: string;
}

/** Base surface the card wraps (src/components/ui/Card.tsx): a plain div; className is merged with twMerge. */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;
