The loading, empty and error markup the app writes inline into its pages.

It covers three spinner recipes, four skeleton recipes, the error, global-error and 404 page columns, the statistics centered state Card, the admin empty box and red error banner, and the two-line list empty state.

## Use it for / don't use it for

- Use the `loading.tsx` ring as a route segment's Suspense fallback; the `OnboardingGuard` arc while the guest stores or the session hydrate (the planner reuses it at 48px while a plan loads, CourseCatalog at 32px); the Lucide `Loader2` where a page or modal waits on a TanStack query (statistics, AllPlansModal).
- Use a skeleton where the layout is known before the data: the RequirementsSummary bar inside its Card, the admin `slate-200` title and row blocks, the calendar grid cell.
- Use the page column for errors thrown while rendering (`error.tsx`, `global-error.tsx`) and for unknown routes (`not-found.tsx`); the statistics Card when a whole page is replaced by one message with a next step; the admin box and banner for a list that is empty or failed to load; the two-line text for an empty list inside a Card or modal body.
- Don't use the page column or admin banner for form or mutation failures; the app shows those in Toast, the `Input` error line, or an inline red line or box next to the form (RequirementsSummary's `text-sm text-red-500` save error, the login and register `red-50` box).

## What the consumer provides

- `error.tsx` and `global-error.tsx` receive Next's error-boundary props: `error: Error & { digest?: string }` and `reset: () => void`. `(dashboard)/error.tsx` renders `error.message` in a `<details>` only when `NODE_ENV !== 'production'`; `global-error.tsx` never shows it.
- `loading.tsx` and `not-found.tsx` take no props; Next renders them in place of the segment.
- `OnboardingGuard` takes `children: React.ReactNode` and shows the arc instead of them while `!guestHydrated`, `!guestProfileHydrated` (guest mode) or `status === 'loading'` (non-guest).
- The statistics states are `Card` from `@/components/ui` with `className="max-w-2xl mx-auto p-8 text-center"`, a Lucide icon (`BarChart3`, `AlertCircle` or `Info`), an `<h2>`, a `<p>` and, for the two recoverable cases, a `Link href="/profile"`.
- Container: the dashboard `<main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">` on the `gray-50` frame for everything except three: `not-found.tsx` renders in the root layout's `flex-1 bg-gray-50` wrapper (`gray-50`, outside the dashboard `<main>`); `global-error.tsx` replaces the layout and sits on its own `<body>` (`background`); the AllPlansModal empty state sits in the white modal body.

## Anatomy and states

