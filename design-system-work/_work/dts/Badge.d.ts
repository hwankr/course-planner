/**
 * Badge — documentation-only types for the badge/pill PATTERN: inline <span>/<div>/<p> recipes the pages repeat
 * without a component. No component exists in the source; these are the values each page's JSX reads to pick a
 * recipe, plus the modifier names used by the stylesheet (.cp-badge--<recipe>). Recipes another card already styles
 * keep that card's classes (named in each interface below) and are not .cp-badge modifiers.
 */

/** Every .cp-badge recipe, named by what it labels in the source. */
export type BadgeRecipe =
  | 'admin' | 'student'                       // admin/users role (font-semibold, Shield / User h-3 w-3)
  | 'draft' | 'published'                     // admin/patch-notes status (font-semibold, no icon)
  | 'google' | 'email'                        // admin/users sign-in provider (font-medium)
  | 'student-id' | 'dept-code'                // identity: 학번 (font-medium) · department code (font-semibold)
  | 'mini'                                    // admin/users plan rows (text-[10px] inline), combined with a PlanCourseStatus
  | 'legend';                                 // planner/page.tsx 예정 ↔ 이수 legend (rounded 4px), combined with 'planned' | 'completed'

/** src/app/(dashboard)/admin/users/page.tsx — UserItem fields that choose the three badges on a user row. */
export interface UserRowBadgesProps {
  /** 'admin' → 관리자 (red-100 / red-700, Shield); 'student' → 학생 (blue-100 / blue-700, User). */
  role: 'student' | 'admin';
  /** 'google' → Google (yellow-100 / yellow-700); 'credentials' → 이메일 (gray-100 / gray-700). */
  provider: 'credentials' | 'google';
  /** When set, rendered as the purple 학번 badge before the role badge. */
  studentId?: string;
}

/** Status of a course inside a plan (PlanCourse.status); drives the 10px pill in the expanded 수강 계획표. */
export type PlanCourseStatus = 'planned' | 'enrolled' | 'completed' | 'failed';

/** src/app/(dashboard)/admin/users/page.tsx — getStatusLabel / getStatusColor for one course row. */
export interface PlanStatusMiniBadgeProps {
  /** 'completed' → 이수 (green) · 'enrolled' → 수강중 (blue) · 'failed' → 미이수 (red) · 'planned' and anything else → 계획 (slate). */
  status: PlanCourseStatus;
}

/** admin/feedback reads FeedbackStatus = 'pending' | 'resolved' (STATUS_LABELS); help/feedback reads MyFeedbackItem.status: 'pending' | 'resolved' with an inline label ternary. Styled by FeedbackCard's .cp-feedback-card__status--pending / --resolved (관리자 답변: .cp-feedback-card__reply-pill). */
export interface FeedbackStatusBadgeProps {
  /** 'pending' → 대기중 with Clock (yellow-100 / yellow-700); 'resolved' → 해결됨 with CheckCircle (green-100 / green-700). */
  status: 'pending' | 'resolved';
}

/** src/app/(dashboard)/admin/patch-notes/page.tsx — PatchNoteStatus from src/types, labelled by STATUS_LABELS / STATUS_COLORS. */
export interface PatchNoteStatusBadgeProps {
  /** 'draft' → 초안 (yellow-100 / yellow-700); 'published' → 발행됨 (green-100 / green-700). */
  status: 'draft' | 'published';
  /** Optional version string (e.g. v1.0.0) rendered as the blue px-2 badge before the status (PatchNotes .cp-patch-notes__version). */
  version?: string;
}

/** src/app/(dashboard)/planner/page.tsx — values the header badge row reads (session + useDepartments, or the guest profile store). Styled by PageHeader's .cp-page-header__badge--department / --double / --minor. */
export interface PlannerHeaderBadgesProps {
  /** Primary badge text (yu-navy-a10 / yu-navy); when undefined the 학과를 설정해주세요 link renders instead. */
  departmentName?: string;
  /** 'double' → 복수전공: … (purple-100 / purple-700) · 'minor' → 부전공: … (orange-100 / orange-700) · 'single' → no second badge. */
  headerMajorType: 'single' | 'double' | 'minor';
  /** Text after the 복수전공: / 부전공: prefix; the second badge renders when headerMajorType !== 'single' and this is set; in the main header departmentName must also be set (the export header does not check it). */
  secondaryDepartmentName?: string;
}

/** Color pair of an eyebrow pill: HelpSection .cp-help__eyebrow (slate) / --navy, FeedbackCard .cp-feedback-card__eyebrow--cyan / --purple. */
export type EyebrowTone =
  | 'slate'   // bg-slate-100 text-slate-700 — 도움말 가이드, Contact, STEP 1 / STEP 2
  | 'cyan'    // bg-[#00AACA]/10 text-[#00AACA] — 빠른 문의
  | 'purple'  // bg-purple-50 text-purple-600 — 내 문의 내역
  | 'navy';   // bg-[#153974]/5 text-[#153974] — 졸업 정보 가이드

/** src/app/(dashboard)/help/page.tsx, help/feedback/page.tsx, help/graduation-guide/page.tsx — one eyebrow pill above a section title. */
export interface EyebrowBadgeProps {
  /** Which color pair. */
  tone: EyebrowTone;
  /** Pill text, e.g. 도움말 가이드. */
  label: string;
  /** Lucide icon rendered at h-3.5 w-3.5 before the label (HelpCircle, MessageSquare, Send, MessageSquareText, GraduationCap); STEP pills have none. */
  icon?: string;
  /** help and help/feedback <div>s add mb-3 (built into .cp-help__eyebrow and .cp-feedback-card__eyebrow); graduation-guide <p>s go without it (.cp-help__eyebrow--flush). */
  spaced?: boolean;
}

/** src/app/(dashboard)/layout.tsx — the unread counter on the bell button (AppHeader .cp-app-header__badge / --admin). */
export interface BellCountBadgeProps {
  /** Rendered only when > 0; shows the number, or 99+ past 99. */
  unreadCount: number;
  /** true → bg-yellow-400 text-yellow-900; false → bg-red-500 text-white. */
  isAdmin: boolean;
}

/** src/app/(dashboard)/layout.tsx — NotificationItem.type picks the 32px icon circle of a panel row (AppHeader .cp-app-header__notice-chip / --patch-note / --feedback-new). */
export interface NotificationChipProps {
  /** 'patch-note' → purple-100 + Megaphone purple-600 · 'feedback-new' → yellow-100 + MessageSquareText yellow-600 · any other string → blue-100 + MessageSquareText blue-600. */
  type: 'patch-note' | 'feedback-new' | string;
}

export interface BadgeProps {
  /** Recipe to render. */
  recipe: BadgeRecipe;
  /** Text content. */
  children?: string;
}
