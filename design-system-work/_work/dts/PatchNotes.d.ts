/**
 * PatchNotes — documentation-only types for the 업데이트 소식 PATTERN: the student-facing list page
 * (src/app/(dashboard)/patch-notes/page.tsx) and detail page (src/app/(dashboard)/patch-notes/[id]/page.tsx).
 * No component exists in the source; both are Next.js page components without props that render
 * IPatchNoteResponse rows fetched from /api/patch-notes. Data types are copied from src/types/index.ts.
 */

/** Publication state kept by the admin; the student pages only ever receive 'published' rows and never render it. */
export type PatchNoteStatus = 'draft' | 'published';

/** One announcement as the API returns it (src/types/index.ts). */
export interface IPatchNoteResponse {
  /** MongoDB id; the list links each row to /patch-notes/{_id}. */
  _id: string;
  /** Row title (truncate) and detail <h1>. */
  title: string;
  /** Body text; the list shows truncate(content, 100) + '...', the detail renders it whitespace-pre-wrap. */
  content: string;
  /** Optional version label; the blue-100 / blue-700 pill renders only when set. */
  version?: string;
  /** Draft or published — not rendered by either page. */
  status: PatchNoteStatus;
  /** ISO date shown through formatDate when present. */
  publishedAt?: string;
  /** Author reference — not rendered by either page. */
  createdBy?: { _id: string; name: string; email: string };
  /** ISO date; the date fallback when publishedAt is missing. */
  createdAt: string;
  /** ISO date — not rendered. */
  updatedAt: string;
}

/** Envelope both query functions expect from the API. */
export interface PatchNotesApiResponse<T = IPatchNoteResponse | IPatchNoteResponse[]> {
  /** True on success; the detail page posts the read receipt only when it is true. */
  success: boolean;
  /** One note (detail) or the list of notes. */
  data: T;
}

/** Which of the two pages a block of the pattern belongs to. */
export type PatchNotesView = 'list' | 'detail';

/** The branch each page renders: skeleton, red banner, slate empty box (list only) or the data. */
export type PatchNotesState = 'loading' | 'error' | 'empty' | 'ready';

/** Props of the pattern as the stylesheet models it (the pages themselves take none). */
export interface PatchNotesProps {
  /** 'list' renders the header and Card rows; 'detail' the back link and the single Card. */
  view: PatchNotesView;
  /** Which branch to show; 'empty' exists only for the list. Default 'ready'. */
  state?: PatchNotesState;
  /** Rows for the list view, in API order; each row is a Link around a Card. */
  notes?: IPatchNoteResponse[];
  /** The one announcement for the detail view, fetched by the [id] route param. */
  note?: IPatchNoteResponse;
}

/** Date formatter both pages use: toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) → 2026년 10월 15일. */
export type PatchNotesFormatDate = (iso: string) => string;

/** List excerpt helper: returns text unchanged when its length is at most max (default 100), else the first max characters plus '...'. */
export type PatchNotesTruncate = (text: string, max?: number) => string;