- Centering roots: `flex items-center justify-center` with the source's minimum — `min-h-[400px]` (loading.tsx, planner, statistics loading; arbitrary, no size token), `min-h-[50vh]` (OnboardingGuard), or `py-12` padding `space-12` (AllPlansModal, statistics plans).
- Ring (loading.tsx): `icon-2xl` disc, 4px `gray-200` track with a `yu-navy` top arc (10.7:1 on `gray-50`), `radius-full`, `cp-spin` 1s linear; stacked with `gap: space-3` above `body-sm` in `gray-500` (4.6:1 on `gray-50`).
- Arc (OnboardingGuard, CourseCatalog): `icon-2xl` disc with only `border-bottom: 2px yu-blue` (5.3:1 on `gray-50`), no track, no label; planner uses the `avatar` 48px size.
- Loader2 (statistics, AllPlansModal): the Lucide `loader-2` path, `icon-2xl`, `yu-blue`, `cp-spin`; statistics stacks it `margin: 0 auto space-4` over `body` in `gray-600` (7.2:1).
- Skeletons pulse `cp-pulse` 2s cubic-bezier(0.4, 0, 0.6, 1): RequirementsSummary `height: space-4`, `gray-200`, `radius-sm`, inside `CardContent py-3` (padding `space-3` × `space-6` after `cn()` merges `p-6 pt-0`); admin/courses auth guard: a title `space-8` tall × 192px (w-48, no token), `radius-lg`, over one 256px block (h-64, no token), `radius-2xl`, both `slate-200`, `space-y-4` apart; admin/courses list loading: three `space-24` blocks, `radius-2xl`, `slate-200`, stacked `space-y-4`, no title; calendar cell `min-height: 90px`, `gray-100`, 1px `gray-200` border, square and `radius-lg` from `md` (48rem).
- Page column: flex column, centered, `gap: space-4`, padding `space-8`, `text-align: center`; `min-height: 400px` in `(dashboard)/error.tsx`, `100vh` in `not-found.tsx` and `global-error.tsx`.
- Well: `radius-full`, padding `space-3` around an `icon-2xl` glyph — `red-100` with the `red-600` exclamation triangle (3.9:1) on the error pages, `blue-100` with the `yu-navy` sad face (9.2:1) on the 404.
- Text block `space-y-2` (error.tsx, not-found.tsx): heading `heading-3` (600 20px/28px) in `gray-900`, body `body-sm` in `gray-600`. global-error.tsx has no wrapper, so heading and body sit `space-4` apart.
- Details (error.tsx, development only): `margin-top: space-4`, left-aligned; summary `body-sm` in `gray-500` with pointer; `<pre>` `margin-top: space-2`, padding `space-2`, `radius-sm`, `gray-100`, `caption` size on `font-mono` in `gray-700` (9.4:1).
- Action: hand-rolled `<button>` (error pages) or `<a>` (404), not the Button primitive — `yu-navy` fill, `body-sm-medium` in `white` (11.2:1), padding `space-2` × `space-4`, `radius-md`, 36px tall, no transition. Hover `yu-navy-hover` (10.6:1). error.tsx and not-found.tsx add `outline: none` and `0 0 0 2px white, 0 0 0 4px yu-cyan` on any `:focus` — `yu-cyan` is 2.8:1 on the white offset, 2.6:1 on `gray-50`, kept, flagged. global-error.tsx has no focus classes (UA ring only). The `<button>` has no pointer cursor; the `<a>` keeps the UA pointer.
- Statistics Card: `.cp-card` (`border-default` hairline, `white`, `shadow-sm` → `shadow-md` on hover) with `max-width: container-2xl`, auto margins, padding `space-8`, centered text. Icon `space-16` (64px) square, `margin: 0 auto space-4`: `gray-400` BarChart3 (2.6:1 on white — misses 3:1 in the source, kept, flagged), `red-500` AlertCircle (3.8:1), or a `blue-100` 64px well around a `yu-blue` Info at `icon-2xl`. Heading `heading-2` (700 24px/32px) inheriting `gray-900`, `margin-bottom: space-2`; body `body` in `gray-600`, then `space-4` or `space-6` below when a CTA follows.
- CTA: inline-flex, `gap: space-2`, padding `space-3` × `space-6`, `radius-lg`, `linear-gradient(to right in oklab, yu-navy, yu-blue)`, `white` label at the inherited `body` size (5.5:1 at the `yu-blue` end), ChevronRight `icon-lg`; hover `opacity-hover-wash` over `duration-fast`.
- Admin empty box: `radius-2xl`, 1px `slate-200` border (1.2:1 on `gray-50`, decorative), `white`, padding `space-12`; BookOpen `avatar` 48px in `slate-300` (1.5:1 — kept, flagged); `body-sm` in `slate-500` (4.8:1) with `margin-top: space-4`.
- List empty: padding `space-12` × 0 (or `space-8` all round on the statistics course list), centered, `gray-500` (4.8:1 on white); first line `body` at 500 with `margin-bottom: space-1`, second `body-sm`.
- Banner: `radius-2xl`, 1px `red-200` border (1.3:1 on `red-50`), `red-50` fill, padding `space-6`, `body-sm` in `red-600` — 4.4:1, misses 4.5:1 in the source, kept, flagged.

## Copy

