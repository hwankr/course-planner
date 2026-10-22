/**
 * PageHeader — documentation-only types for the page-header PATTERN (title block and actions written
 * inline at the top of each dashboard page). No component exists in the source; these are the values
 * each page's JSX reads, plus the recipe names used by the stylesheet.
 */

/** Which page's header the markup follows. 'planner-export' is the compact duplicate rendered only while isExporting. */
export type PageHeaderRecipe = 'planner' | 'planner-export' | 'statistics' | 'admin';

/** MajorType from src/types — chooses the second badge: 'double' → 복수전공 (purple), 'minor' → 부전공 (orange), 'single' → none. */
export type PageHeaderMajorType = 'single' | 'double' | 'minor';

/** src/app/(dashboard)/planner/page.tsx — values the header JSX reads (session + useDepartments() for members, useGuestProfileStore for guests). */
export interface PlannerPageHeaderProps {
  /** Primary department badge (yu-navy-a10 / yu-navy); when undefined the 학과를 설정해주세요 link to /profile renders instead. */
  departmentName?: string;
  /** session.user.majorType || 'single' for members, the guest store's majorType for guests. */
  headerMajorType: PageHeaderMajorType;
  /** Text after 복수전공: / 부전공:; the second badge renders only when this and a non-'single' majorType are set. */
  secondaryDepartmentName?: string;
  /** activePlan.semesters.length > 0 — shows 내보내기 and 초기화; the actions row itself always renders. */
  hasSemesters: boolean;
  /** Opens the PNG 이미지 / PDF 문서 menu under 내보내기; closed on outside mousedown / touchstart. */
  showExportMenu: boolean;
  /** Disables 내보내기, swaps its label for the gray-600 arc + 내보내는 중..., and renders the export-only header into the capture. */
  isExporting: boolean;
  /** resetPlanMutation.isPending → Button isLoading on 초기화 (spinner + 로딩중..., disabled). */
  isResetting: boolean;
  /** Guests pressing 내보내기 get the Toast 로그인 후 이용할 수 있는 기능입니다. instead of the menu. */
  isGuest: boolean;
  /** PNG 이미지 menu item. */
  onExportPng: () => void;
  /** PDF 문서 menu item. */
  onExportPdf: () => void;
  /** 초기화 — asks window.confirm('모든 학기와 과목이 삭제됩니다. 계획을 초기화하시겠습니까?') first. */
  onReset: () => void;
}

/** src/app/(dashboard)/statistics/page.tsx — fields of stats (useDepartmentStats().data.data) the header reads. */
export interface StatisticsPageHeaderProps {
  /** Lead line: `${departmentName} 학생들이 많이 듣는 과목`. */
  departmentName: string;
  /** Meta line: `${totalStudents}명의 학생 데이터 기반`. */
  totalStudents: number;
  /** ISO date; rendered as `${formatRelativeTime(new Date(updatedAt))} 갱신`. */
  updatedAt: string;
}

/** src/app/(dashboard)/admin/courses/page.tsx — the back link, title row and create button. */
export interface AdminPageHeaderProps {
  /** Back link target; the label is 관리자 대시보드로 돌아가기 with a lucide ArrowLeft. */
  backHref: '/admin';
  /** Page title (과목 관리). */
  title: string;
  /** Record count shown as `등록된 과목을 관리합니다. (${count}건)`. */
  count: number;
  /** openCreateForm — the yu-cyan 과목 추가 button with a lucide Plus. */
  onCreate: () => void;
}

export interface PageHeaderProps {
  /** Recipe to render. */
  recipe: PageHeaderRecipe;
  /** Planner data when recipe is 'planner' or 'planner-export' (the export variant uses only the badge fields). */
  planner?: PlannerPageHeaderProps;
  /** Statistics data when recipe is 'statistics'. */
  statistics?: StatisticsPageHeaderProps;
  /** Admin data when recipe is 'admin'. */
  admin?: AdminPageHeaderProps;
}
