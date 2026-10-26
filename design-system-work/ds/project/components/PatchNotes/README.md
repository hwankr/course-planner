The student-facing 업데이트 소식 pages: a list of announcement Card rows and a detail Card, with their loading, empty and error states.

## Use it for / don't use it for

- Use the list at `/patch-notes`, reached from 업데이트 소식 in the header's 더보기 menu (and the mobile menu); use the detail page at `/patch-notes/[id]`, which the notification dropdown links to and which also marks it read for signed-in members.
- Non-admins receive only published notes (`findPublished`, at most 20); admins viewing `/patch-notes` and the detail page also see drafts, rendered exactly like published notes with no status marker.
- Use the skeleton while `useAuth()` or the TanStack query is loading, the empty box when the API returns no rows, and the red banner when the fetch fails.
- Don't reuse it for the admin side (`PatchNotePreview` and the admin form) or for notifications: the row here has no unread dot, no relative time and no type or category badge; `status` is never rendered.

## What the consumer provides

- Both files are Next.js page components with no props. The list reads `GET /api/patch-notes` as `{ success: boolean; data: IPatchNoteResponse[] }`; the detail reads `useParams().id` and `GET /api/patch-notes/{id}` as `{ success: boolean; data: IPatchNoteResponse }`.
- `IPatchNoteResponse`: `_id: string`, `title: string`, `content: string`, `version?: string` (pill only when set), `status: 'draft' | 'published'`, `publishedAt?: string` (falls back to `createdAt` for the date), `createdBy?: { _id; name; email }`, `createdAt: string`, `updatedAt: string`.
- Helpers: `formatDate` is `toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })` (2026년 10월 15일); `truncate(text, 100)`: the excerpt is `content` unchanged when it is 100 characters or fewer, otherwise its first 100 characters plus `...`.
- Container: the dashboard `<main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">` on the `gray-50` frame. The root `.cp-patch-notes` is `max-w-2xl mx-auto` (`container-2xl`) and inherits the Arial body font and `foreground`. The data and skeleton roots add `space-y-4` (`.cp-patch-notes--stack`, children `space-4` apart); the error roots (page.tsx L46, [id]/page.tsx L60) do not.

## Anatomy and states

