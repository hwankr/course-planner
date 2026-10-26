/**
 * FilterChips — documentation-only types for the filter-chip PATTERN: rows of toggle <button>s written
 * inline in five places (planner 학년 pills, CourseCatalog 학과 · 학년 · 학기 · 이수 chips, statistics gradient
 * chips, calendar pill chips, admin 개설 학기 toggles). No component exists in the source; these are the option
 * unions each page maps over, the local state it keeps (with its initial value), and a name for each recipe.
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

/** The five recipes, named by source; statistics has two sizes. Each member notes its CSS class. */
export type FilterChipRecipe =
  | 'planner-year' // .cp-filter-chips__chip--planner
  | 'catalog-category' // .cp-course-catalog__chip(--purple, --orange, --indigo, --emerald, --red…--gray); same box for the 학과, 학년, 학기 and 이수 rows
  | 'statistics-category' // .cp-filter-chips__chip--stat
  | 'statistics-semester' // .cp-filter-chips__chip--stat-sm
  | 'calendar-category' // .cp-calendar__chip(--all…--other)
  | 'admin-semester'; // .cp-filter-chips__chip--admin

/** The shape every recipe is built from: a local state value, an option list and a setter wired to onClick. */
export interface FilterChipsProps<TValue> {
  /** Options rendered in order; the first is the 전체 sentinel in every recipe except admin-semester and the catalog 학과 row. */
  options: ReadonlyArray<{ value: TValue; label: string }>;
  /** Current selection; a chip is active when `value === option.value` (admin: `value.includes(option.value)`). */
  value: TValue | TValue[];
  /** Called with the clicked option's value; statistics also resets `visibleCount` to 3. */
  onChange: (value: TValue) => void;
}

/** src/app/(dashboard)/planner/page.tsx */
export interface PlannerYearFilterState {
  /** null = 전체; set by a pill click, and by clicking a semester column (handleSemesterFocus) to that semester's year, whether the click focuses or unfocuses it. @default null */
  semesterYearFilter: number | null;
  /** Pill options after 전체: `Array.from(semestersByYear.keys()).sort()`; the row renders only when the map is non-empty. */
  years: number[];
}

/** src/components/features/CourseCatalog.tsx */
export interface CatalogCategoryFilterState {
  /** undefined = 전체. @default undefined */
  categoryFilter: RequirementCategory | undefined;
  /** Categories present in the fetched courses, in fixed order; the only chips rendered after 전체. The row is hidden on the 공통 tab and while the catalog is collapsed (접기). */
  usedCategories: RequirementCategory[];
}

/** src/components/features/CourseCatalog.tsx — the 학과 row and the 학년 | 학기 row above 이수 (same chip box) */
export interface CatalogDeptYearSemesterFilterState {
  /** 내 학과/주전공 (yu-navy, only with userDepartment), 복수전공 (purple) or 부전공 (orange) when a secondary department is set and majorType !== 'single', 공통 (indigo). @default userDepartment ? 'primary' : 'common' */
  deptFilter: 'primary' | 'secondary' | 'common';
  /** undefined = 전체; options [undefined, 1, 2, 3, 4, 5, 6] (yu-navy). Reset to undefined on the 공통 tab, where the row is hidden. @default undefined */
  yearFilter: number | undefined;
  /** undefined = 전체; options [undefined, 'spring', 'fall'] (emerald). Reset to undefined on the 공통 tab, where the row is hidden. @default undefined */
  semesterFilter: Semester | undefined;
}

/** src/app/(dashboard)/statistics/page.tsx */
export interface StatisticsFilterState {
  /** 'all' = 전체 (a separate first button); one chip per CATEGORY_LABELS key. @default 'all' */
  selectedCategory: 'all' | RequirementCategory;
  /** 'all' = 전체 학기, otherwise `${year}-${Term}`. @default 'all' */
  selectedSemester: 'all' | string;
  /** Built from courseStats[].semesters and semesterDistribution; label `${year}학년 ${1|2}학기`. */
  semesterOptions: Array<{ value: 'all' | string; label: string }>;
}

/** src/app/(dashboard)/calendar/page.tsx */
export interface CalendarCategoryFilterState {
  /** 'all' = 전체 (blue-600, a separate first button); a category value paints the chip with that category's colors. @default 'all' */
  selectedCategory: AcademicEventCategory | 'all';
}

/** src/app/(dashboard)/admin/courses/page.tsx — multi-select inside CourseFormData */
export interface AdminSemesterToggleState {
  /** Active chips; submit shows a warning toast while empty. @default [] (EMPTY_FORM; edit: [...course.semesters]) */
  semesters: Semester[];
  /** Adds the semester if absent, removes it if present. */
  toggleSemester: (sem: Semester) => void;
}
