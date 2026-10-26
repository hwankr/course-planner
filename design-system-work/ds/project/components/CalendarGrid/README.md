The academic calendar page (학사일정): category filter chips, a month grid of day cells with colored event chips, an event detail Card and the month's event list.

## Use it for / don't use it for

- Use it for the one `/calendar` route: a month of DB events plus generated Korean holidays, filtered by a single category at a time, with admin editing.
- Use the `categoryColors` pairs (`*-100` fill, `*-700` text) wherever an `AcademicEventCategory` needs a chip or badge; the fragment carries them as `--academic` … `--other` modifiers on chip, event and badge.
- Don't use the grid as a date picker in forms (the modal itself uses native `<input type="date">`), and don't borrow the today/selected cell colors for course status — those live on CourseCard.

## What the consumer provides

- No props: `CalendarPage` is a client page. State: `currentDate` (first of month) → `year`, `month`; `today = new Date()`; `selectedDate: Date | null`; `selectedEvent: CalendarEvent | null`; `selectedCategory: AcademicEventCategory | 'all'` (default `'all'`); `showEventForm`, `editingEvent`, `formData: EventFormData`.
- Data: `useAcademicEvents(year, month + 1)` → `{ events, holidays }` merged into `CalendarEvent[]` (holidays get `isSystemHoliday`); `eventsByDate: Map<'YYYY-MM-DD', CalendarEvent[]>` (an event longer than 7 days is keyed on its start and end day only); `calendarDays: (Date | null)[]` with leading `null`s; `sortedEvents` drops system holidays.
- `isAdmin` from `useAuth()` shows 일정 추가 and the Pencil/Trash2 actions and makes a day click open the form prefilled with that date (at every width; at md it also restores `cursor: pointer`).
- Container: page root `min-h-screen bg-gray-50 p-4 md:p-8` (`.cp-calendar__page`) → `max-w-7xl mx-auto` (`.cp-calendar`). Cards are `Card`/`CardContent` from `@/components/ui` (`.cp-card`, `.cp-card__content`).

## Anatomy and states

