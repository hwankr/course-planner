// ReadOnlySemesterColumn props — adapted from src/components/features/ReadOnlySemesterColumn.tsx (documentation only, not type-checked).

/** Category keys the component knows; they drive the short chip label and its colors. A missing/empty value counts as 'free_elective' (자선) in both the chip and the header breakdown; any other non-empty string gets the 자선 chip but is omitted from the breakdown (its credits still count in the total). */
export type ReadOnlyCategoryKey =
  | 'major_required'    // 전핵 — red-100 / red-700
  | 'major_compulsory'  // 전필 — rose-100 / rose-700
  | 'major_elective'    // 전선 — orange-100 / orange-700
  | 'general_required'  // 교필 — blue-100 / blue-700
  | 'general_elective'  // 교선 — green-100 / green-700
  | 'teaching'          // 교직 — violet-100 / violet-700
  | 'free_elective';    // 자선 — gray-100 / gray-600

/** One course row (inline type in the source). */
export interface ReadOnlySemesterCourse {
  /** Course code, rendered as the gray-400 caption under the name. */
  code: string;
  /** Course name; truncated to one line. */
  name: string;
  /** Credit count rendered as `{credits}학점` and summed into the header total and breakdown. */
  credits: number;
  /** Category; typed as a plain string in the source. A missing/empty value counts as 'free_elective' (자선) in the chip and the breakdown; an unknown non-empty value gets the 자선 chip but is omitted from the header breakdown (its credits still count in `{totalCredits}학점`). */
  category?: string;
}

/** The semester the column renders (inline type in the source). */
export interface ReadOnlySemester {
  /** Academic year, rendered as `{year}학년`. */
  year: number;
  /** 'spring' renders 1학기; any other string renders 2학기. */
  term: string;
  /** Rows in display order; also the source of the credit total and course count. */
  courses: ReadOnlySemesterCourse[];
}

export interface ReadOnlySemesterColumnProps {
  /** The semester to render. */
  semester: ReadOnlySemester;
  /** Tighter padding and type (p-2, text-sm / text-xs) plus a collapsible list that starts collapsed with a 펼치기 button. Default false; the app never passes it. */
  compact?: boolean;
}
