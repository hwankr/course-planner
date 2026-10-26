An admin-only live preview of an update announcement: a purple dashed frame holding a mock notification-dropdown row and the detail card with title, optional version pill, body and timestamp, re-rendered from the admin form as the admin types.

## Use it for / don't use it for

- Use it next to the 업데이트 소식 form on the admin patch-notes page, as the second column of a `grid grid-cols-1 lg:grid-cols-2 gap-6` inside a white `Card`, shown while the 미리보기 toggle is on. It answers one question: how will this announcement look to students in the notification dropdown and in the detail view.
- Keep the 알림 드롭다운 row in step with the real dropdown item in `(dashboard)/layout.tsx` (the source carries a SYNC comment for this); change both or neither.
- Don't use it to render published announcements to students, don't make it interactive, and don't add type badges, dates or links: the source has none of them.

## What the consumer provides

- `title: string` — trimmed; empty renders the placeholder 제목을 입력하세요. The notification row shows the first 50 characters plus `...` when longer.
- `content: string` — trimmed; empty renders the placeholder 내용을 입력하세요. Line breaks are kept (`whitespace-pre-wrap`).
- `version?: string` — trimmed; the pill renders only when non-empty.
- No children. Container: a block in a white `Card` (`text-gray-900` inherited); the component is fluid and fills its grid column.

## Anatomy and states

- Frame: 2px dashed `purple-200` border (1.4:1 on white, decorative), `radius-xl`, fill `purple-50-a30` (reads as #fefcff over the Card), padding `space-4`; the header and the two sections stack `space-4` apart.
- Frame header: flex row, `gap: space-2`, color `purple-600`; the Lucide Eye at `icon-md` and the label 미리보기 in `body-sm-semibold` (600 14px/20px). `purple-600` on the frame tint is 5.4:1.
- Section: label then card, `space-1-5` apart. Label in `caption-medium` (500 12px/16px) `slate-500` (4.7:1 on the tint).
- Dropdown mock: fill `white`, 1px `slate-200` border (1.2:1, decorative hairline), `radius-lg`, no padding, overflow hidden. Inside, one static item: flex, top-aligned, `gap: space-3`, padding `space-3` × `space-4`. The live item in layout.tsx is a Link with a hover fill and dividers; the preview copies only the resting markup.
- Avatar: `icon-2xl` (32px) circle, `radius-full`, fill `purple-100`, with the Lucide Megaphone at `icon-md` in `purple-600` (4.7:1 on `purple-100`); wrapper `flex-shrink: 0`, `margin-top: space-0-5`.
- Item text: `body-sm` (400 14px/20px) in `gray-700` (10.3:1), reading 새로운 업데이트: plus the (truncated) title; it wraps, nothing clamps it. Item time: `caption` in `gray-400`, `margin-top: space-0-5`. `gray-400` on white is 2.6:1 in the source — kept, flagged.
- Detail card: fill `white`, 1px `slate-200` border, `radius-lg`, padding `space-4`; title row, body and time stack `space-3` apart.
- Title row: flex, centered, `gap: space-2`, `flex-wrap`, so the pill drops under a long title. Title is an `<h3>` at 700 16px/24px (`body` size, bold) in `gray-900` (17.7:1); with an empty `title` it turns `gray-400` italic and shows the placeholder (2.6:1 — kept, flagged).
- Version pill: `inline-flex`, `radius-full`, fill `blue-100`, padding `space-0-5` × `space-2`, 600 12px/16px (`caption` size, semibold) in `blue-700` (5.6:1 on `blue-100`).
- Body: a scroll box capped at 256px (`max-h-64`, `overflow-y: auto`; no size token covers it). Text at 400 14px with `leading-relaxed` (1.625) in `slate-700` (10.4:1), `white-space: pre-wrap`; with empty `content` it turns `gray-400` italic and shows the placeholder (`gray-400` on white is 2.6:1 in the source — kept, flagged).
- Detail time: `caption` in `slate-400` (2.6:1 on white in the source — kept, flagged).
- No hover, focus, active or disabled states: nothing in the component is interactive.

## Copy

- 미리보기 — frame header label.
- 알림 드롭다운 · 업데이트 소식 상세 — section labels.
- 새로운 업데이트: {title} — notification row text; the title is cut to 50 characters plus `...`.
- 제목을 입력하세요 · 내용을 입력하세요 — placeholders when `title` or `content` is blank; the title placeholder also feeds the notification row.
- 방금 전 — both timestamps, always literal.

## Accessibility

- The title is a real `<h3>`; everything else is `<div>`, `<p>` and `<span>` with no roles or aria attributes.
- The Eye and Megaphone SVGs come from lucide-react, which renders them with `aria-hidden="true"`; 미리보기 is visible text, so the header reads correctly without them.
- Nothing is focusable or clickable; the mock notification row is a `<div>`, not the Link the real dropdown uses, so there is no keyboard path and nothing to announce.
- Placeholder and timestamp text in `gray-400` / `slate-400` sits below 4.5:1; the empty-state placeholders rely on italic plus color to read as placeholders.
- The 256px scroll box has no `tabindex`, role or label; keyboard scrolling relies on the browser making scrollers focusable (Chrome 130+ and Firefox do, Safari does not), and the region is unnamed when focused.

## Not reproduced

- The `title.trim()` / `content.trim()` / `version?.trim()` logic and the 50-character cut: the preview hard-codes the resulting strings.
- Live re-rendering as the admin types, and the 미리보기 / 미리보기 닫기 toggle on the page.
- The real dropdown item's hover fill, dividers and relative-time formatting; the preview shows the literal 방금 전 as the source does.

Static rendition hand-translated from `src/components/features/PatchNotePreview.tsx`.
