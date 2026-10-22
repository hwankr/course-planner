Modal for adding a semester to the plan: a black/50 overlay centers a max-w-md Card holding the 학기 추가 title, a five-column 학년 segmented selector, a two-column 학기 selector, a red-50 duplicate warning and a 추가 / 취소 footer.

## Use it for / don't use it for

- Use it from the planner page only: the dashed ghost 학기 추가 button opens it while an active plan exists, and `onAdd` adds one semester (1–5학년 × 1학기/2학기) through the add-semester mutation; the dialog stays open if that fails.
- Don't use it to edit or remove semesters, as a generic confirm dialog (the app's other modals draw their own overlays and sizes), or inline inside a page section.

## What the consumer provides

- `isOpen: boolean` — when false the component renders nothing.
- `onClose: () => void` — called on Escape, on a click on the overlay outside the panel, and by 취소.
- `onAdd: (year: number, term: Term) => void` — called on submit when the pair is not a duplicate and `isLoading` is false. `Term = 'spring' | 'fall'` (1학기 / 2학기).
- `existingSemesters: Array<{ year: number; term: Term }>` — seeds the default selection and flags duplicates. Defaults: no semesters → 1학년 1학기; otherwise the semester after the latest (1학기 → same year 2학기; 2학기 → next year 1학기, capped at 5학년).
- `isLoading?: boolean` — default `false`; disables every control and puts 추가 in its spinner state.
- No `children`, no `className`, no ref. Container: render it at the root of the page; the overlay is `position: fixed` and covers the viewport.

## Anatomy and states

- Overlay: `position: fixed; inset: 0`, `z-modal`, flex-centered, fill `black-a50`. No padding gutter: below 448px wide the panel touches the edges. The panel has no max-height or scroll.
- Panel: Card (`w-full max-w-md bg-white`) — width 100% up to `container-md` (448px), `radius-lg`, 1px `border-default` (the bare `border` is currentColor = `gray-900`), fill `white`, text `gray-900`, `shadow-sm`; hover lifts to `shadow-md` over `duration-slow` `ease-standard`. CardContent with `pt-6` → `space-6` padding on all sides.
- Title `<h2>` 학기 추가: `heading-2` size at weight 600 (24px/32px) in inherited `gray-900` (17.7:1 on white), `space-6` below.
- Form: children stack with `space-6`.
- Field labels 학년 / 학기: `body-sm-medium` in `gray-700` (10.3:1), `space-2` below.
- 학년 grid: five equal columns, gap `space-2`. 학기 grid: two columns, gap `space-3`.
- Segment buttons: 2px border, `radius-md`, weight 500, `transition-colors` over `duration-fast` `ease-standard`, `cursor: pointer`. 학년 segments pad `space-2-5` × `space-2` at `body-sm-medium` with `white-space: nowrap`; 학기 segments pad `space-3` × `space-4` and, having no text-size class, inherit `body` (16px/24px) at weight 500.
  - Unselected: border `gray-300` (1.5:1 on white — source pair, kept, flagged), fill `white`, text `gray-700`; hover turns the border `gray-400` (2.6:1 — kept, flagged).
  - Selected: border `yu-navy` (11.2:1), fill `yu-navy-a10`, text `yu-navy` (9.4:1 on the tint). No hover change.
  - isLoading: `disabled`, `opacity-disabled`, `cursor: not-allowed`.
  - Focus: no classes in the source; the browser's default focus-visible outline shows.
- Duplicate warning (only while the selection already exists): fill `red-50`, 1px `red-200` border (1.3:1 on red-50 — decorative, kept), `radius-md`, padding `space-3`; text `body-sm-medium` in `red-700` (5.9:1).
- Footer: flex, gap `space-3`, `space-2` above. 추가 sits LEFT and 취소 RIGHT, both stretched with `flex: 1`.
  - 추가 = primary Button: `control-md`, padding `space-2` × `space-4`, `radius-md`, `body-sm-medium` in `white` on the `yu-navy → yu-blue` oklab gradient (11.2:1 / 5.5:1), `shadow-sm`; hover `yu-navy-hover → yu-navy` with `shadow-md`. Disabled (`opacity-disabled`, `pointer-events: none`) while duplicate or loading.
  - 취소 = outline Button: 1px `gray-300` (1.5:1 — flagged), fill `white` → `gray-50` on hover, label inherits `gray-900`. Disabled while loading.
  - Both: `transition: all duration-base`, `scale(0.98)` on active, focus-visible ring `0 0 0 2px white, 0 0 0 4px currentColor` — white, so invisible, on the primary; `gray-900` on the outline. Kept exact, flagged.
- Loading: 추가 shows an `icon-md` spinner (`cp-spin` 1s linear; track `opacity-spinner-track`, head `opacity-spinner-head`) and 로딩중...; 취소 and every segment are disabled.

## Copy

- 학기 추가 · 학년 · 학기
- 1학년 · 2학년 · 3학년 · 4학년 · 5학년 · 1학기 · 2학기
- `{year}학년 {1학기|2학기}는 이미 추가되어 있습니다.` (preview: 2학년 1학기는 이미 추가되어 있습니다.)
- 추가 · 취소 · 로딩중...

## Accessibility

- The overlay is a plain `<div>`: no `role="dialog"`, `aria-modal` or `aria-labelledby`; focus is not moved into the dialog on open, not trapped, and not restored on close, so the page behind stays tabbable.
- Escape closes through a `window` keydown listener (mounted with the component); a click on the overlay outside the panel also closes.
- The selectors are `type="button"` elements in a grid, not a radiogroup: no `aria-pressed` or `aria-checked`, so the selected state is color-only; Tab visits each button and arrow keys do nothing.
- The `<label>` elements have no `htmlFor`, so 학년 and 학기 are not associated with their groups.
- The duplicate warning is plain text without a live region; the disabled 추가 is the only other cue.
- Segments keep the browser default focus ring; the Buttons use the keyboard-only currentColor ring, invisible on the primary.
- `isLoading` disables every control with no `aria-busy`; the spinner SVG has no `aria-hidden`.

## Not reproduced

- `isOpen` mount/unmount, the Escape and backdrop-click `onClose`, the submit through `onAdd` and the planner mutation.
- Smart defaults and the duplicate computation from `existingSemesters` (the preview hard-codes 2학년 1학기 as the duplicate).
- Selection changes on click and the idle ↔ loading switch; hover, selected and loading are shown at rest through `.is-hover`, `.is-selected` and `disabled`.
- The overlay is pinned to the preview stage with `.cp-add-semester-dialog--staged` instead of `position: fixed`.

Static rendition hand-translated from `src/components/features/AddSemesterDialog.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx`.
