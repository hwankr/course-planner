The statistics page's three data-view Cards — the 인기 과목 순위 ranking list with gradient rank circles and a three-stop gradient progress bar, the 학기별 평균 수강 현황 gray-50 stat tiles, and the 익명 수강계획 열람 lettered plan tiles — plus the guest variant's gradient-and-outline CTA pair, all inline markup inside the shared `.cp-card` shell.

## Use it for / don't use it for

- Use it on the department statistics route (`/statistics`) only: ranked course popularity, per-semester averages, and the anonymous-plan entry points that open AnonymousPlanModal (a plan tile) and AllPlansModal (전체 N개 수강계획 보기).
- Use the guest variant when `isGuest` is true: the header stays, the plan grid is replaced by a locked message and the 구글로 로그인 / 회원가입하기 pair.
- Don't use it for the planner's requirement progress (RequirementsSummary draws its own 6px slate tracks), for stat tiles that need big-number type (these tiles are text only), or as a generic card header: the `p-6 border-b` header here is inline markup, not CardHeader.

## What the consumer provides

- No props: `StatisticsPage` is a Next.js client page. It reads `useDepartmentStats(departmentId)` → `DepartmentCourseStats` (`departmentName`, `totalStudents`, `updatedAt`, `courseStats: CourseStat[]`, `semesterDistribution: SemesterDistribution[]`), `useAnonymousPlans(departmentId, 1, 3, !isGuest)` → `{ plans: AnonymousPlanSummary[]; total: number }`, and `isGuest` / `loginWithGoogle` from `useAuth()`.
- Local state: `visibleCount` (3, +5 per 더보기, back to 3 on 접기 or a filter change), `selectedCategory` and `selectedSemester` (produce `filteredCourses`; rank = index + 1 within that list), `selectedPlanId`, `isAllPlansModalOpen`.
- `CATEGORY_LABELS` and `CATEGORY_COLORS` (`Record<RequirementCategory, string>`) are module constants in the page, not shared with the planner.
- Container: each view is a `<Card>` (`mb-8` on the first two) inside `container mx-auto px-4 py-8 max-w-7xl` on the gray-50 dashboard frame. Compose `<div class="cp-card cp-statistics">` and reuse the Card shell; do not restyle it.

## Anatomy and states