- Page, top to bottom, all inline in one page file: header with the admin 일정 추가 button, single-select category filter chips, the month Card (prev/next/오늘 navigation and a 7-column grid of day cells carrying up to three colored event chips), the mobile selected-day panel, the event detail Card with a 4px `yu-cyan` left rail, the 이번 달 일정 list and the admin create/edit modal.
- Header: CalendarDays `icon-2xl` and the `<h1>` at `heading-2` → `heading-1` at md, both `yu-navy` by inline style (10.7:1 on `gray-50`), gap `space-3`, row `margin-bottom: space-6`. 일정 추가: `yu-navy` fill, `white` label at `body` (11.2:1), padding `space-2` × `space-4`, `radius-lg`, Plus `icon-md`; `transition-colors` but no hover and no pointer.
- Filter chips: `body-sm-medium`, padding `space-1` × `space-3`, `radius-full`. Inactive: `white`, 1px `gray-300`, `gray-700` (10.3:1), hover `gray-50`. 전체 active: `blue-600` / `white` (5.2:1). A category active takes its pair: `border-*-200` sets only the color, so the active chip has no border; it is 28px on its own and stretches to the row's 30px, with its label at the same height as its neighbours.
- Month Card: `.cp-card` with `margin-bottom: space-6`; content padding `space-4` × `space-1`, `space-6` from md. Nav: chevron buttons padded `space-2`, `radius-lg`, hover `gray-100`, `icon-lg` glyph in the Card's `gray-900`; month label `heading-4` → `heading-3` at md, centered in `min-width: space-12`; 오늘 `body-sm-medium`, 1px `gray-300`, `radius-lg`, hover `gray-50`, `margin-left: space-1`; year `heading-4` → `heading-3` at md in `gray-500` (4.8:1), `margin-right: space-2`.
- Grid: 7 columns, gap 0 → `space-1` at md. Weekday cells `caption` → `body-sm` at 500, padding `space-2` × 0, 1px `gray-200` bottom rule below md only; 일 `red-600` (4.8:1), 토 `blue-600` (5.2:1), weekdays `gray-600` (7.6:1).
- Empty leading cells: `min-height: 90px`, 1px `gray-100` below md, square with no border at md (`.cp-calendar__empty`).
- Day cell: `min-height: 90px`, square (`aspect-ratio: 1 / 1`) from md, padding `space-0-5` → `space-2`, 1px `gray-200`, `radius-lg` at md, `overflow: hidden`, `transition-colors`. Default `white`, hover `gray-50`. Today: `blue-50` with 2px `blue-500` at md (3.8:1 on white, 3.5:1 on `blue-50`), 1px `blue-400` below md (2.6:1 — kept, flagged); no hover. Selected: `white` + 2px `amber-400` at md (1.7:1 on white — the only cue, misses 3:1 in the source; kept, flagged), hover `gray-50`; below md `amber-50-a50` + 1px `amber-300` (1.4:1 on white — kept, flagged). Today+selected: `blue-50`, 2px `blue-500`, `box-shadow: 0 0 0 2px amber-400` (fits the 4px gap; the ring, the only cue that separates it from plain today, is 1.7:1 on white — kept, flagged); below md `blue-100` + 1px `amber-400` (1.4:1 on `blue-100` — kept, flagged). Cursor: pointer below md, default at md, pointer again for admins (`md:cursor-default` and `md:cursor-pointer` are both emitted; the fragment keeps the intent).
- Day number: `micro-10` at 500 (10px/15px) → `body-sm-medium` at md, `margin-bottom: space-0-5` → `space-1`; `gray-700` (9.5:1 on `blue-50`), 일 `red-600` (4.4:1 on a today `blue-50` — kept, flagged), 토 `blue-600`; on a below-md today+selected `blue-100` cell 일 `red-600` is 3.9:1 and 토 `blue-600` 4.3:1 — kept, flagged.
- Desktop chips (md+): at most three, stacked `space-0-5`; `caption` text, padding `space-0-5` × `space-1`, `radius-sm`, truncate, pointer. Weight 500 when the event spans more than one day; italic when it spans more than 7 days, and then the label is `제목 ~MM.DD` on the start day and `MM.DD~ 제목` on the end day (the event appears on those two days only). Pairs: `blue-700`/`blue-100` 5.6:1, `green-700`/`green-100` 4.5:1, `red-700`/`red-100` 5.3:1, `rose-700`/`rose-100` 5.0:1, `gray-700`/`gray-100` 9.4:1. `isHoliday` prefixes `🔴 `; `title` = `제목 (MM.DD (요일) ~ MM.DD (요일))`. Overflow `+N`: `caption` in `gray-500` (4.8:1 on white; 4.4:1 on a today `blue-50` cell — kept, flagged).
- Mobile micro chips (below md): `pointer-events: none`, 1px stack, 10px/1.25 text, padding 0 × `space-0-5`, `radius-sm`; `*-700` on `*-50` (6.3 / 4.7 / 5.9 / 5.5:1; 기타 `gray-600` on `gray-50` 7.2:1); `+N` at 9px/1.25 in `gray-400` (2.6:1 on white — kept, flagged).
- Cell overflow: three chips plus `+N` need 106px of content height. Inside the dashboard `container`, cells are ~85px (90px min-height) from 768px, which clips the third chip, and 122px from 1024px, which still clips `+N` by 2px (4px on a 2px-bordered today cell). All of it fits only from 1280px.
- Mobile selected-day panel (below md): `.cp-card`, content `space-4`; title `body` at 600 in `yu-navy`; close padded `space-1` with X `icon-md` `gray-500`; rows padded `space-2-5`, 1px `gray-100`, `radius-lg`, hover `gray-50`; badge `caption-medium` padded `space-0-5` × `space-2` with `white-space: nowrap` (`.cp-calendar__badge--sm`); name `body-sm-medium` truncated; range `caption` `gray-500`; empty line `body-sm` in `gray-400` (2.6:1 — kept, flagged).
- Detail Card: `.cp-card` with `border-left: 4px yu-cyan` (inline `borderLeftColor`), `margin-bottom: space-6`, content `space-4` → `space-6`. Badge `caption-medium`, padding `space-1` × `space-2`, `radius-sm`; `🔴 공휴일` at `body-sm` in `red-600` (4.8:1); title `heading-4` in `gray-900`; date `body-sm` `gray-600`; description `body-sm` `gray-700`. Actions gap `space-2`, each `icon-md` in `space-2` padding, `radius-lg`: Pencil `gray-600` (hover `gray-100`), Trash2 `red-600` (hover `red-50`), X `gray-600`.
- 이번 달 일정: `heading-4` in `yu-navy`, `margin-bottom: space-4`; rows padded `space-3`, 1px `gray-200`, `radius-lg`, hover `gray-50`, pointer; badge as above plus `white-space: nowrap`; `🔴` at `body` in `red-600`; title at `body` 500 in `gray-900`; range `caption` `gray-600`. Loading: five `space-16`-tall `gray-100` `radius-lg` rows pulsing `cp-pulse`; empty: `body` in `gray-500`, centered, padding `space-8` × 0.
- Form modal: overlay `position: fixed; inset: 0`, `z-modal`, padding `space-4`. `bg-black bg-opacity-50` is Tailwind v3 syntax — v4 removed `bg-opacity-*`, so nothing lowers the alpha and the overlay is opaque `black`. Card `container-lg` wide, `max-height: 90vh`, content `space-6`; title `heading-3` in `yu-navy`; labels `body-sm-medium` `gray-700` with a `red-500` `*` (`red-500` on white is 3.8:1 in the source — kept, flagged); native fields 1px `gray-300`, `radius-lg`, `body` text, focus `0 0 0 2px blue-500` (not the Input `yu-cyan` ring); the checkbox's `text-blue-600 border-gray-300 rounded focus:ring-blue-500` draw nothing on a native control; 취소 1px `gray-300`, hover `gray-50`; submit `yu-navy` / `white`, `opacity-disabled` while a mutation is pending.

