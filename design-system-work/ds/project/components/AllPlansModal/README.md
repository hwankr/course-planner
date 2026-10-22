Centered dialog over a full-screen `black-a50` overlay listing a department's anonymous 수강계획 as lettered plan cards (A, B, C …) in a 1/2/3-column grid, with a first-page spinner, a 더 보기 button that moves to the next page of nine (the current nine are replaced; letters continue J, K, …) and an empty-state message.

## Use it for / don't use it for

- Use it from the statistics page only: the 전체 {total}개 수강계획 보기 button (shown when more than 3 plans exist) opens it, and clicking a plan card opens AnonymousPlanModal for that plan on top (z-50 over this z-40 overlay; that detail is where ReadOnlySemesterColumn appears, not here).
- Don't use it for the user's own plans, for numbered pagination (it steps forward one page at a time with no way back), or as a generic modal shell — the app's other dialogs draw their own overlays, widths and shadows.

## What the consumer provides

- `isOpen: boolean` — when false the component renders nothing and queues a reset of the page (1) and the selected plan (null).
- `onClose: () => void` — called on Escape and on a click on the overlay outside the panel (both only while no detail modal is open) and by 닫기.
- `departmentId?: string` — scopes the query and the detail modal; omitted → the API falls back to the signed-in user's department; a guest with no departmentId gets HTTP 400 and the list never loads. The statistics page always passes `effectiveDepartmentId`.
- No `children`, no `className`, no ref. Data comes from `useAnonymousPlans(departmentId, page, 9, isOpen)` inside the component. Container: render it at the page root; the overlay is `position: fixed` over the viewport.

## Anatomy and states

- Overlay: `position: fixed; inset: 0`, `z-overlay` (40), flex-centered, padding `space-4`, fill `black-a50`. No color class on the shell: text and both hairlines inherit the body `foreground`.
- Panel: width 100% up to `container-4xl` (896px), `max-height: 85vh`, `overflow: hidden`, flex column, `radius-xl`, fill `white`, `shadow-2xl`, `outline: none`. Only the content region scrolls; header and footer stay put.
- Header: flex space-between, padding `space-4` × `space-6`, fill `gray-50`, bottom hairline 1px `foreground` (the bare `border-b` is currentColor, not gray-200).
  - Title `<h2>` 익명 수강계획 전체 보기: `heading-4` size at weight 700 (18px/28px) in `gray-900` (17.0:1 on gray-50).
  - Count `<p>` 총 {total}개의 수강계획: `body-sm` in `gray-500` (4.6:1), `space-0-5` above; absent during the first load.
  - 닫기 button: padding `space-2`, `radius-lg`, transparent, no pointer cursor; hover fills `gray-200` over `duration-fast` `ease-standard`. X icon `icon-lg` in `gray-500` (4.6:1 at rest, 3.9:1 on the hover fill — above the 3:1 icon floor).
- Content: `flex: 1`, `overflow-y: auto`, padding `space-4` × `space-6`.
- First-page loading (page 1 pending): flex-centered block padded `space-12` vertically; Loader2 `icon-2xl` in `yu-blue` (5.5:1), `cp-spin` 1s linear.
- Grid: 1 column, 2 from 48rem (md), 3 from 64rem (lg); gap `space-4`, `space-6` below — kept even when the page is empty.
- Plan card `<button>`: padding `space-4`, 2px `gray-200` border (1.2:1 on white — source pair, kept, flagged), `radius-lg`, transparent fill, text-align left, `transition: all` over `duration-fast`. Hover: border `yu-blue` (5.5:1) and `shadow-md`. No pointer cursor, no focus class.
  - Head: flex, gap `space-2`, `space-3` below. Letter avatar `icon-2xl` (32px) round, `yu-navy → yu-blue` oklab gradient to bottom right, `body-sm` at weight 700 in `white` (11.2:1 / 5.5:1). Name 계획 {A} at `body` size, weight 600, `gray-900` (17.7:1).
  - Meta: two `body-sm` lines in `gray-600` (7.6:1), `space-1` apart.
- Anonymity note (only when the page has plans): flex, gap `space-1`, `space-4` above; `caption` in `gray-400` with an `icon-sm` Info — 2.6:1 on white, source pair, kept, flagged.
- 더 보기 (only while total > page × 9): centered wrap `space-4` above. Inline-flex button, gap `space-2`, padding `space-3` × `space-6`, 2px `yu-blue` border, `radius-lg`, label `body` (16px/24px, weight 400) in `yu-blue` (5.5:1); hover fills `yu-blue` with a `white` label (5.5:1) over `duration-fast`. Idle shows ChevronRight `icon-lg`; loading swaps in a spinning Loader2 `icon-lg` with 로딩 중..., `disabled`, `opacity-disabled`, `cursor: not-allowed`.
- Empty state (zero plans): centered, padded `space-12` vertically, `gray-500` (4.8:1); title `body` at weight 500 with `space-1` below; text `body-sm`.
- Footer: padding `space-3` × `space-6`, fill `gray-50`, top hairline 1px `foreground`. Notice: flex `items-start`, gap `space-2`, `caption` in `gray-400` (2.5:1 on gray-50 — source pair, kept, flagged) with an `icon-sm` Info nudged `space-0-5` down and `flex-shrink: 0`.

## Copy

- 익명 수강계획 전체 보기 (title and `aria-label`) · 총 {total}개의 수강계획 · 닫기 (`aria-label`)
- 계획 {A|B|C…} · {semesterCount}개 학기 · {totalCourses}개 과목 · {totalCredits}학점
- 모든 계획은 익명으로 표시됩니다 · 더 보기 · 로딩 중...
- 아직 공개된 수강 계획이 없습니다 · 학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다
- 이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.

## Accessibility

- The overlay carries `role="dialog"`, `aria-modal="true"` and `aria-label="익명 수강계획 전체 보기"`; the `<h2>` is not linked by `aria-labelledby`.
- The panel has `tabIndex={-1}` and receives focus on open; `outline-none` hides that ring. Focus is not trapped and not restored on close.
- Escape closes through a `document` keydown listener, only while no detail modal is open; a click on the overlay outside the panel also closes. `document.body.style.overflow` is set to hidden while open and re-asserted when the detail closes.
- 닫기 has `aria-label="닫기"`. Plan cards are plain `<button>`s named by their text (A 계획 A 8개 학기 …) with no `aria-haspopup`.
- 더 보기 is `disabled` while loading, with no `aria-busy`; neither spinner has a text alternative; every Lucide icon renders `aria-hidden="true"` (lucide-react's default when no aria-* prop is passed), so the spinners are hidden from assistive tech and 더 보기 reads only as 로딩 중... while loading.
- No focus-visible styling anywhere; the buttons show the browser default ring.
- The `gray-400` captions miss 4.5:1 (2.6:1 and 2.5:1); kept exact from the source.

## Not reproduced

- `isOpen` mount/unmount, `useAnonymousPlans` fetching (9 per page; `placeholderData` keeps the previous page while the next loads), page switching (the next nine replace the current nine) and the live 총 N개 count.
- Escape and backdrop-click `onClose`, the body scroll lock, programmatic focus of the panel and the state reset on close.
- Opening AnonymousPlanModal (z-50) when a plan card is clicked.
- Hover and loading are shown at rest with `.is-hover` and `disabled`; the first page is abbreviated to four cards. Each overlay is pinned to its preview stage with `.cp-all-plans-modal--staged` (85vh → 85cqh) instead of `position: fixed`.

Static rendition hand-translated from `src/components/features/AllPlansModal.tsx`.
