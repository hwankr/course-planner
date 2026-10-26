// AdminList — pattern shapes adapted from src/app/(dashboard)/admin/page.tsx, admin/courses/page.tsx, admin/users/page.tsx and admin/departments/page.tsx. Documentation only; not type-checked.
// No component exists: each page owns this state and renders the markup inline. The unions are copied from src/types/index.ts.

/** Course category keys; the admin pages label and color them through CATEGORY_LABELS / CATEGORY_COLORS. */
export type RequirementCategory =
  | 'major_required'    // 전공핵심
  | 'major_compulsory'  // 전공필수
  | 'major_elective'    // 전공선택
  | 'general_required'  // 교양필수
  | 'general_elective'  // 교양선택
  | 'free_elective'     // 자유선택
  | 'teaching';         // 교직

/** Offered-semester keys, labelled 1학기 · 여름학기 · 2학기 · 겨울학기 by SEMESTER_LABELS. */
export type Semester = 'spring' | 'summer' | 'fall' | 'winter';

/** One entry of the dashboard's `adminMenus` const (six entries), rendered as a Link-wrapped menu Card. */
export interface AdminMenu {
  /** CardTitle text (text-lg), e.g. 과목 관리. */
  title: string;
  /** CardDescription text, e.g. 과목을 추가, 수정, 삭제합니다. */
  description: string;
  /** Link target under /admin, e.g. '/admin/courses'. */
  href: string;
}

/** `data.data` of GET /api/admin/stats?year=…; each count fills one stat Card (0 while undefined). */
export interface AdminStats {
  /** Shown in yu-navy under 공식 과목 ({selectedYear}). */
  courseCount: number;
  /** Shown in green-600 under 학과. */
  departmentCount: number;
  /** Shown in purple-600 under 사용자. */
  userCount: number;
  /** Shown in orange-600 under 수강 계획. */
  planCount: number;
}

/** Department reference embedded in a course row and listed in the 전체 학과 select. */
export interface DepartmentItem {
  /** Option value in the 전체 학과 select and the departmentFilter match key. */
  _id: string;
  /** Not rendered by the course row or the select. */
  code: string;
  /** Option label in the 전체 학과 select; first item of the course meta line. */
  name: string;
}

/** One courses-page row (GET /api/courses). */
export interface CourseItem {
  /** React key; deletingId compares against it to swap in the inline [삭제][취소] pair. */
  _id: string;
  /** Bold slate-800 lead of the title line. */
  code: string;
  /** Medium slate-700 text after the code. */
  name: string;
  /** Rendered as the slate-100 `{credits}학점` badge. */
  credits: number;
  /** Optional; its name opens the slate-400 meta line and the 전체 학과 filter matches on `_id`. */
  department?: DepartmentItem;
  /** Joined with ', ' through SEMESTER_LABELS in the meta line. */
  semesters: Semester[];
  /** Optional; drives the colored category badge; absent → no badge. */
  category?: RequirementCategory;
  /** Optional; meta line `{recommendedYear}학년 권장`. */
  recommendedYear?: number;
  /** Not rendered by the list. */
  recommendedSemester?: Semester;
  /** Not rendered by the list; prefills the edit form. */
  description?: string;
  /** Not rendered by the list. */
  isActive: boolean;
}

/** One departments-page row (GET /api/departments). */
export interface Department {
  /** React key; deleteConfirmId set to it opens the 학과 삭제 modal. */
  _id: string;
  /** blue-100 / blue-700 code pill. */
  code: string;
  /** Medium slate-900 name beside the pill. */
  name: string;
  /** Optional slate-400 caption under the name. */
  college?: string;
  /** Not rendered by the list. */
  isActive: boolean;
  /** Not rendered by the list. */
  createdAt: string;
  /** Not rendered by the list. */
  updatedAt: string;
}

