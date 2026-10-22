Droppable semester card for the planner grid: a header with year/term, credit total and category breakdown, clear and delete icon buttons and a Focus badge, above a dashed dropzone or a list of draggable compact CourseCard rows with a show-more toggle.

## Use it for / don't use it for

Use it for one semester inside the planner's `grid grid-cols-1 sm:grid-cols-2 gap-3`, always with `compact` (the planner page never renders the default size). Use it as the dnd-kit drop target for courses dragged from the catalog or from another semester. Don't use it for the shared/read-only plan view — that is `ReadOnlySemesterColumn` — and don't use it outside a `DndContext`; the ring and wash states come from `useDroppable`.

## What the consumer provides

- `semester: { year: number; term: 'spring' | 'fall'; courses: Array<{ id; code; name; credits; category?; status }> }` — required. `spring` renders 1학기, `fall` 2학기.
- `onRemoveCourse: (courseId: string) => void` — required; passed to each row's 과목 제거 button.
- `onDelete?: () => void` — shows the 학기 삭제 button when given.
- `onClear?: () => void` — shows the 학기 초기화 button when given and the semester has courses.
- `isFocused?: boolean` (default `false`), `onFocus?: () => void` — header click handler.
- `compact?: boolean` (default `false`) — p-2, text-sm header, min-height 180px, 4 visible rows (`MAX_VISIBLE`) with +N개 더 보기 / 접기.
- `onStatusChange?: (courseId, newStatus) => void` — passed through to each row's status pill.
- Reads `usePlanStore(s => s.isExporting)`: while exporting, the focus ring, both icon buttons, the collapse and the show-more button are all hidden and every row is shown.
- No children. Expects a block container; the default size wants a parent with a definite height (`h-full min-h-[400px]`).

## Anatomy and states

- Root: Card base — `radius-lg`, fill `white`, text `gray-900`, `shadow-sm` → `shadow-md` on hover over `duration-slow`. The bare `border` is currentColor, so the hairline is `border-default` (gray-900), exactly as the product draws it. Default `min-height` 400px and `h-full`; `--compact` 180px.
- Focused (`isFocused && !isExporting`): border `yu-cyan` plus a 2px ring `yu-cyan` layered in front of the shadow. `yu-cyan` on the `gray-50` page is 2.6:1 — the source pair, kept, flagged.
- Drop target (`isOver`): 2px ring `yu-cyan-a50` and fill `yu-cyan-a5`. When focused and hovered by a drag at once, twMerge keeps the later ring colour, so the ring dims to `yu-cyan-a50`.
- Header: padding `space-4` (`--compact` `space-2`), bottom hairline `border-default`, fill `gray-50` → `yu-navy-a5` when focused, `cursor: pointer`, `transition-colors` over `duration-fast`. Clicking it calls `onFocus`.
- Title `h3`: 600 18px/28px (`--compact` 14px/20px) in `gray-800`. Credit line `p`: 14px/20px (`--compact` 12px/16px) in `gray-500`, `space-1` above; the breakdown `span` is `gray-400` with `space-1` left margin — 2.5:1 on `gray-50`, kept, flagged.
- Action cluster `gap: space-2`. Icon buttons: padding `space-1`, `radius-full`, no pointer cursor; clear hovers to `amber-100`, delete to `red-100`. Icons 16px (`icon-md`) in `gray-400` (2.5:1 on `gray-50`, flagged); the svg itself hovers to `amber-500` / `red-500` with no transition.
- Focus badge: `space-1`/`space-2` padding, fill `yu-navy`, text `white` 500 12px/16px, `radius-full` (11.2:1).
- Body: `flex: 1`, padding `space-4` (`--compact` `space-2`). Empty state: `border: 2px dashed gray-200` (1.2:1 on white — decorative-grade, kept), `radius-lg`, text `gray-400` 14px/20px (`--compact` 12px/16px), 2.6:1 on white — kept, flagged. Its `h-full` does not resolve inside the auto-height flex column, so the product shows a 20px dashed strip at the top of the body, not a filled box — reproduced as is.
- List: `transition-all` over `duration-base`; `.is-collapsed` (compact, not expanded, not exporting) clamps to `max-height: 280px; overflow: hidden`. Each row is a `DraggableSemesterCourse` wrapper (`touch-action: none`, `.is-dragging` → opacity `opacity-disabled`) around a compact CourseCard: fill `status-planned-bg`, border `status-planned-border`, pill `pill-planned-bg`/`pill-planned-text` at 9px (5.6:1), chip `category-*` at 10px, name `gray-800` 500 12px/16px truncated, credits `gray-500` 10px.
- +N개 더 보기: full width, 12px/16px, `yu-blue` → `yu-navy` on hover (5.5:1 / 11.2:1), padding `space-1` 0, no transition, no pointer cursor. 접기: same metrics in `gray-400` → `gray-600`.

