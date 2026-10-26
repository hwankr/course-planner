Non-interactive semester summary for shared plan views: a gray-50 header with the semester title, credit total and category breakdown over a list of flat white course rows that carry a two-syllable category chip, name, code and credits; collapsible only in `compact`.

## Use it for / don't use it for

- Use it for every semester inside `AnonymousPlanModal` (the 익명 수강계획 dialog), where the app renders it in default mode inside a `grid grid-cols-1 sm:grid-cols-2 gap-3` under a `{year}학년` heading, on the modal's white body.
- Don't use it where courses can be dragged, removed or status-toggled; `SemesterColumn` with `CourseCard` owns that. Don't use it as a generic list surface; use `Card`.
- The app never passes `compact`; the compact mode exists only through the prop.

## What the consumer provides

- `semester: { year: number; term: string; courses: Array<{ code: string; name: string; credits: number; category?: string }> }` — required. `term === 'spring'` renders `1학기`; any other value renders `2학기`. A missing/empty `category` counts as 자선 in the chip and the breakdown. An unknown non-empty `category` gets the 자선 chip but is omitted from the header breakdown (its credits still count in `{totalCredits}학점`). The parenthetical renders only when at least one of the seven known categories sums above 0 credits.
- `compact?: boolean` (default `false`) — tighter padding and type, and a header click that toggles the list. The list starts open in default mode and collapsed in compact (`isExpanded` initial = `!compact`).
- No children, no `className`, no ref. It fills the parent width. In the modal's two-column grid it stretches to the taller column of its row, leaving white space below the shorter list (the list has no `flex-1`); it sizes to its rows only in a plain block or at the single-column breakpoint.

## Anatomy and states

- Root (`Card` base + `flex flex-col`): fill `white`, radius `radius-lg`, 1px border `border-default` (`gray-900`, because the bare Tailwind v4 `border` is currentColor on `text-gray-900`), `shadow-sm` → `shadow-md` on hover over `duration-slow` with `ease-standard`. No `overflow-hidden`, so the header's `gray-50` background is not clipped by the radius: its square top corners overpaint the `border-default` curve at both top corners — kept. Mirror class `.is-hover`.
- Header: padding `space-3` (compact `space-2`), fill `gray-50`, bottom hairline 1px `border-default`, `cursor: pointer` in both modes even though only compact reacts to the click. Inside, a flex row with `align-items: center`, `justify-content: space-between`.
- Title (`h4`): 16px/24px 600 (`body` size at semibold) in `gray-800` (14.0:1 on `gray-50`); compact `body-sm-semibold` (14px/20px 600).
- Credit line (`p`): `body-sm` in `gray-500`, margin-top `space-0-5` (4.6:1 on `gray-50`); compact `caption`. Breakdown `span`: margin-left `space-1`, `gray-400` at the inherited size — 2.5:1 on `gray-50` in the source, kept, flagged.
- Toggle (`button`, compact only): `caption` in `gray-400`, no padding, border, fill or cursor of its own — 2.5:1 on `gray-50` for interactive text, kept, flagged. Text `접기` while expanded, `펼치기` while collapsed.
- List (rendered only while expanded): padding `space-3` (compact `space-2`), `space-1-5` between rows.
- Row: flex, `align-items: center`, gap `space-2`, padding `space-2`, fill `white`, radius `radius-md`, 1px border `gray-100` (1.1:1 on white — a decorative hairline, kept).
- Category chip: `micro-10` (10px, inherited 1.5 line-height = 15px, 500), padding `space-0-5` × `space-1-5`, radius `radius-sm`. Fill / text: 전핵 `category-major-required-bg` / `-text` (`red-100` / `red-700`, 5.3:1); 전필 `category-major-compulsory-bg` / `-text` (`rose-100` / `rose-700`, 5.0:1); 전선 `category-major-elective-bg` / `-text` (`orange-100` / `orange-700`, 4.6:1); 교필 `category-general-required-bg` / `-text` (`blue-100` / `blue-700`, 5.6:1); 교선 `category-general-elective-bg` / `-text` (`green-100` / `green-700`, 4.5:1); 교직 `category-teaching-bg` / `-text` (`violet-100` / `violet-700`, 6.1:1); 자선 and any unknown key `category-free-elective-bg` / `-text` (`gray-100` / `gray-600`, 6.9:1). The chip is not `flex-shrink-0`; the content block absorbs shrink first.
- Content: `flex: 1`, `min-width: 0`. Name (`p`): `body-sm-medium` in `gray-800`, one line with ellipsis. Code (`p`): `caption` in `gray-400` — 2.6:1 on white, kept, flagged.
- Credits (`span`): `caption` in `gray-500` (4.8:1 on white), `white-space: nowrap`.
- There are no focus, selected, disabled or drag states; the only motion is the root shadow.

## Copy

- Title: `{year}학년 {termLabel}` with `termLabel` = `1학기` (`spring`) or `2학기` (anything else), e.g. `1학년 1학기`.
- Credit line: `{totalCredits}학점 · {courses.length}과목`, followed by `({label}{credits} · …)` only when at least one of the seven known categories sums above 0 credits, e.g. `(전핵6 · 교필2 · 교선3)`; the gap before the parenthetical is the span's `space-1` left margin, not a space character. The breakdown lists categories in the fixed order 전핵 · 전필 · 전선 · 교필 · 교선 · 교직 · 자선 and sums credits per known category; a missing/empty `category` is summed under 자선, while an unknown non-empty `category` is dropped from the breakdown even though its credits still count in `{totalCredits}학점`.
- Toggle: `접기` / `펼치기`.
- Chip labels: `전핵`, `전필`, `전선`, `교필`, `교선`, `교직`, `자선`; fallback `자선`.
- Row credits: `{credits}학점` (no space). No aria-labels, titles or confirm text.

## Accessibility

- The header is a `div` with an `onClick` (compact only): no `role`, `tabIndex` or key handler, so pointer users can toggle anywhere on it while keyboard users reach only the `접기`/`펼치기` `<button>`, whose click bubbles to the header handler. The button has no `type`, `aria-expanded` or `aria-controls`.
- Hovering the header shows a pointer in default mode where the click does nothing.
- The title is a real `<h4>`; in the modal it sits under the `h2` dialog title and the `h3` year heading, so the outline is consistent.
- Category is conveyed by text and color together. The truncated name has no `title`, so the full name is unavailable without a wider viewport.
- No `focus-visible` styles: the toggle shows the browser default focus ring only.

## Not reproduced

- The `useState` expand/collapse toggle and the header click; the preview shows expanded and collapsed columns as separate static instances.
- The credit total and category breakdown computed from `courses`; the preview's numbers are written to match its rows.
- The surrounding `AnonymousPlanModal` grid, `{year}학년` heading and modal chrome.

Static rendition hand-translated from `src/components/features/ReadOnlySemesterColumn.tsx` and `src/components/ui/Card.tsx`.