/** One users-page row (GET /api/admin/users). */
export interface UserItem {
  /** React key; expandedUserId / deleteConfirmId compare against it. */
  _id: string;
  /** Medium slate-900, truncated. */
  name: string;
  /** First item of the slate-400 meta line. */
  email: string;
  /** Its name is the meta line's second item when set; '미설정' in the detail panel when absent. */
  department?: { _id: string; code: string; name: string };
  /** Meta line `{enrollmentYear}학번` when set. */
  enrollmentYear?: number;
  /** purple-100 / purple-700 pill when set. */
  studentId?: string;
  /** 'admin' → red-100/red-700 pill with Shield; 'student' → blue-100/blue-700 pill with User. */
  role: 'student' | 'admin';
  /** 'google' → yellow-100/yellow-700 'Google' pill; 'credentials' → gray-100/gray-700 '이메일'. */
  provider: 'credentials' | 'google';
  /** 마지막 접속 in the detail panel; '기록 없음' when absent. */
  lastLoginAt?: string;
  /** Last item of the meta line as a ko-KR date (e.g. 2025년 3월 2일); also 가입일 in the detail panel. */
  createdAt: string;
}

/** The page-level state the pattern reads; nothing is passed as props. */
export interface AdminListProps {
  /** Dashboard year select; default DEFAULT_CURRICULUM_YEAR (2026), options 2025 | 2026. */
  selectedYear: number;
  /** Dashboard counts; each value shows a slate-200 pulse bar while `isLoading`, and 0 when undefined after loading. */
  stats?: AdminStats;
  /** Dashboard menu Cards; the `adminMenus` const. */
  menus: AdminMenu[];
  /** Search text; courses placeholder 과목명 또는 코드 검색, users 이름 또는 이메일 검색..., departments 학과명 또는 코드로 검색.... Default ''. Non-empty shows the clear X (courses, departments). Named `searchTerm` on courses; users and departments name the state `search`. */
  searchTerm: string;
  /** Courses and users: selected department `_id`, '' = 전체 학과. Default ''. */
  departmentFilter: string;
  /** Courses: '' = 전체 카테고리. Default ''. */
  categoryFilter: RequirementCategory | '';
  /** Courses: curriculum year, default 2026. */
  yearFilter: number;
  /** Users: useState(''), typed string. Options '' (전체 역할) | 'student' (학생) | 'admin' (관리자). */
  roleFilter: string; // '' | 'student' | 'admin' (options)
  /** Users: useState('recent'), typed string. Options 'recent' (최근 가입순, default) | 'lastLogin' (최근 접속순) | 'name' (이름순). */
  sortOption: string; // 'recent' (default) | 'lastLogin' | 'name'
  /** Rows of the current page. */
  items: CourseItem[] | Department[] | UserItem[];
  /** Courses: the row whose Trash2 button is swapped for the inline [삭제][취소] pair. Default null. */
  deletingId: string | null;
  /** Departments: opens the 학과 삭제 modal; users: swaps the 사용자 삭제 button for the warning + [취소][삭제 확인] pair. Default null. */
  deleteConfirmId: string | null;
  /** Users: the row whose detail panel is expanded. Default null. */
  expandedUserId: string | null;
  /** TanStack Query flags: isLoading → pulse tiles; error → red-50 banner; neither and no rows → empty box. */
  isLoading: boolean;
  /** Truthy → red-50 error box. */
  error?: Error | null;
}

/** 전공핵심 · 전공필수 · 전공선택 · 교양필수 · 교양선택 · 자유선택 · 교직. */
export declare const CATEGORY_LABELS: Record<RequirementCategory, string>;
/** Tailwind pairs: red-100/red-700, orange-100/orange-700, blue-100/blue-700, green-100/green-700, teal-100/teal-700, gray-100/gray-700, purple-100/purple-700 (courses page map, not the planner aliases). */
export declare const CATEGORY_COLORS: Record<RequirementCategory, string>;
/** 1학기 · 여름학기 · 2학기 · 겨울학기. */
export declare const SEMESTER_LABELS: Record<Semester, string>;
/** The six dashboard menu entries. */
export declare const adminMenus: AdminMenu[];
