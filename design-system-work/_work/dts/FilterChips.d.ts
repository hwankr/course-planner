/**
 * FilterChips — documentation-only types for the filter-chip PATTERN: rows of toggle <button>s written
 * inline in five places (planner 학년 pills, CourseCatalog 이수 chips, statistics gradient chips, calendar
 * pill chips, admin 개설 학기 toggles). No component exists in the source; these are the option unions
 * each page maps over, the local state it keeps, and the recipe names used by the stylesheet.
 */

/** src/types/index.ts — the seven 이수구분 values (labels: 전공핵심 전공필수 전공선택 교양필수 교양선택 자유선택 교직). */
export type RequirementCategory =
  | 'major_required'
  | 'major_compulsory'
  | 'major_elective'
  | 'general_required'
  | 'general_elective'
  | 'free_elective'
  | 'teaching';

/** src/types/index.ts — admin 개설 학기 options (labels: 1학기 여름학기 2학기 겨울학기). */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** src/types/index.ts — the two planner terms (statistics semester values are `${year}-${Term}`). */
export type Term = 'spring' | 'fall';

/** src/types/index.ts — calendar categories (labels: 학사 수강신청 시험 공휴일 기타). */
export type AcademicEventCategory = 'academic' | 'registration' | 'exam' | 'holiday' | 'other';

/** The five recipes, named by source; statistics has two sizes. */
export type FilterChipRecipe =
  | 'planner-year'
  | 'catalog-category'
  | 'statistics-category'
  | 'statistics-semester'
  | 'calendar-category'
  | 'admin-semester';

/** The shape every recipe is built from: a local state value, an option list and a setter wired to onClick. */
export interface FilterChipsProps<TValue> {
  /** Options rendered in order; the first is the 전체 sentinel in every recipe except admin-semester. */
  options: ReadonlyArray<{ value: TValue; label: string }>;
  /** Current selection; a chip is active when `value === option.value` (admin: `value.includes(option.value)`). */
  value: TValue | TValue[];
  /** Called with the clicked option's value; statistics also resets `visibleCount` to 3. */
  onChange: (value: TValue) => void;
}

/** src/app/(dashboard)/planner/page.tsx */
export interface PlannerYearFilterState {
  /** null = 전체; set by a pill click and by handleSemesterFocus to the focused semester's year. */
  semesterYearFilter: number | null;
  /** Pill options after 전체: `Array.from(semestersByYear.keys()).sort()`; the row renders only when the map is non-empty. */
  years: number[];
}

/** src/components/features/CourseCatalog.tsx */
export interface CatalogCategoryFilterState {
  /** undefined = 전체. */
  categoryFilter: RequirementCategory | undefined;
  /** Categories present in the fetched courses, in fixed order; the only chips rendered after 전체. Hidden on the 공통 tab. */
  usedCategories: RequirementCategory[];
}

/** src/app/(dashboard)/statistics/page.tsx */
export interface StatisticsFilterState {
  /** 'all' = 전체; one chip per CATEGORY_LABELS key. */
  selectedCategory: 'all' | RequirementCategory;
  /** 'all' = 전체 학기, otherwise `${year}-${Term}`. */
  selectedSemester: 'all' | string;
  /** Built from courseStats[].semesters and semesterDistribution; label `${year}학년 ${1|2}학기`. */
  semesterOptions: Array<{ value: 'all' | string; label: string }>;
}

/** src/app/(dashboard)/calendar/page.tsx */
export interface CalendarCategoryFilterState {
  /** 'all' = 전체 (blue-600); a category value paints the chip with that category's colors. */
  selectedCategory: AcademicEventCategory | 'all';
}

/** src/app/(dashboard)/admin/courses/page.tsx — multi-select inside CourseFormData */
export interface AdminSemesterToggleState {
  /** Active chips; submit shows a warning toast while empty. */
  semesters: Semester[];
  /** Adds the semester if absent, removes it if present. */
  toggleSemester: (sem: Semester) => void;
}
