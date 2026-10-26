The chip-row filters the app writes inline into its pages: five recipes of small toggle `<button>`s — planner 학년 pills, CourseCatalog 학과 · 학년 · 학기 · 이수 chips, statistics gradient chips in two sizes, calendar pill chips and the admin 개설 학기 multi-select — none of which shares a component.

## Use it for / don't use it for

- Use the `yu-navy` pill to narrow by year (planner 학년, catalog 학년), as the catalog's 내 학과/주전공 chip and as its 학년 and 이수 전체 chips. The catalog's semester (emerald), department (indigo/purple/orange) and category chips use their own palettes. The planner row scrolls; the catalog 학년 | 학기 and 이수 rows wrap.
- Use the statistics gradient chips when the filter is the main control of a page section and sits in its own `Card`: the 16px size for the primary facet (category), the `text-sm` size for the secondary facet (semester) under a hairline divider.
- Use the calendar pill when each option has its own color that the filtered items also wear (the active chip takes the event's `categoryColors`).
- Use the admin `yu-cyan` toggle only in forms where several values can be on at once (개설 학기 in the course form).
- Don't mix recipes in one view, and don't use chips for navigation between pages or for status badges — the app renders those as `<span>`s (CourseCard, Statistics) and as nav links (AppHeader).

## What the consumer provides

- Each recipe keeps the selection in local state and renders one `<button>` per option. statistics categories and calendar render 전체 as a separate first button before the map; admin toggles entries in `formData.semesters`. A chip is active when the state equals the option (admin: when `formData.semesters.includes(sem)`).
- planner/page.tsx: `semesterYearFilter: number | null`, default `null` (전체), options `[null, ...Array.from(semestersByYear.keys()).sort()]`; clicking a semester column (handleSemesterFocus) also sets it to that semester's year, whether the click focuses or unfocuses it. Rendered only when `semestersByYear.size > 0`, with `data-export-ignore`.
- CourseCatalog.tsx 이수: `categoryFilter: RequirementCategory | undefined`, default `undefined` (전체), options `[undefined, ...usedCategories]` — only categories present in the fetched courses, in fixed order; hidden on the 공통 tab and while the catalog is collapsed (접기).
- CourseCatalog.tsx 학과 · 학년 · 학기: `deptFilter: 'primary' | 'secondary' | 'common'`, default `userDepartment ? 'primary' : 'common'` (내 학과/주전공 renders only with `userDepartment`, 복수전공 or 부전공 only when `secondaryDepartment` is set and `majorType !== 'single'`, 공통 always); `yearFilter: number | undefined`, default `undefined` (전체), options `[undefined, 1, 2, 3, 4, 5, 6]`; `semesterFilter: Semester | undefined`, default `undefined` (전체), options `[undefined, 'spring', 'fall']`. The 학년 | 학기 row is hidden on the 공통 tab, and switching to 공통 resets both to `undefined`; collapsing hides all three rows.
- statistics/page.tsx: `selectedCategory: 'all' | RequirementCategory`, default `'all'` (전체), over `CATEGORY_LABELS`; `selectedSemester: 'all' | string`, default `'all'` (전체 학기), over `semesterOptions` built from the data (`{ value: 'all', label: '전체 학기' }`, then `'${year}-${term}'` → `${year}학년 ${1|2}학기`). Each click also resets `visibleCount` to 3.
- calendar/page.tsx: `selectedCategory: AcademicEventCategory | 'all'`, default `'all'` (전체), over `categoryLabels`.
- admin/courses/page.tsx: `formData.semesters: Semester[]`, default `[]` (`EMPTY_FORM`; edit: the course's semesters, `[...course.semesters]`), `toggleSemester(sem)` adds or removes; `ALL_SEMESTERS` = spring, summer, fall, winter; submit is refused while the array is empty.
- Containers: the planner and calendar rows sit directly on the `gray-50` dashboard frame; the catalog rows inside the white `.cp-course-catalog` header; the statistics rows in `<Card className="mb-6 p-4">` (`.cp-card` + `.cp-filter-chips__panel`); the admin row in the white `radius-2xl` form modal.

## Anatomy and states

- Rows: statistics and admin `flex flex-wrap gap: space-2` with no `items-center`, so chips stretch to their line; calendar the same plus `margin-bottom: space-4` (`.cp-calendar__filters`); planner `items-center`, `gap: space-1-5`, `overflow-x: auto`, `padding-bottom: space-0-5`, chips `flex-shrink: 0`. Catalog: rows stacked `space-1-5` apart, each `items-center`, `gap: space-1`; the 학과 row adds `padding-bottom: space-1` and does not wrap (`--dept`); the 학년 | 학기 row wraps with `column-gap: space-3`, `row-gap: space-1` and holds two `gap: space-1` groups split by a 1px × `space-4` `gray-200` divider (`--year-sem`, `__filter-group`, `__divider`); the 이수 row wraps, chips `white-space: nowrap` (`--category`).
- Row labels: planner 학년 and catalog 학과, 학년, 학기, 이수 are 11px at weight 500 (`micro-11` size and weight) with the inherited 16.5px line-height; the token's 16px line-height does not apply. Color `gray-400` — 2.5:1 on `gray-50`, 2.6:1 on `white` in the source, kept, flagged. The catalog 학년 and 학기 labels are fixed at `space-7` wide (`__filter-label--fixed`).
- Planner pill (`.cp-filter-chips__chip--planner`): `caption-medium`, padding `space-0-5` × `space-2`, `radius-full`, no border, `transition-colors` over `duration-fast`. Inactive fill `yu-navy-a10` with `yu-navy` label (9.0:1 over `gray-50`); hover `yu-navy-a20` (7.5:1); active fill `yu-navy`, label `white` (11.2:1). Active chips carry no hover class.
- Catalog chip (`.cp-course-catalog__chip`): same box as the planner pill on `white`. The `yu-navy` family serves 내 학과/주전공, 학년 and the 학년 and 이수 전체 chips (9.4:1 inactive, 7.8:1 hover, 11.2:1 active). Every other palette runs inactive `*-50` fill / `*-600` label → hover `*-100` → active `*-500` fill / `white`. 학과: 공통 `indigo` (5.8 → 5.2 → 4.6:1), 복수전공 `purple` (5.2 → 4.7 → 4.1:1), 부전공 `orange` (3.4 → 3.1 → 2.9:1). 학기, 전체 included: `emerald` (3.5 → 3.2 → 2.5:1). 이수: 전공핵심 `red` (4.4 → 3.9 → 3.8:1), 전공필수 `rose` (4.1 → 3.8 → 3.8:1), 전공선택 `orange` (3.4 → 3.1 → 2.9:1), 교양필수 `blue` (4.8 → 4.3 → 3.8:1), 교양선택 `green` (3.1 → 2.9 → 2.2:1), 교직 `violet` (5.4 → 5.0 → 4.4:1), 자유선택 `gray-100` / `gray-600` → `gray-200` → `gray-500` (6.9 → 6.1 → 4.8:1). Every pair below 4.5:1 misses in the source and is kept, flagged; among the 이수 chips only 교양필수 and 교직 inactive, 교직 hover and all three 자유선택 states pass.
- Statistics category chip (`.cp-filter-chips__chip--stat`): `body` size at weight 500 (16px/24px, 40px tall), padding `space-2` × `space-4`, `radius-lg`. Inactive `gray-100` fill, `gray-700` label (9.4:1); hover `gray-200` (8.3:1); active `linear-gradient(to right in oklab, yu-navy, yu-blue)` with `white` label (11.2:1 at the start, 5.5:1 at the end). Semester chip (`--stat-sm`): `body-sm-medium`, padding `space-1-5` × `space-3`, 32px tall, same colors.
- Statistics framing: hint `<p>` `body-sm` in `gray-500` (4.8:1) with `margin-bottom: space-3`; the semester section adds `margin-top: space-4`, `padding-top: space-4` and a 1px `border-default` top rule (bare `border-t` inside the `gray-900` Card).
- Calendar chip (`.cp-calendar__chip`): `body-sm-medium`, padding `space-1` × `space-3`, `radius-full`. Inactive `white` fill, `gray-700` label (10.3:1), 1px `gray-300` border (1.4:1 on `gray-50`, flagged), hover `gray-50`. Active 전체 `blue-600` fill, `white` label (5.2:1). Active category: `blue-100`/`blue-700` 학사 (5.6:1), `green-100`/`green-700` 수강신청 (4.5:1), `red-100`/`red-700` 시험 (5.3:1), `rose-100`/`rose-700` 공휴일 (5.0:1), `gray-100`/`gray-700` 기타 (9.4:1); their `border-*-200` sets only a color, the width stays 0. Active chips have no border at all, so a chip that becomes active loses 1px per side: its label moves 1px left and the chips after it 2px; the row's flex stretch hides the 2px height loss.
- Admin toggle (`.cp-filter-chips__chip--admin`): `caption-medium`, padding `space-1-5` × `space-3`, `radius-lg`, `cursor: pointer`. Inactive `slate-100` fill, `slate-600` label (6.9:1); hover `slate-200` (6.2:1); active `yu-cyan` fill, `white` label — 2.8:1 in the source, kept, flagged. Field label `body-sm-medium` in `slate-700` (10.4:1), `margin-bottom: space-2`, asterisk `red-500` (3.8:1, flagged).
- No recipe styles `:focus`, `:active` or `:disabled`.

## Copy

- Planner: `학년`, `전체`, `{y}학년`.
- Catalog: `학과`, `내 학과` / `주전공`, `복수전공` / `부전공`, `공통`; `학년`, `전체`, `1`–`6`; `학기`, `전체`, `1학기`, `2학기`; `이수`, `전체`, `전공핵심`, `전공필수`, `전공선택`, `교양필수`, `교양선택`, `교직`, `자유선택`.
- Statistics: `이수구분별로 인기 과목을 필터링할 수 있습니다`, `전체`, the seven category labels above; `학기별로 필터링할 수 있습니다`, `전체 학기`, `{year}학년 1학기` / `{year}학년 2학기`.
- Calendar: `전체`, `학사`, `수강신청`, `시험`, `공휴일`, `기타`.
- Admin: `개설 학기 *`, `1학기`, `여름학기`, `2학기`, `겨울학기`.

## Accessibility

- Every chip is a native `<button>` with its visible label as the only name; none carries `aria-pressed`, `aria-selected`, `role="radiogroup"` / `role="tablist"` or an `aria-label`, so the active state is color-only. Only the admin chips set `type="button"` (they sit inside a `<form>`).
- Keyboard: Tab reaches each chip; Enter/Space activates the chip: it selects that option in the single-select rows and toggles it in the admin row; no arrow-key movement. No source sets a focus class, so only the browser default outline shows.
- The admin `<label>` has no `htmlFor` and wraps no control, so the toggles are not associated with it; the asterisk is plain text.
- Contrast misses listed above: the 11px `gray-400` labels, most catalog 이수 pairs, the catalog 부전공 and 학기 chips and the active 복수전공 chip, `white` on `yu-cyan`, the `gray-300` border, the `red-500` required asterisk (3.8:1).

## Not reproduced

- State changes on click (the active chip is fixed with `.is-active`), the statistics `visibleCount` reset, the catalog's 학년/학기 reset on switching to 공통 and the planner coupling between semester focus and the year filter.
- Data-driven option lists: planner years from the plan, catalog `usedCategories` from the fetched courses and 학과 chips from the profile's departments, statistics semesters from `courseStats`; the catalog 이수 and 학년 | 학기 rows hidden on the 공통 tab and while the catalog is collapsed (접기), which also hides the 학과 row; the admin form's empty-array validation toast.
- The planner row's horizontal scrolling on narrow screens and its `data-export-ignore` removal during PNG/PDF export.
- Hover is shown at rest through `.is-hover` on one chip per recipe; the real `:hover` also works in the preview. The calendar row and the catalog 학과 and 이수 rows are doubled so every active color is visible; in the app one chip per row is active, and 복수전공 and 부전공 never render together (one per `majorType`).

Pattern extracted from inline markup in `src/app/(dashboard)/planner/page.tsx`, `src/components/features/CourseCatalog.tsx`, `src/app/(dashboard)/statistics/page.tsx`, `src/app/(dashboard)/calendar/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`; no component exists in the source