- Header row: flex, centered, `gap: space-3`. Tile `control-md` (40px) circle, `radius-full`, fill `purple-100`, with the Lucide Megaphone at `icon-lg` in `purple-600` (4.7:1 on `purple-100`). Title `<h1>` in `heading-2` (700 24px/32px) `gray-900`. The detail Card reuses the same row with `margin-bottom: space-4`.
- List: flex column, `gap: space-3`. Each row is a `<Link>` (no classes; color and decoration inherit) around `.cp-card` (`white`, `border-default` hairline, `radius-lg`, `shadow-sm`) with `cursor: pointer`; hover lifts to `shadow-md` over `duration-slow` (the Card's own transition — `transition-shadow hover:shadow-md` on the className restate it). No focus, active or visited styling.
- Row content: `CardContent className="p-5"`, so padding `space-5` all round (`cn()` drops `p-6 pt-0`). Inside, `flex items-start justify-between gap-3`; the lead group `flex items-start gap-3 min-w-0`.
- Row tile: `icon-2xl` (32px) circle, `radius-full`, `purple-100`, `flex-shrink: 0`, `margin-top: space-0-5`, Megaphone at `icon-md` in `purple-600`.
- Title row: flex, centered, `gap: space-2`, `flex-wrap`, `margin-bottom: space-0-5`. Title `<span>` at 600 16px/24px (`body` size, semibold) `gray-900` (17.7:1) with `truncate`; the pill carries `flex-shrink: 0`. A title too long to sit beside the pill pushes the pill to a second line; only a title wider than the whole column truncates with an ellipsis.
- Version pill: `inline-flex`, `radius-full`, fill `blue-100`, padding `space-0-5` × `space-2`, 600 12px/16px (`caption` size, semibold) in `blue-700` (5.6:1). Same recipe as the PatchNotePreview pill.
- Date: `caption` in `slate-400`, `margin-bottom: space-2` in the list; a bare `<span>` in the detail meta row. `slate-400` on white is 2.6:1 in the source — kept, flagged.
- Excerpt: 400 14px with `leading-relaxed` (1.625) in `slate-600` (7.6:1); line breaks in `content` collapse (no pre-wrap).
- Arrow: Lucide ArrowRight at `icon-md`, `flex-shrink: 0`, `margin-top: space-1`, `slate-300` — 1.5:1 on white; the only affordance besides the cursor, kept, flagged.
- Skeleton: `cp-pulse` 2s cubic-bezier(0.4, 0, 0.6, 1) on `slate-200` blocks stacked `space-4` apart (`.cp-patch-notes--stack`). List: title `space-8` tall × 160px (w-40, no spacing token), `radius-lg`, then four blocks `space-24` tall, `radius-2xl`. Detail: title `space-6` × `space-32` (128px) and one 256px block (h-64, no size token).
- Empty box (list only, below the header): `radius-2xl`, 1px `slate-200` border (1.2:1, decorative), fill `slate-50`, padding `space-10`, centered; Megaphone `icon-2xl` in `slate-300` (1.4:1 on `slate-50` — kept, flagged), `margin: 0 auto space-3`; text `body-sm` in `slate-500` (4.6:1 on `slate-50`).
- Error banner (both pages, replaces the content): `radius-2xl`, 1px `red-200` border (1.3:1, decorative), fill `red-50`, padding `space-8`, centered; `body-sm` in `red-600` — 4.4:1 on `red-50`, misses 4.5:1 in the source, kept, flagged.
- Back link (detail): `inline-flex`, centered, `gap: space-2`, `body-sm-medium` (500 14px/20px) in `yu-cyan` with ArrowLeft at `icon-md`; `transition-colors` over `duration-fast`, hover `yu-navy` (10.7:1 on `gray-50`). `yu-cyan` on `gray-50` is 2.6:1 in the source — kept, flagged. The error branch's root is `max-w-2xl mx-auto` without `space-y-4`, so the link carries `margin-bottom: space-4` (`.cp-patch-notes__back--error`).
- Detail Card: `.cp-card` with `CardContent className="p-6"` → padding `space-6` all round. Title `<h1>` in `heading-3` size at 700 (20px/28px) `gray-900`; meta row flex, `gap: space-2`, `margin-top: space-0-5`, pill then date.
- Body: `border-top: 1px border-default` (a bare `border-t` under v4 — the Card's `gray-900`, not a gray hairline), `padding-top: space-4`; text 400 14px/1.625 in `slate-700` (10.4:1) with `white-space: pre-wrap`, so the stored line breaks render.

## Copy

- 업데이트 소식 — list `<h1>`.
- 목록으로 — detail back link (both the data and error branches).
- 등록된 업데이트 소식이 없습니다. — empty box.
- 업데이트 소식을 불러오는 중 오류가 발생했습니다. — list error banner. 업데이트 소식을 찾을 수 없습니다. — detail error banner.
- 업데이트 소식을 불러올 수 없습니다. — the `Error` thrown by both query functions (never rendered).
- Dates read like 2026년 10월 15일; the excerpt is `content` unchanged when it is 100 characters or fewer, otherwise its first 100 characters plus `...`.

## Accessibility

- Each list row is a real `<a>` wrapping the whole Card, so its name is the title, version, date and excerpt read together; it is keyboard-focusable but has no `focus-visible` styling in the source (browser ring only). The Card has no role.
- Both pages use a real `<h1>`: the list title, and the note title on the detail page. The back link is an `<a>` with visible text.
- lucide-react renders every icon with `aria-hidden="true"`, so the Megaphone, ArrowRight and ArrowLeft are not announced.
- The skeleton carries no `role="status"`, `aria-busy` or label; the error banner is a plain `<div>` without `role="alert"`; the empty box is plain text.
- Dates (`slate-400`) and the back link (`yu-cyan`) sit below 4.5:1; the arrow is below 3:1. `truncate` hides overflowing titles with no `title` attribute. `animate-pulse` ignores `prefers-reduced-motion`.

## Not reproduced

- The TanStack queries, their `enabled: !authLoading` gate and the `useAuth()` loading state; the detail page's `POST /api/patch-notes/{id}/read` on success for signed-in, non-guest users and the invalidation of `notifications-unread-count` and `notifications`.
- `formatDate`, `truncate` and the `publishedAt ?? createdAt` fallback — the preview hard-codes their output; Link navigation to `/patch-notes/{_id}` and `/patch-notes`.
- The fourth skeleton block, the detail skeleton (h-6 w-32 + h-64) and the detail error branch (plain root, back link with `mb-4` above the banner) — styled, not shown.
- The dashboard `<main>` paddings and the frame's `bg-grid` pattern; the stage shows plain `gray-50`.
- Hover is shown at rest through `.is-hover` on the second Card; real `:hover` on the rows and the back link also works in the preview.

Pattern extracted from inline markup in `src/app/(dashboard)/patch-notes/page.tsx`, `src/app/(dashboard)/patch-notes/[id]/page.tsx`; no component exists in the source