## Copy

- Title: `{year}학년 1학기` / `{year}학년 2학기`. Credit line: `{total}학점`, breakdown `(전핵3 · 전필3 · 전선6 · 교필10 · 교선2 · 교직2 · 자선3)` using the short labels 전핵 / 전필 / 전선 / 교필 / 교선 / 교직 / 자선, joined by ` · `.
- Badge: `Focus`. Buttons: `aria-label="학기 초기화"`, `aria-label="학기 삭제"`, `+{hiddenCount}개 더 보기`, `접기`.
- Empty state: `과목을 드래그하세요`; when focused `과목 리스트에서 + 버튼으로 과목을 추가하세요`.
- Confirms: `이 학기의 모든 과목({n}개)을 제거하시겠습니까?` (clear); `이 학기에 {n}개의 과목이 있습니다. 정말 삭제하시겠습니까?` (delete, only when the semester has courses).

## Accessibility

- The two icon buttons carry Korean `aria-label`s; the show-more and collapse buttons rely on their visible text. Row buttons come from CourseCard (`aria-label="과목 제거"`, `aria-label="상태 변경: {status}"`).
- The header is a plain `div` with `onClick` — not focusable, no role, no key handler, so focusing a semester is pointer-only.
- Each row wrapper spreads dnd-kit's `attributes`: `role="button"`, `tabindex="0"`, `aria-roledescription="draggable"`, `aria-describedby`, `aria-pressed`, `aria-disabled` — a focusable button that nests the status pill and 과목 제거 buttons. The planner's `DndContext` registers only `MouseSensor` and `TouchSensor`, so the rows are tab-focusable but keyboard drag is not wired.
- No `aria-live` for drop results; dnd-kit's own announcements live in the parent `DndContext`. No visible keyboard focus styles are defined on any button (browser default outline only).
- Interactive text runs down to 9px (status pill) and 12px.

## Not reproduced

- dnd-kit `useDroppable` / `useDraggable` (the `isOver` ring, the dragged-row translate and `opacity-50` ghost) — shown through `.is-over` and `.is-dragging` mirror classes.
- dnd-kit row attributes (`role`/`tabindex`/`aria-*`): the preview rows carry `role="button" tabindex="0" aria-roledescription="draggable"` as static markup; `aria-describedby` (and its hidden instructions node), `aria-pressed` and `aria-disabled` are not rendered.
- The default size (`compact` false: p-4, text-lg/text-sm, `h-full min-h-[400px]`) and the expanded list with the 접기 button are in the stylesheet (`.cp-semester-column` without `--compact`, `.cp-semester-column__less`) but not rendered; the planner only renders compact.
- `window.confirm` dialogs, `onFocus` toggling, `isExpanded` state and the `isExporting` store flag.
- The first-visit pulse on 예정 pills (`animate-pulse ring-2 ring-blue-300/50` until the first status click).

Static rendition hand-translated from `src/components/features/SemesterColumn.tsx`, `src/components/features/CourseCard.tsx`, `src/components/ui/Card.tsx`.
