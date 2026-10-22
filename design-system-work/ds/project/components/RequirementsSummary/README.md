Graduation-progress card for the planner: a stacked total bar, per-track rows and a 요건 수정 action, with loading, error and empty treatments chosen by `resolveGraduationSummaryState`.

## Use it for / don't use it for

Use it once, at the top of the planner page's `space-y-6` column, as the live readout of how far the active plan is from graduation. Do not use it for a single requirement, for admin tables of department rules, or as a generic progress bar; the bar and legend are tied to the 이수 → 수강중 → 예정 vocabulary of course status.

## What the consumer provides

Nothing: `RequirementsSummary()` takes no props. It reads `useGraduationRequirement()`, `useGraduationProgress()`, `useUpsertGraduationRequirement()`, `useCreateDefaultGraduationRequirement()`, the next-auth session and the guest / plan stores, and owns `isEditing`, `requirementYear` (default `DEFAULT_REQUIREMENT_YEAR` = 2025), `retryingAfterError` and `saveError`. Internal pieces: `StackedBar({ earned, enrolled = 0, planned = 0, required, size = 'md' })` with `size: 'lg' | 'md' | 'sm'`; `BreakdownLine({ …, prior = 0, className = '' })`; `TrackRow({ label, …, prior = 0, sub = false })`. The container is a block-level parent; the Card stretches to its width.

## Anatomy and states

- Card: `radius-lg`, `white` fill, 1px `border-default` hairline (the bare `border` under v4 is currentColor, so `gray-900`), `shadow-sm` → `shadow-md` on hover over `duration-slow` with `ease-standard`. Error adds `red-200` to the border; empty makes it dashed. Both inner `border-t` separators are also currentColor `gray-900`.
- Content: `space-3` vertical, `space-3` horizontal (`space-4` from 640px) in the ready state; `space-3` × `space-6` for the skeleton; `space-4` × `space-6` for error, empty and edit mode.
- Header: title 졸업 요건 in `body-sm-medium` `gray-700`; year badge 10px/15px at weight 400 (no matching type style; `micro-10` is 500) in `teal-700` on `teal-50` with a 1px `teal-200` border, `space-0-5` × `space-1-5` padding, `radius-full`; percentage `heading-4` (600) in `gray-800`, `emerald-600` at 100%; projection → 계획 반영 시 N% in `caption` `gray-400`, shown only when it exceeds the percentage.
- Hero bar (`space-2` above): `StackedBar` size lg, `space-2-5` tall, `gray-100` track, `radius-full`, segments earned `blue-600` (`emerald-500` once met) → enrolled `sky-400` → planned hatch `repeating-linear-gradient(135deg, progress-hatch-dark 0 3px, progress-hatch-light 3px 6px)`, widths clamped so the sum never passes 100%. Value `{earned}/{required}학점` in `caption` `gray-500`, earned at weight 500 `gray-700`.
- Legend (`BreakdownLine`, `space-1-5` below the hero, `space-0-5` + 72px indent under a track row): 11px/16.5px at weight 400 (no matching type style; `micro-11` is 500/16px) in `gray-400`, items in a wrapping flex with `space-2-5` column gap and `space-0-5` row gap; each item an 8×8 `radius-xs` swatch (`blue-600`/`emerald-500`, `sky-400`, hatch, `gray-200` for 미계획) then `space-1` and the label. Zero items are hidden. Met with nothing pending collapses to 요건 충족 in `emerald-600`.
- Details (`space-3` above, `space-3` below the hairline, `space-2-5` between rows): `TrackRow` label 64px wide in `caption` `gray-600`; sub rows indent `space-3`, read `└ 핵심` in 11px/16.5px at weight 400 in `gray-400` and use the `space-1-5` bar; value 64px right-aligned in `caption` (`micro-11` for sub) `gray-500`, earned at weight 500; met rows turn `emerald-600` and prefix ✓. Order: 전공, └ 핵심, └ 주전공최소 (minor only), 복수전공 + └ 핵심, 부전공 + └ 핵심, 교양.
- Footer (`space-3` above, `space-2-5` below the hairline, wraps): hint in 11px/16.5px at weight 400 in `gray-400`; 요건 수정 is a bare button, `caption-medium` in `yu-navy` on `yu-navy-a10` → `yu-navy-a20` on hover over `duration-fast`, `space-1-5` × `space-3` padding, `radius-md`, a 12px (`icon-xs`) inline heroicon pencil at `space-1` gap, no pointer cursor.
- Loading: one `space-4`-tall `gray-200` bar, `radius-sm`, `animate-pulse` (2s, 50% opacity .5).
- Error: `role="alert"`; message in `body-sm` `red-600`; 다시 시도 is the shared Button `variant="outline" size="sm"`, disabled and reading 다시 시도 중... while refetching.
- Empty: prompt in `body-sm` `gray-500`; 직접 입력 (outline sm) and 기본 요건 생성 (default sm, disabled as 생성 중... while pending) at `space-2` gap. Clicking 직접 입력 swaps the body for the heading 졸업 요건 입력 (`body-sm-medium` `gray-700`, `space-3` below) and `RequirementForm`.
- Edit mode: heading 졸업 요건 수정 in a `space-3`-bottom flex row, optional save error in `body-sm` `red-500` with `space-2` below, then `RequirementForm` with `initialData`.
- Contrast, kept exactly and flagged: `gray-400` on white is 2.6:1 (legend, hint, sub labels, projection) and `emerald-600` is 3.7:1 at 11–12px; the `sky-400` enrolled segment (2.2:1), the `emerald-500` met fill (2.5:1), the hatch and the `gray-200` 미계획 swatch all miss 3:1 against white; the `red-200` error border is 1.4:1. `teal-700` on `teal-50` is 5.1:1, `yu-navy` on `yu-navy-a10` 9.4:1, `gray-500` 4.8:1 and `red-600` 4.8:1 pass.