## Copy

- `학사일정` · `일정 추가` · `전체` · `학사` `수강신청` `시험` `공휴일` `기타` · `{n}월` · `오늘` · `{yyyy}년` · `일 월 화 수 목 금 토`.
- `🔴 ` chip prefix · `🔴 공휴일` · `+{n}` · `이 날의 일정이 없습니다.` · `이번 달 일정` · `등록된 일정이 없습니다.` · dates `MM.DD (요일)` and `MM.DD (요일) ~ MM.DD (요일)`; long chips `제목 ~MM.DD` / `MM.DD~ 제목`; panel title `{M}월 {D}일 ({요일})`.
- Modal: `일정 추가` / `일정 수정` · `제목 *` `설명` `시작일 *` `종료일` `분류` `공휴일로 표시` · `취소` · `추가` / `수정` / `저장 중...`.
- `confirm('이 일정을 삭제하시겠습니까?')`; toasts `일정이 삭제되었습니다.` `일정 삭제에 실패했습니다.` `제목과 시작일은 필수입니다.` `일정이 수정되었습니다.` `일정이 추가되었습니다.` `일정 저장에 실패했습니다.`.

## Accessibility

- Day cells, event chips and list rows are `<div onClick>`: not focusable, no role, no keyboard path; a chip exposes its full text only through `title`.
- Prev/next, close, edit and delete are icon-only `<button>`s without `aria-label` (the lucide SVGs are `aria-hidden`), so they are announced as unnamed buttons. Buttons keep the browser focus ring only; no `focus:` classes exist outside the modal fields.
- Today, selected, weekend and category are color-only — no `aria-current`, `aria-selected`, or `aria-pressed` on the filter chips. The `🔴` emoji is the one non-color holiday cue.
- The modal has no `role="dialog"`, `aria-modal`, focus trap or Escape handling; labels are unassociated except `htmlFor="isHoliday"`. Delete confirms through the native `confirm()`.
- `transition-colors` and `animate-pulse` run regardless of `prefers-reduced-motion`.

## Not reproduced

- Month navigation, 오늘, category filtering, day selection toggling, chip → detail, admin day click → form, create/update/delete mutations with their toasts, `confirm()`, the TanStack fetch and the generated Korean holidays.
- Loading (the `.cp-calendar__weekday--loading` header — `body-sm-medium` at every width, `gray-600` on all seven days including 일/토, no bottom rule — over 35 pulsing cells, `.cp-status__skeleton--cell` in StatusStates, and the five `h-16` rows), the empty leading cells before day 1 (`.cp-calendar__empty`; the preview starts on the 18th) and both empty states: styled, not shown.
- Below-md layout (gapless grid, micro chips, the selected-day panel): styled in the fragment, hidden at the 960px frame. The form modal: styled, not shown (fixed overlay).
- Hover on cell 19, the 시험 chip, Trash2 and the second list row is shown at rest with `.is-hover`; today+selected on 29 is a mirror state (22 is the real today).

Pattern extracted from inline markup in `src/app/(dashboard)/calendar/page.tsx`; no component exists in the source
