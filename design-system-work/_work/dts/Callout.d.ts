/**
 * Callout — documentation-only types for the callout PATTERN: tinted banners written inline in seven
 * files (statistics guest + info callouts, the layout guest strip, the login error + in-app notice, the
 * admin error banner, the CustomCourseForm strips, the RequirementForm help + suggestion boxes, the
 * feedback admin reply). No component exists in the source; these are the recipe names used by the
 * stylesheet and the page state each banner is toggled by.
 */

/** The eleven recipes, named by source file; one `.cp-callout--<recipe>` modifier each. */
export type CalloutRecipe =
  | 'stat-guest'
  | 'stat-info'
  | 'login-error'
  | 'admin-error'
  | 'guest-strip'
  | 'form-info'
  | 'form-warning'
  | 'req-help'
  | 'req-suggest'
  | 'reply'
  | 'inapp';

/** Color family a recipe draws from: amber (guest / warning), blue (info), red (error), green (admin reply). */
export type CalloutTone = 'amber' | 'blue' | 'red' | 'green';

/** Lucide icon a recipe leads with; the login, admin, form-strip and reply recipes have none. */
export type CalloutIcon = 'log-in' | 'info' | 'alert-triangle' | 'help-circle';

/** The shape every recipe is built from — a container, optional icon, one or two lines, at most one action pair. */
export interface CalloutProps {
  /** Which inline recipe this markup is. */
  recipe: CalloutRecipe;
  /** Color family (fixed per recipe). */
  tone: CalloutTone;
  /** Leading lucide icon, when the recipe has one. */
  icon?: CalloutIcon;
  /** Emphasised first line (stat-guest, stat-info, inapp). */
  title?: string;
  /** Body text; the sole line of the error boxes and form strips. */
  body?: string;
  /** Label of the filled <button> (stat-guest 구글로 로그인, req-suggest …까지로 설정, inapp 외부 브라우저에서 열기). */
  action?: string;
  /** Label of the underlined link or link-styled button (회원가입하기, 구글로 로그인, 확인 방법 보기). */
  link?: string;
  /** next/link target of `link`: '/register' or '/help/graduation-guide'. */
  href?: string;
}

/** src/app/(dashboard)/statistics/page.tsx — renders stat-guest when `isGuest`, stat-info always. */
export interface StatisticsCalloutState {
  /** From useAuth(); shows the amber guest callout. */
  isGuest: boolean;
  /** From useAuth(); onClick of the amber 구글로 로그인 button. */
  loginWithGoogle: () => void;
  /** stats.departmentName — the <strong> run in the info callout. */
  departmentName: string;
}

/** src/app/(dashboard)/layout.tsx — renders guest-strip between the header and <main> when `isGuest`. */
export interface GuestStripState {
  /** From useAuth(). */
  isGuest: boolean;
  /** onClick of the underlined 구글로 로그인 <button>; 회원가입하기 is a Link to /register. */
  loginWithGoogle: () => void;
}

/** src/app/(auth)/login/page.tsx — login-error above the fields, inapp in place of the Google Button. */
export interface LoginCalloutState {
  /** '' hides the red box; set to LOGIN_FAILURE_MESSAGE when login() throws. */
  error: string;
  /** detectInAppBrowser() plus an iOS user-agent test, run once on mount. */
  inAppInfo: {
    /** Shows the amber notice instead of the Google Button. */
    isInApp: boolean;
    /** Known app name (카카오톡, 에브리타임, 인스타그램, Facebook, 네이버, LINE, 다음, 삼성 인터넷, Twitter, TikTok, 밴드) or null → '앱'. */
    appName: string | null;
    /** true renders the ꞏꞏꞏ / 공유 / "Safari로 열기" hint; false renders the 외부 브라우저에서 열기 button. */
    isIOS: boolean;
  };
  /** onClick of the Android button; returns how it tried to leave the WebView. */
  openInExternalBrowser: (url?: string) => 'redirected' | 'ios' | 'unknown';
}

/** src/app/(dashboard)/admin/courses/page.tsx — admin-error replaces the course list. */
export interface AdminErrorState {
  /** useQuery error for ['admin-courses', …]; any value renders the fixed message. */
  error: Error | null;
}

/** src/components/features/CustomCourseForm.tsx — form-info or form-warning (either/or). */
export interface CustomCourseFormStripState {
  /** Set → blue strip "{year}학년 {1학기|2학기}에 바로 추가됩니다."; null → amber strip. */
  focusedSemester?: { year: number; term: string } | null;
}

/** src/components/features/RequirementForm.tsx — req-help always; req-suggest when the guard below is true. */
export interface RequirementFormCalloutState {
  /** Last semester with '이수' courses in the plan; the button sets priorCutoff to `${year}-${term}`. */
  suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null;
  /** Current cutoff ('' = unset) — picks which of the two suggestion sentences renders. */
  priorCutoff: string;
  /** suggestedCutoff && suggestionAhead && hasPriorCredits && (priorCutoff === '' || earnedEdited). */
  showCutoffSuggestion: boolean;
}

/** src/app/(dashboard)/help/feedback/page.tsx — reply renders inside an item when `adminReply` is set. */
export interface FeedbackReplyState {
  /** The admin's answer, rendered white-space: pre-wrap. */
  adminReply?: string;
  /** ISO date shown beside the 관리자 답변 pill via toLocaleDateString('ko-KR', …). */
  adminReplyAt?: string;
}