## Copy

졸업 요건 · {year}년 기준 · {percentage}% · → 계획 반영 시 {projected}% · {earned}/{required}학점 · 이수 {n} (기이수 {n} 포함) · 수강중 {n} · 예정 {n} · 미계획 {n} · 요건 충족 · 전공 · └ 핵심 · └ 주전공최소 · 복수전공 · 부전공 · 교양 · ✓ {earned}/{required} · 과목 카드의 상태(예정·수강중·이수)를 바꾸면 바로 반영됩니다. · 요건 수정 · 졸업요건 정보를 불러오지 못했습니다. · 다시 시도 · 다시 시도 중... · 졸업 요건을 설정하세요 · 직접 입력 · 기본 요건 생성 · 생성 중... · 졸업 요건 입력 · 졸업 요건 수정 · 저장에 실패했습니다.

## Accessibility

The error Card carries `role="alert"`; nothing else is announced. Bars are plain `div`s with no `role="progressbar"`, `aria-valuenow` or text alternative; the legend text is the only readable value. The year badge, ✓ and └ are text, not icons. 요건 수정 and the Buttons are real `<button>`s and keyboard-reachable; 요건 수정 has no focus style of its own (the browser outline remains), while the shared Button draws its `focus-visible` ring. Disabled Buttons rely on `disabled` plus the 50% opacity.

## Not reproduced

Data fetching and the `resolveGraduationSummaryState` switching; the 다시 시도 refetch and the retrying / pending disabled label swaps; the inline `RequirementForm` (empty-state editor and edit mode) and its save error; conditional 복수전공, 부전공 and └ 주전공최소 rows; Sentry capture; the width clamping math (widths are written inline from the sample numbers).

Static rendition hand-translated from `src/components/features/RequirementsSummary.tsx`, `src/lib/graduationSummaryState.ts`, `src/components/ui/Card.tsx`, `src/components/ui/Button.tsx`.
