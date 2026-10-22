The chip-row filters the app writes inline into its pages: five recipes of small toggle `<button>`s — planner 학년 pills, CourseCatalog 이수 category chips, statistics gradient chips in two sizes, calendar pill chips and the admin 개설 학기 multi-select — none of which shares a component.

## Use it for / don't use it for

- Use the `yu-navy` pill (planner, CourseCatalog) to narrow a dense list by one attribute — year, semester, department, category — inside a planner panel or at the head of a grid; the row scrolls (planner) or wraps (catalog).
- Use the statistics gradient chips when the filter is the main control of a page section and sits in its own `Card`: the 16px size for the primary facet (category), the `text-sm` size for the secondary facet (semester) under a hairline divider.
- Use the calendar pill when each option has its own color that the filtered items also wear (the active chip takes the event's `categoryColors`).
- Use the admin `yu-cyan` toggle only in forms where several values can be on at once (개설 학기 in the course form).
- Don't mix recipes in one view, and don't use chips for navigation between pages or for status badges — the app renders those as `<span>`s (CourseCard, Statistics) and as nav links (AppHeader).

## What the consumer provides

- Every recipe is `useState` + `options.map(option => <button onClick={() => set(option)}>)`; a chip is active when the state equals the option (admin: when `formData.semesters.includes(sem)`).
- planner/page.tsx: `semesterYearFilter: number | null` (null = 전체), options `[null, ...Array.from(semestersByYear.keys()).sort()]`; `handleSemesterFocus` also sets it to the focused semester's year. Rendered only when `semestersByYear.size > 0`, with `data-export-ignore`.
- CourseCatalog.tsx: `categoryFilter: RequirementCategory | undefined` (undefined = 전체), options `[undefined, ...usedCategories]` — only categories present in the fetched courses, in fixed order; hidden on the 공통 tab.
- statistics/page.tsx: `selectedCategory: 'all' | RequirementCategory` over `CATEGORY_LABELS`; `selectedSemester: 'all' | string` over `semesterOptions` built from the data (`{ value: 'all', label: '전체 학기' }`, then `'${year}-${term}'` → `${year}학년 ${1|2}학기`). Each click also resets `visibleCount` to 3.
- calendar/page.tsx: `selectedCategory: AcademicEventCategory | 'all'` over `categoryLabels`.
- admin/courses/page.tsx: `formData.semesters: Semester[]`, `toggleSemester(sem)` adds or removes; `ALL_SEMESTERS` = spring, summer, fall, winter; submit is refused while the array is empty.
- Containers: the planner and calendar rows sit directly on the `gray-50` dashboard frame; the catalog row inside the white `.cp-course-catalog` header; the statistics rows in `<Card className="mb-6 p-4">` (`.cp-card` + `.cp-filter-chips__panel`); the admin row in the white `radius-2xl` form modal.

## Anatomy and states

- Rows: statistics and admin `flex flex-wrap gap: space-2` with no `items-center`, so chips stretch to their line; calendar the same plus `margin-bottom: space-4` (`.cp-calendar__filters`); planner `items-center`, `gap: space-1-5`, `overflow-x: auto`, `padding-bottom: space-0-5`, chips `flex-shrink: 0`; catalog `items-center`, `gap: space-1`, wraps (`.cp-course-catalog__filter-row--category`).
- Row labels: planner 학년 and catalog 이수 are `micro-11` (500 11px/16.5px) in `gray-400` — 2.5:1 on `gray-50`, 2.6:1 on `white` in the source, kept, flagged.
- Planner pill (`.cp-filter-chips__chip--planner`): `caption-medium`, padding `space-0-5` × `space-2`, `radius-full`, no border, `transition-colors` over `duration-fast`. Inactive fill `yu-navy-a10` with `yu-navy` label (9.0:1 over `gray-50`); hover `yu-navy-a20` (7.5:1); active fill `yu-navy`, label `white` (11.2:1). Active chips carry no hover class.
- Catalog chip (`.cp-course-catalog__chip`): same box as the planner pill on `white`; 전체 uses the `yu-navy` family (9.4:1 inactive). Category colors, inactive `*-50` fill / `*-600` label → hover `*-100` → active `*-500` fill / `white`: 전공핵심 `red` (4.4 → 3.9 → 3.8:1), 전공필수 `rose` (4.1 → 3.8 → 3.8:1), 전공선택 `orange` (3.4 → 3.1 → 2.9:1), 교양필수 `blue` (4.8 → 4.3 → 3.8:1), 교양선택 `green` (3.1 → 2.9 → 2.2:1), 교직 `violet` (5.4 → 5.0 → 4.4:1), 자유선택 `gray-100` / `gray-600` → `gray-200` → `gray-500` (6.9 → 6.1 → 4.8:1). Every pair below 4.5:1 misses in the source and is kept, flagged; only 교양필수 and 교직 inactive, 교직 hover and the two grays pass.
- Statistics category chip (`.cp-filter-chips__chip--stat`): `body` size at weight 500 (16px/24px, 40px tall), padding `space-2` × `space-4`, `radius-lg`. Inactive `gray-100` fill, `gray-700` label (9.4:1); hover `gray-200` (8.3:1); active `linear-gradient(to right in oklab, yu-navy, yu-blue)` with `white` label (11.2:1 at the start, 5.5:1 at the end). Semester chip (`--stat-sm`): `body-sm-medium`, padding `space-1-5` × `space-3`, 32px tall, same colors.
- Statistics framing: hint `<p>` `body-sm` in `gray-500` (4.8:1) with `margin-bottom: space-3`; the semester section adds `margin-top: space-4`, `padding-top: space-4` and a 1px `border-default` top rule (bare `border-t` inside the `gray-900` Card).
- Calendar chip (`.cp-calendar__chip`): `body-sm-medium`, padding `space-1` × `space-3`, `radius-full`. Inactive `white` fill, `gray-700` label (10.3:1), 1px `gray-300` border (1.4:1 on `gray-50`, flagged), hover `gray-50`. Active 전체 `blue-600` fill, `white` label (5.3:1). Active category: `blue-100`/`blue-700` 학사 (5.6:1), `green-100`/`green-700` 수강신청 (4.5:1), `red-100`/`red-700` 시험 (5.3:1), `rose-100`/`rose-700` 공휴일 (5.0:1), `gray-100`/`gray-700` 기타 (9.4:1); their `border-*-200` sets only a color, the width stays 0. Active chips have no border at all, so a chip that becomes active loses 1px per side: its label moves 1px left and the chips after it 2px; the row's flex stretch hides the 2px height loss.
- Admin toggle (`.cp-filter-chips__chip--admin`): `caption-medium`, padding `space-1-5` × `space-3`, `radius-lg`, `cursor: pointer`. Inactive `slate-100` fill, `slate-600` label (6.9:1); hover `slate-200` (6.2:1); active `yu-cyan` fill, `white` label — 2.8:1 in the source, kept, flagged. Field label `body-sm-medium` in `slate-700` (10.4:1), `margin-bottom: space-2`, asterisk `red-500` (3.8:1, flagged).
- No recipe styles `:focus`, `:active` or `:disabled`.

## Copy

- Planner: `학년`, `전체`, `{y}학년`.
- Catalog: `이수`, `전체`, `전공핵심`, `전공필수`, `전공선택`, `교양필수`, `교양선택`, `교직`, `자유선택`.
- Statistics: `이수구분별로 인기 과목을 필터링할 수 있습니다`, `전체`, the seven category labels above; `학기별로 필터링할 수 있습니다`, `전체 학기`, `{year}학년 1학기` / `{year}학년 2학기`.
- Calendar: `전체`, `학사`, `수강신청`, `시험`, `공휴일`, `기타`.
- Admin: `개설 학기 *`, `1학기`, `여름학기`, `2학기`, `겨울학기`.

## Accessibility

- Every chip is a native `<button>` with its visible label as the only name; none carries `aria-pressed`, `aria-selected`, `role="radiogroup"` / `role="tablist"` or an `aria-label`, so the active state is color-only. Only the admin chips set `type="button"` (they sit inside a `<form>`).
- Keyboard: Tab reaches each chip, Enter/Space toggles; no arrow-key movement. No source sets a focus class, so only the browser default outline shows.
- The admin `<label>` has no `htmlFor` and wraps no control, so the toggles are not associated with it; the asterisk is plain text.
- Contrast misses listed above: the 11px `gray-400` labels, most catalog category pairs, `white` on `yu-cyan`, the `gray-300` border.

## Not reproduced

- State changes on click (the active chip is fixed with `.is-active`), the statistics `visibleCount` reset and the planner coupling between semester focus and the year filter.
- Data-driven option lists: planner years from the plan, catalog `usedCategories` from the fetched courses, statistics semesters from `courseStats`; the catalog row hidden on the 공통 tab; the admin form's empty-array validation toast.
- The planner row's horizontal scrolling on narrow screens and its `data-export-ignore` removal during PNG/PDF export.
- Hover is shown at rest through `.is-hover` on one chip per recipe; the real `:hover` also works in the preview. The calendar and catalog rows are doubled so every active color is visible; in the app one chip per row is active.

Pattern extracted from inline markup in `src/app/(dashboard)/planner/page.tsx`, `src/components/features/CourseCatalog.tsx`, `src/app/(dashboard)/statistics/page.tsx`, `src/app/(dashboard)/calendar/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`; no component exists in the source