- Header: padding `space-6`; bottom hairline 1px `border-default` (the bare `border-b` is currentColor, the Card's `gray-900`). Title `<h2>` at `heading-3` size, weight 700 (20px/28px), inherited `gray-900`; flex with `space-2` gap to an `icon-lg` BookOpen or BarChart3 in `yu-blue` (5.5:1). Subtitle `body-sm` in `gray-500` (4.8:1), `space-1` above. The 익명 수강계획 열람 header has no icon (`--plain`: block, `space-1` below) and its subtitle is `gray-600` (7.6:1) with no top margin.
- Ranking list: `divide-y` → 1px `border-default` under every row but the last. Row padding `space-4`; hover fills `gray-50` over `duration-fast` `ease-standard` with no click handler (mirror `.is-hover`). Inner flex `items-start`, gap `space-4`.
- Rank circle: `icon-2xl` (32px) round, `yu-navy → yu-blue` oklab gradient to bottom right, `body-sm` at weight 700 in `white` (11.2:1 at the navy end, 5.5:1 at the blue end), `flex-shrink: 0`.
- Course name `<h3>`: `body` size at weight 600, `gray-900` (17.7:1), truncates. Meta `{code} · {credits}학점`: `body-sm` in `gray-600` (7.6:1).
- Category badge: inline-flex, padding `space-0-5` × `space-2-5`, `radius-full`, `caption-medium`, nowrap. Fill/text from the category aliases: 전공핵심 `category-major-required-bg`/`-text` (red-100/red-700, 5.3:1), 전공필수 rose-100/rose-700 (5.0:1), 전공선택 orange-100/orange-700 (4.6:1), 교양필수 blue-100/blue-700 (5.6:1), 교양선택 green-100/green-700 (4.5:1), 교직 violet-100/violet-700 (6.2:1), 자유선택 gray-100/gray-600 (7.2:1).
- Progress: track `space-2` (8px) tall, `gray-200`, `radius-full`, `overflow: hidden`, `space-1` below; fill `height: 100%`, `yu-navy → yu-blue → yu-cyan` oklab gradient to right, width = `{percentage}%` inline, `transition: all` over `duration-slow`. The track is 1.2:1 on white: decorative; the percentage text carries the value.
- Stats line: `body-sm`; `{percentage.toFixed(1)}%` at weight 600 in `yu-blue` (5.5:1), `({studentCount}명)` in `gray-500` (4.8:1).
- Show-more footer (only when more than 3 courses match): padding `space-4`, top hairline `border-default`. 더보기 `<button>`: full width, padding `space-2-5` × 0, `body-sm-medium` in `yu-blue`, `radius-lg`, transparent, no pointer cursor; hover fills `blue-50` (5.1:1; mirror `.is-hover`). 접기 (`--collapse`) is `gray-500` with a `gray-50` hover.
- Note footer (whenever rows exist): padding `space-4`, fill `gray-50`, top hairline `border-default`; `body-sm` in `gray-600` (7.2:1 on gray-50) with an `icon-md` Info, gap `space-1`.
- Empty list: padding `space-8`, centered, `gray-500`; title `body` at weight 500 with `space-1` below, text `body-sm`; the filtered-empty string 해당 조건에 맞는 과목이 없습니다. is a bare text node.
- Stat tiles: body padding `space-6`; grid gap `space-4`, 1 column, 2 from 48rem, 4 from 64rem (`.is-lg` is a preview-only mirror of the 4-up layout). Tile padding `space-4`, fill `gray-50`, `radius-lg`; title `body` at weight 600 in `gray-900` (17.0:1 on gray-50), `space-2` below; value `body-sm` in `gray-600` (7.2:1).
- Plan tiles: grid gap `space-4`, 1 column, 3 from 48rem, `space-4` below. Each is a `<button>` padded `space-4` with a 2px `gray-200` border (1.2:1 on white: source pair, kept, flagged), `radius-lg`, transparent, text-align left, `transition: all` over `duration-fast`; hover (`.is-hover`) turns the border `yu-blue` (5.5:1) and adds `shadow-md`. Letter avatar = the rank-circle recipe without `flex-shrink: 0`, gap `space-2`, `space-3` below; name 계획 {A} `body` at weight 600 in `gray-900`; meta two `body-sm` lines in `gray-600`, `space-1` apart.
- Anonymity note (only when plans exist): `caption` in `gray-400` with an `icon-sm` Info, gap `space-1`, `space-4` above. 2.6:1 on white: source pair, kept, flagged.
- 전체 {total}개 수강계획 보기 (only when total > 3): centered wrap `space-4` above. Inline-flex, gap `space-2`, padding `space-3` × `space-6`, 2px `yu-blue` border, `radius-lg`, label inherits `body` (16px/24px, weight 400) in `yu-blue` (5.5:1); hover fills `yu-blue` with `white` text (5.5:1) over `duration-fast`; trailing `icon-lg` ChevronRight. No focus style, no pointer cursor.
- Plans loading: flex-centered, `space-12` vertical padding, Loader2 `icon-2xl` in `yu-blue`, `cp-spin` 1s linear. Plans empty: centered, `space-12` vertical padding, `gray-500`, same title and text type as the list empty state.
- Guest body: padding `space-8`, centered. Users glyph at `avatar` (48px) in `gray-300` (decorative), `space-4` below; title `body` at weight 500 in `gray-900`, `space-2` below; text `body-sm` in `gray-500`, `space-6` below. Actions: flex, centered, gap `space-3`.
- CTA pair: 구글로 로그인 `<button>` is inline-flex, gap `space-2`, padding `space-2-5` × `space-5`, `yu-navy → yu-blue` oklab gradient to right, `white` `body-sm-medium`, `radius-lg`, no border; hover `opacity-hover-wash` (0.9) over `duration-fast`. 회원가입하기 `<Link>` is the outlined recipe at `--sm`: padding `space-2-5` × `space-5`, `body-sm-medium`, the same 2px `yu-blue` border and fill-on-hover. Neither sets a pointer cursor or a focus style.

## Copy

- 인기 과목 순위 · {totalStudents}명 중 해당 과목을 계획에 포함한 학생 비율 순으로 정렬됩니다 · {code} · {credits}학점 · {percentage.toFixed(1)}% · ({studentCount}명) · {remainingCount}개 더보기 · 접기 · 계획을 작성한 학생 중 비율입니다
- 아직 수강 계획 데이터가 없습니다 · 학과 학생들이 수강 계획을 작성하면 이곳에 인기 과목이 표시됩니다 · 해당 조건에 맞는 과목이 없습니다.
- Badges: 전공핵심 · 전공필수 · 전공선택 · 교양필수 · 교양선택 · 교직 · 자유선택
- 학기별 평균 수강 현황 · 같은 학과 학생들의 학기별 평균 수강 과목 수와 학점입니다 · {year}학년 {1|2}학기 · {avgCourses.toFixed(1)}과목 · {avgCredits.toFixed(1)}학점
- 익명 수강계획 열람 · 같은 학과 학생들의 수강 계획을 참고하세요 · 계획 {A|B|C} · {semesterCount}개 학기 · {totalCourses}개 과목 · {totalCredits}학점 · 모든 계획은 익명으로 표시됩니다 · 전체 {total}개 수강계획 보기 · 아직 공개된 수강 계획이 없습니다 · 학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다
- Guest: 로그인하면 다른 학생들의 수강 계획을 열람할 수 있습니다 · 회원가입 후 나의 계획을 등록하면, 같은 학과 학생들의 익명 수강 계획도 참고할 수 있어요. · 구글로 로그인 · 회원가입하기

## Accessibility

- Section titles are real `<h2>`s and course and tile titles `<h3>`s under the page's one `<h1>` 학과 수강 통계.
- The progress bar is two plain `<div>`s: no `role="progressbar"`, `aria-valuenow` or label; the visible {n}% text is the only exposure of the value.
- Plan tiles, 더보기 / 접기, 전체 N개 수강계획 보기 and 구글로 로그인 are plain `<button>`s named by their text, with no `aria-haspopup`, `aria-expanded` or `aria-controls`; 회원가입하기 is a Next `<Link>` to `/register`.
- No `cursor: pointer` and no focus-visible styling on any of them; only the browser default focus ring shows. Ranking rows change color on hover but are not interactive.
- Icons (BookOpen, BarChart3, Info, Users, ChevronRight, Loader2) carry no `aria-hidden` or title in the source, and the spinner has no text alternative.
- Contrast misses kept from the source: `gray-400` anonymity note 2.6:1; `gray-200` plan-tile border and progress track 1.2:1.

## Not reproduced

- Data fetching (`useDepartmentStats`, `useAnonymousPlans`); the page header, the guest and info banners, the filter chip card and the DEPARTMENT_NOT_SET / error / no-data page states (separate inline markup outside this pattern).
- Category and semester filtering, `visibleCount` paging (+5 per 더보기, reset to 3 by 접기 or a filter change), rank numbers restarting at 1 after a filter, and the 300ms width animation of the progress fill.
- Opening AnonymousPlanModal from a plan tile and AllPlansModal from 전체 N개 수강계획 보기; `loginWithGoogle`.
- The preview shows three rows, four tiles and three plans with `.is-hover` mirrors at rest, forces the 4-up tile layout with `.is-lg`, and omits the plans loading spinner and the empty states (styled in the fragment, not previewed).

Pattern extracted from inline markup in `src/app/(dashboard)/statistics/page.tsx` (Card shell from `src/components/ui/Card.tsx`); no component exists in the source
