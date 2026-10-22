Draggable course tile for semester columns and the course catalog: the surface tint encodes course status, small chips encode requirement category, department (복수전공/부전공) and status, with an optional remove X and a click-to-toggle status pill.

## Use it for / don't use it for

- Use it for one course inside a `SemesterColumn` (default or `compact`) and for every item in `CourseCatalog` (default mode; pass `isDragDisabled` when the course is already in the plan and `departmentLabel` under the secondary-department filter).
- Use it as the drag ghost in the planner's `DragOverlay`: `compact`, no pill or X (no `onStatusChange` / `onRemove`), inside a 250px wrapper with `shadow-lg` and `opacity-90`.
- Don't use it for read-only plan views (`ReadOnlySemesterColumn` draws its own rows), for lists outside the planner, or as a generic surface — use `Card` for that.
- The whole card is the drag handle (`cursor: move`); the parent `DraggableSemesterCourse` / catalog wrapper owns the dnd-kit code and fades the wrapper to `opacity-50` while dragging.

## What the consumer provides

- `course: { _id?: Types.ObjectId | string, id?: string, code: string, name: string, credits: number, category?: 'major_required' | 'major_compulsory' | 'major_elective' | 'general_required' | 'general_elective' | 'free_elective' | 'teaching', status?: 'planned' | 'enrolled' | 'completed' | 'failed' }` — `code` is never rendered; a missing `status` renders the planned surface and, in default mode, no status pill (the compact pill renders whenever `onStatusChange` is set and then reads 예정).
- `index?: number` — accepted for `SemesterColumn`, unused in render.
- `onRemove?: () => void` — shows the X (hidden while `isDragDisabled`).
- `onStatusChange?: (courseId: string, newStatus: 'planned' | 'enrolled' | 'completed' | 'failed') => void` — turns the status pill into a toggle: `completed` → `planned`, anything else → `completed`.
- `isDragDisabled?: boolean` (no default; undefined is falsy), `compact?: boolean` (false — the only declared default), `departmentLabel?: string` (`'복수전공'` purple, `'부전공'` orange, anything else gray).
- No children. Place it in a vertical stack; the card carries its own `margin-bottom` (`space-2`, compact `space-1`) and fills the parent width (about 300px in the planner grid).

## Anatomy and states

