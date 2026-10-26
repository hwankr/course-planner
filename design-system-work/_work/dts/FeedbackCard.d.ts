// FeedbackCard — pattern inputs adapted from src/app/(dashboard)/help/feedback/page.tsx (MyFeedbackItem, page state) and src/app/(dashboard)/admin/feedback/page.tsx (FeedbackItem, FeedbackCategory, FeedbackStatus, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS). Both pages inline the markup; no component or props interface exists in the source. Documentation only; not type-checked.

/** Category key of a feedback document; the user form always submits 'contact'. */
export type FeedbackCategory = 'bug' | 'feature' | 'data-error' | 'other' | 'contact';

/** Lifecycle of a feedback document: pending until an admin replies or presses 답변 없이 해결. */
export type FeedbackStatus = 'pending' | 'resolved';

/** One row of GET /api/feedback/my, as the user page types it (copied verbatim). */
export interface MyFeedbackItem {
  /** Mongo id; key of the item and target of DELETE /api/feedback/:id. */
  _id: string;
  /** Category key; the user page never displays it. */
  category: string;
  /** The user's text, rendered with whitespace-pre-wrap. */
  message: string;
  /** Picks the pill: 대기중 (yellow, Clock) or 해결됨 (green, CheckCircle). */
  status: 'pending' | 'resolved';
  /** Admin reply text; when present the item gets the green-400 rail, green-50/30 fill and the 관리자 답변 box. */
  adminReply?: string;
  /** ISO date of the reply, shown in slate-400 beside the 관리자 답변 pill when present. */
  adminReplyAt?: string;
  /** Whether the user has seen the reply; the page invalidates the unread count but does not render this. */
  isReadByUser: boolean;
  /** ISO date; formatted with toLocaleDateString('ko-KR', { year, month: 'short', day, hour: '2-digit', minute: '2-digit' }). */
  createdAt: string;
  /** ISO date; not rendered. */
  updatedAt: string;
}

/** One row of GET /api/feedback, as the admin page types it (copied verbatim). */
export interface FeedbackItem {
  /** Mongo id; key, PATCH and DELETE target. */
  _id: string;
  /** Drives the category pill (CATEGORY_LABELS / CATEGORY_COLORS). */
  category: FeedbackCategory;
  /** Body text; clamped to three lines with a 더보기 toggle when longer than 150 characters. */
  message: string;
  /** Submitter email for anonymous feedback; the meta line falls back to it, then to 익명. */
  email?: string;
  /** Populated submitter; the meta line prints `${name} (${email})` when present. */
  userId?: { _id: string; email: string; name: string };
  /** Drives the status pill and the toggle button label (답변 없이 해결 / 대기로 변경). */
  status: FeedbackStatus;
  /** ISO date printed last on the meta line. */
  createdAt: string;
  /** ISO date; not rendered. */
  updatedAt: string;
  /** When set, the green-50 reply box replaces the reply textarea. */
  adminReply?: string;
  /** ISO date shown beside the 관리자 답변 pill. */
  adminReplyAt?: string;
  /** Read flags kept for the unread badges; not rendered by this page. */
  isReadByAdmin: boolean;
  /** Read flags kept for the unread badges; not rendered by this page. */
  isReadByUser: boolean;
}

/** State the user-facing pattern (help/feedback/page.tsx) renders from; page state, not props. */
export interface FeedbackCardProps {
  /** Textarea value, sliced to 2000 characters in onChange; the submit button is disabled until content.trim().length >= 5. */
  content: string;
  /** True while POST /api/feedback runs: textarea disabled, button disabled with Loader2 + 전송 중.... */
  isPending: boolean;
  /** isAuthenticated && !isGuest; false swaps the form for the dashed 로그인하기 box and hides the 내 문의 내역 card. */
  showMyFeedback: boolean;
  /** True while GET /api/feedback/my loads: two h-24 pulse skeletons stand in for the list. */
  feedbackLoading: boolean;
  /** useQuery data; undefined or empty data renders 아직 문의 내역이 없습니다.. */
  myFeedbacks?: { success: boolean; data: MyFeedbackItem[] };
  /** True while DELETE /api/feedback/:id runs: every 문의 삭제 button fades to 50%. */
  isDeleting: boolean;
}

/** State one admin item (admin/feedback/page.tsx) renders from, per FeedbackItem. */
export interface AdminFeedbackItemProps {
  /** The row being rendered inside <Card className="overflow-hidden">. */
  item: FeedbackItem;
  /** expandedIds.has(item._id): full message and 접기 instead of line-clamp-3 and 더보기 (only when message.length > 150). */
  isExpanded: boolean;
  /** Id of the row being typed into; footer shows when replyingId === item._id && replyContent.length > 0. */
  replyingId: string | null;
  /** Reply draft, sliced to 2000; 답변 및 해결 처리 is disabled until replyContent.trim().length >= 1. */
  replyContent: string;
  /** True while PATCH { adminReply } runs (submitReply isPending): textarea and 취소 disabled, 답변 및 해결 처리 shows Loader2 + 전송 중.... */
  isReplying: boolean;
  /** True while DELETE runs: the 피드백 삭제 button fades to 50%. */
  isDeletingFeedback: boolean;
}

/** Korean label per category pill: 버그, 기능 요청, 데이터 오류, 기타, 문의. */
export declare const CATEGORY_LABELS: Record<FeedbackCategory, string>;

/** Tailwind pair per category pill: bug red-100/red-700, feature blue-100/blue-700, data-error orange-100/orange-700, other gray-100/gray-700, contact teal-100/teal-700. */
export declare const CATEGORY_COLORS: Record<FeedbackCategory, string>;

/** Status pill label: 대기중 / 해결됨. */
export declare const STATUS_LABELS: Record<FeedbackStatus, string>;
