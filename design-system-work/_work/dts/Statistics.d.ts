// Statistics — pattern from src/app/(dashboard)/statistics/page.tsx (documentation only, not type-checked).
// The page's default export is a Next.js client component with no props; the shapes below are what the three
// data-view Cards and the guest CTA pair render, copied from src/types/index.ts and the page's module constants.

/** Requirement category keys (src/types/index.ts). */
export type RequirementCategory =
  | 'major_required'    // 전공핵심
  | 'major_compulsory'  // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective'     // 자유선택
  | 'teaching';         // 교직

/** One ranking row (src/types/index.ts CourseStat). */
export interface CourseStat {
  /** Mongo id; the React key of the row. */
  courseId: string;
  /** Course code, rendered before " · {credits}학점". */
  code: string;
  /** Course name — the truncating <h3>. */
  name: string;
  /** Credits, rendered as "{credits}학점". */
  credits: number;
  /** A RequirementCategory key (typed string in the source); indexes CATEGORY_LABELS and CATEGORY_COLORS for the badge. */
  category: string;
  /** Distinct students who planned the course — rendered as "({studentCount}명)". */
  studentCount: number;
  /** studentCount / totalStudents × 100 — the bar width (style width: `${percentage}%`) and the "{percentage.toFixed(1)}%" label. */
  percentage: number;
  /** Semesters the course appears in; feeds the semester filter only. */
  semesters: Array<{ year: number; term: string }>;
}

/** One stat tile (src/types/index.ts SemesterDistribution). */
export interface SemesterDistribution {
  /** Academic year, rendered as "{year}학년". */
  year: number;
  /** 'spring' renders 1학기; anything else renders 2학기. */
  term: string;
  /** Rendered as "{avgCourses.toFixed(1)}과목". */
  avgCourses: number;
  /** Rendered as "{avgCredits.toFixed(1)}학점". */
  avgCredits: number;
}

/** The useDepartmentStats payload (src/types/index.ts DepartmentCourseStats). */
export interface DepartmentCourseStats {
  /** Department id the stats were computed for. */
  departmentId: string;
  /** Used in the page header and info banner, not inside these Cards. */
  departmentName: string;
  /** "{totalStudents}명 중 …" in the ranking subtitle. */
  totalStudents: number;
  /** ISO date; formatted by formatRelativeTime in the page header. */
  updatedAt: string;
  /** Ranked rows; filtered by category and semester, then sliced to visibleCount. */
  courseStats: CourseStat[];
  /** One tile per semester. */
  semesterDistribution: SemesterDistribution[];
}

/** One plan tile (src/types/index.ts AnonymousPlanSummary); from useAnonymousPlans(departmentId, 1, 3, !isGuest). */
export interface AnonymousPlanSummary {
  /** Opaque id; the React key and the AnonymousPlanModal target. */
  anonymousId: string;
  /** Rendered as "{totalCredits}학점". */
  totalCredits: number;
  /** Rendered as "{totalCourses}개 과목". */
  totalCourses: number;
  /** Rendered as "{semesterCount}개 학기". */
  semesterCount: number;
}

/** Values the pattern renders, as the page derives them in render; StatisticsPage itself takes no props. */
export interface StatisticsProps {
  /** Department statistics; null, loading and error fall to the page-level states, not this pattern. */
  stats: DepartmentCourseStats;
  /** courseStats after the category and semester filters; rank = index + 1 within this list. */
  filteredCourses: CourseStat[];
  /** Rows shown: starts at 3, +5 per 더보기, back to 3 on 접기 or any filter change. */
  visibleCount: number;
  /** max(0, filteredCourses.length − visibleCount): "{remainingCount}개 더보기" while > 0, otherwise 접기. */
  remainingCount: number;
  /** Guest mode: swaps the plan grid for the locked message and the CTA pair. */
  isGuest: boolean;
  /** First page (3) of anonymous plans and the total; undefined while loading. Member variant only. */
  plansData?: { plans: AnonymousPlanSummary[]; total: number };
  /** Shows the centered Loader2 in place of the plan grid. */
  plansLoading: boolean;
  /** 구글로 로그인 handler from useAuth(). */
  loginWithGoogle: () => void;
  /** Plan tile click: opens AnonymousPlanModal for that id. */
  onSelectPlan: (anonymousId: string) => void;
  /** 전체 {total}개 수강계획 보기: opens AllPlansModal (the button renders only when total > 3). */
  onOpenAllPlans: () => void;
}

/** Badge text per category — a module constant in the page. */
export declare const CATEGORY_LABELS: Record<RequirementCategory, string>;
/** Badge Tailwind classes per category, e.g. 'bg-red-100 text-red-700' — a module constant in the page. */
export declare const CATEGORY_COLORS: Record<RequirementCategory, string>;

/** The page's default export: a client component with no props and no ref. */
export declare function StatisticsPage(): JSX.Element;