- Root (`Card` base + status): radius `radius-lg`, 1px border, `shadow-sm` → `shadow-md` on hover over `duration-slow` with `ease-standard`, text `gray-900`, padding `space-3` (compact `space-1-5` × `space-2`). Surfaces: planned `status-planned-bg` (`yu-navy-a5`) / `status-planned-border` (`yu-navy-a20`); enrolled `status-enrolled-bg` (`green-50`) / `status-enrolled-border` (`green-200`); completed `status-completed-bg` (`gray-50`) / `status-completed-border` (`gray-200`); failed `status-failed-bg` (`red-50`) / `status-failed-border` (`red-200`). twMerge lets the status background win over the base `bg-white`. All four status borders sit between 1.2:1 and 1.5:1 on white — kept, flagged; the status label is the readable carrier.
- `isDragDisabled`: `opacity: 0.6` (no token at this step — literal kept), `cursor: not-allowed`, remove X hidden; the catalog wrapper adds its own `opacity-50` for in-plan items, so the visible result is about 0.3.
- Chip row (default only): flex, gap `space-1-5`, margin-bottom `space-1`.
- Category chip: `caption-medium` (12px/16px 500), padding `space-0-5` × `space-1-5`, radius `radius-sm`. Fill / text: 전공핵심 `category-major-required-bg` / `-text` (`red-100` / `red-700`, 5.3:1); 전공필수 `category-major-compulsory-bg` / `-text` (`rose-100` / `rose-700`, 5.0:1); 전공선택 `category-major-elective-bg` / `-text` (`orange-100` / `orange-700`, 4.6:1); 교양필수 `category-general-required-bg` / `-text` (`blue-100` / `blue-700`, 5.6:1); 교양선택 `category-general-elective-bg` / `-text` (`green-100` / `green-700`, 4.5:1); 교직 `category-teaching-bg` / `-text` (`violet-100` / `violet-700`, 6.2:1); 자유선택 and unknown categories `category-free-elective-bg` / `-text` (`gray-100` / `gray-600`, 6.9:1). Compact: `micro-10` (10px, inherited 1.5 line-height = 15px), padding `space-0-5` × `space-1`, `white-space: nowrap`.
- Department chip: same shape; 복수전공 `dept-double-major-bg` / `-text` (`purple-100` / `purple-700`, 6.0:1); 부전공 `dept-minor-bg` / `-text` (`orange-100` / `orange-700`, identical to 전공선택).
- Status pill, default mode: `caption` (12px/16px 400) in inherited `gray-900`, padding `space-0-5` × `space-2`, `radius-full`, fill `white`, border 1px `border-default` — the source's bare `border` is currentColor under Tailwind v4, so the hairline is `gray-900`, not gray-200. As a toggle (`onStatusChange`): `cursor: pointer`, hover fill `gray-50` and border `gray-400` over `duration-fast`. Without `onStatusChange` it is a static `span` with no hover.
- Status pill, compact mode (only with `onStatusChange`): `micro-9` (9px, inherited line-height 13.5px, 500), padding `space-0-5` × `space-1-5`, `radius-sm`, `transition: all duration-fast`. Fill / text: 예정 `pill-planned-bg` / `-text` (`blue-100` / `blue-700`); 수강중 `pill-enrolled-bg` / `-text` (`green-100` / `green-700`); 이수 `pill-completed-bg` / `-text` (`emerald-100` / `emerald-700`, 4.7:1); 재수강 `pill-failed-bg` / `-text` (`red-100` / `red-700`). Hover: ring `0 0 0 1px white, 0 0 0 3px gray-300` (1.5:1 on white — kept, flagged). First-visit hint on a planned pill: `cp-pulse` 2s plus a 2px ring of `blue-300` at 50% alpha (`color-mix`), until the first status click in the session.
- Name: `body-sm-medium` (14px/20px 500) in `gray-800`, one line, ellipsis. Compact: `caption-medium` (12px/16px 500).
- Credits: `caption` in `gray-500`, margin-top `space-1` (4.4:1 on the planned and failed surfaces, 4.6:1 on enrolled and completed — source pairs kept, flagged). Compact: 10px/15px 400 (un-tokenised — `micro-10` is weight 500), no margin, nowrap.
- Remove X: button padding `space-1` (compact `space-0-5`), margin-left `space-2` (compact none), `radius-full`, hover fill `white` over `duration-fast`. Icon `icon-md` (compact `icon-xs`) in `gray-400` (2.4:1 on the planned surface — kept, flagged); the icon itself turns `red-500` on hover (3.5:1 — kept, flagged), with no transition.

## Copy

- Status labels (default pill and `aria-label`): `계획`, `수강중`, `완료`, `재수강`.
- Compact pill labels: `예정`, `수강중`, `이수`, `재수강` — a second vocabulary for the same enum.
- Category labels: `전공핵심`, `전공필수`, `전공선택`, `교양필수`, `교양선택`, `교직`, `자유선택`. Department labels: `복수전공`, `부전공`.
- Credits: `{credits}학점` (no space).
- `aria-label="상태 변경: {계획|수강중|완료|재수강}"` on both status toggles; `title="클릭하여 상태 변경: 예정 ↔ 이수"` on the compact pill only; `aria-label="과목 제거"` on the X.

## Accessibility

- Status toggles and the X are real `<button>` elements with Korean `aria-label`s; the compact pill also has a `title` tooltip. The X icon is `fill="currentColor"` with no title of its own.
- No `focus-visible` styles anywhere: keyboard focus shows only the browser default ring. The buttons never set `type`, and the X has no visible label.
- Status, category and department are conveyed by color and text together; the card surface alone is color-only.
- 9px interactive text on the compact pill and a 16–24px X hit area are below common target-size guidance — kept from source.
- The pulse hint stops at the first click but is not persisted and does not respect `prefers-reduced-motion`.

## Not reproduced

- Drag and drop (dnd-kit transform, `touchAction: none`, the wrapper's `opacity-50` while dragging) — the card only shows `cursor: move`.
- `onStatusChange` / `onRemove` click handling and the `statusHintShown` module flag; the preview shows the hint as a resting `--hint` modifier.
- The catalog wrapper's floating `+` add button that sits over the card when a semester is focused, and the `커스텀` / `공통` / `추가됨` corner badges the catalog wrapper overlays on the card.
- The planner `DragOverlay` wrapper around the drag ghost (`w-[250px] shadow-lg rounded-lg opacity-90 pointer-events-none`).

Static rendition hand-translated from `src/components/features/CourseCard.tsx` and `src/components/ui/Card.tsx`.
