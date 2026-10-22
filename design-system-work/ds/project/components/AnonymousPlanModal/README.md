Detail dialog for one anonymous 수강계획: a dark overlay, an 896px white panel with a gray-50 header (익명 수강계획, 총 N학점 · N과목, 닫기), a scrolling body that groups ReadOnlySemesterColumn cards by 학년 in a two-column grid, a gray spinner while loading, a soft amber notice when the plan has gone stale, and a privacy footer.

## Use it for / don't use it for

- Use it where the app opens it: the statistics page (clicking a plan card in the 익명 수강계획 열람 section) and AllPlansModal (clicking a lettered plan card). Both mount it only while a `selectedPlanId` exists, with `isOpen={true}`, and it stacks at `z-modal` (50) above AllPlansModal's z-40 overlay.
- Don't use it for the user's own plan (the planner page owns that), for anything editable, or as a generic modal shell; it fetches its own data from `anonymousId` and draws its own overlay, width and shadow.

## What the consumer provides

- `isOpen: boolean` — when false the component returns null; the detail query is also disabled (the hook receives `null`).
- `onClose: () => void` — called on Escape, on a click on the overlay outside the panel, by 닫기, and automatically 2 seconds after a fetch error.
- `anonymousId: string | null` — the plan to load with `useAnonymousPlanDetail(anonymousId, departmentId)`; `null` disables the query. A 404 (stale id) is not retried. (The hook declares a `meta.onError` list invalidation, but the app's QueryClient never wires `meta` callbacks, so the lists are not invalidated.)
- `departmentId?: string` — forwarded to the query; omitted → unscoped.
- No `children`, no `className`, no ref. Render it at the page root; the overlay is `position: fixed` over the viewport. The body content comes from the fetched `AnonymousPlanDetail` (`semesters[]`, `totalCredits`), grouped by `year` ascending; inside a year the source sorts with the one-argument comparator `(a) => a.term === 'spring' ? -1 : 1`, which puts spring first for the usual two-semester year but is not a general sort.

## Anatomy and states

- Overlay: `position: fixed; inset: 0`, `z-modal`, flex-centered, padding `space-4`, fill `black-a50`. No color class on the shell: text and both hairlines inherit the body `foreground`.
- Panel: width 100% up to `container-4xl` (896px), `max-height: 85vh`, `overflow: hidden`, flex column, `radius-xl`, fill `white`, `shadow-2xl`, `outline: none`. Only the content region scrolls; header and footer stay put.
- Header: flex space-between, padding `space-4` × `space-6`, fill `gray-50`, bottom hairline 1px `foreground` (the bare `border-b` is currentColor, not gray-200).
  - Title `<h2>` 익명 수강계획: `heading-4` size at weight 700 (18px/28px) in `gray-900` (17.0:1 on gray-50).
  - Subtitle `<p>` 총 {totalCredits}학점 · {n}과목: `body-sm` in `gray-500` (4.6:1), `space-0-5` above; rendered only once `data` exists, so it is absent while loading and in the error state.
  - 닫기 button: padding `space-2`, `radius-lg`, transparent, no pointer cursor; hover fills `gray-200` over `duration-fast` `ease-standard`. X icon `icon-lg` in `gray-500` (4.6:1 at rest, 3.9:1 on the hover fill, above the 3:1 icon floor). Mirror class `.is-hover`.
- Content: `flex: 1`, `overflow-y: auto`, padding `space-4` × `space-6`.
- Loading (`isLoading`): flex column, centered, padded `space-16` vertically, color `gray-400`. Loader2 `icon-2xl` with `cp-spin` 1s linear and `space-3` below; 계획을 불러오는 중... in `body-sm`, inheriting `gray-400` — 2.6:1 on white in the source, kept, flagged.
- Error (`isError`, typically a 404 for a stale `anonymousId`): the same block in `amber-600`, read as a soft notice rather than a red error. AlertCircle `icon-2xl` with `space-3` below (3.2:1 on white, above the 3:1 icon floor); title 이 계획 정보가 갱신되었습니다. in `body-sm-medium` inheriting `amber-600` — 3.2:1 on white in the source, kept, flagged; sub-line 목록을 새로고침합니다... in `caption` `gray-400` with `space-1` above — 2.6:1, kept, flagged. The dialog calls `onClose` 2 seconds after entering this state.
- Loaded (`data`): year groups stacked `space-6` apart, each an unclassed wrapper holding an `<h3>` {year}학년 in `body-sm-semibold` `gray-600` (7.6:1 on white) with `space-2` below, and a grid of ReadOnlySemesterColumn in default (non-compact) mode: 1 column, 2 from 40rem (sm), gap `space-3`. Grid items stretch, so the shorter card of a row shows white space under its list. The cards are the `.cp-read-only-semester-column` block; their tokens are documented on that card.
- Footer: padding `space-3` × `space-6`, fill `gray-50`, top hairline 1px `foreground`. Notice: flex `items-start`, gap `space-2`, `caption` in `gray-400` (2.5:1 on gray-50 — source pair, kept, flagged) with an `icon-sm` Info nudged `space-0-5` down and `flex-shrink: 0`.
- There are no focus-visible, selected or disabled styles; the only motion is the 닫기 hover fill and the spinner.

## Copy

- 익명 수강계획 (title and `aria-label`) · 총 {totalCredits}학점 · {courseCount}과목 · 닫기 (`aria-label`)
- 계획을 불러오는 중...
- 이 계획 정보가 갱신되었습니다. · 목록을 새로고침합니다...
- {year}학년 (group heading; the card title {year}학년 {1학기|2학기} and the chip labels belong to ReadOnlySemesterColumn)
- 이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.

## Accessibility

- The overlay carries `role="dialog"`, `aria-modal="true"` and `aria-label="익명 수강계획"`; the `<h2>` is not linked by `aria-labelledby`.
- The panel has `tabIndex={-1}` and receives focus on open; `outline-none` hides that ring. Focus is not trapped and not restored on close.
- Escape closes through a `document` keydown listener; a click on the overlay outside the panel also closes. `document.body.style.overflow` is set to hidden while open and cleared on unmount.
- 닫기 has `aria-label="닫기"` and no `type` attribute. No focus-visible styling; it shows the browser default ring.
- All four lucide icons (X, Loader2, AlertCircle, Info) render with `aria-hidden="true"` (lucide-react default when no aria prop is passed); the loading and error text is not in a live region, and the error state closes itself after 2 seconds with no announcement.
- Headings nest h2 (dialog) → h3 ({year}학년) → h4 (each semester card).
- The `gray-400` captions (2.6:1, 2.5:1) and the `amber-600` 14px title (3.2:1) miss 4.5:1; kept exact from the source.

## Not reproduced

- Mount/unmount on `isOpen`; `useAnonymousPlanDetail` fetching, its 404 no-retry and list invalidation; grouping by year and the spring-first sort; the computed 총 N학점 · N과목 and the per-card totals (the preview's numbers are written to match its rows).
- Escape and backdrop-click `onClose`, the 2-second auto-close after an error, the body scroll lock and the programmatic focus of the panel.
- Hover is shown at rest with `.is-hover`. Each overlay is pinned to its preview stage with `.cp-anonymous-plan-modal--staged` (85vh → 85cqh) instead of `position: fixed`; the loaded body is shown scrolled to the top with 2학년 below the fold.

Static rendition hand-translated from `src/components/features/AnonymousPlanModal.tsx` and `src/components/features/ReadOnlySemesterColumn.tsx`.