- `로딩 중...` — loading.tsx label. `통계를 불러오는 중...` — statistics loading.
- `문제가 발생했습니다` / `일시적인 오류가 발생했습니다. 다시 시도해주세요.` / `오류 상세 정보` / `다시 시도` — (dashboard)/error.tsx.
- `심각한 오류가 발생했습니다` / `예상치 못한 오류가 발생했습니다. 페이지를 새로고침해주세요.` / `다시 시도` — global-error.tsx.
- `페이지를 찾을 수 없습니다` / `요청하신 페이지가 존재하지 않거나 이동되었습니다.` / `수강 플래너로 이동` — not-found.tsx.
- `통계 데이터를 찾을 수 없습니다` / `설정된 학과 정보를 확인할 수 없습니다. 프로필에서 학과를 다시 설정해주세요.` / `프로필 설정하기`; `학과를 설정해주세요` / `학과별 수강 통계를 확인하려면 프로필에서 학과를 설정해야 합니다.` / `프로필 설정하기`; `통계를 불러오는데 실패했습니다` / `잠시 후 다시 시도해주세요.` — statistics Cards.
- `아직 수강 계획 데이터가 없습니다` / `학과 학생들이 수강 계획을 작성하면 이곳에 인기 과목이 표시됩니다`; `해당 조건에 맞는 과목이 없습니다.`; `아직 공개된 수강 계획이 없습니다` / `학과 학생들이 수강 계획을 작성하면 이곳에 익명으로 표시됩니다` — list empty states (statistics, AllPlansModal).
- `등록된 과목이 없습니다.` / `과목 목록을 불러오는데 실패했습니다.` — admin/courses box and banner.

## Accessibility

- No spinner or skeleton carries `role="status"`, `aria-live`, `aria-busy` or an `aria-label`; the ring and arc are empty `<div>`s and the Lucide SVGs have no title, so only loading.tsx and statistics expose readable text.
- The page columns use a real `<h2>` and a native `<button>` (`<a href="/planner">` on the 404). Nothing moves focus into the column or announces the swap. The inline SVGs have no `aria-hidden`.
- The error.tsx and not-found.tsx focus ring fires on `:focus` (mouse clicks too) in `yu-cyan` that misses 3:1; global-error.tsx shows only the browser ring.
- The statistics CTA is a `Link` with visible text; the admin banner is a plain `<div>` with no `role="alert"`.
- `animate-spin` and `animate-pulse` run regardless of `prefers-reduced-motion`.

## Not reproduced

- `Sentry.captureException(error)` on mount and `reset()` on 다시 시도; Next's segment swapping; the `Link` navigations.
- OnboardingGuard's redirects (`router.replace` to `/onboarding`, `/login`, `/planner`) and the `null` renders while redirecting; the TanStack `isLoading` / `isError` branches and the `DEPARTMENT_NOT_SET` error code.
- `min-h-screen` and `min-h-[50vh]` — the 404 and global-error columns are shown at the error column's 400px row height, the spinners without their centering roots.
- The `process.env.NODE_ENV` gate: the development-only `<details>` is styled but not shown (the ErrorBoundary card shows the same block open).
- The statistics `AlertCircle` and `Info` variants and the `md:` square calendar cell at its real grid width — styled, not shown. The admin/courses skeletons are shown at the preview column's width, not the full admin page width.
- Hover is shown at rest through `.is-hover` on the 404 link; the real `:hover` and `:focus` states also work in the preview.

Pattern extracted from inline markup in `src/app/(dashboard)/loading.tsx`, `src/app/(dashboard)/error.tsx`, `src/app/not-found.tsx`, `src/app/global-error.tsx`, `src/components/providers/OnboardingGuard.tsx`, `src/app/(dashboard)/statistics/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`, `src/components/features/AllPlansModal.tsx` (spinner sibling from `src/app/(dashboard)/planner/page.tsx` and `src/components/features/CourseCatalog.tsx`; skeleton siblings from `src/components/features/RequirementsSummary.tsx`, `src/app/(dashboard)/calendar/page.tsx`); no component exists in the source
