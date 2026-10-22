White panel with an 8px radius, a gray-900 hairline and a soft shadow that deepens on hover; five slot parts (CardHeader, CardTitle, CardDescription, CardContent, CardFooter) add only padding, flex layout and type (CardDescription also sets `gray-500`).

## Use it for / don't use it for

Use it for the planner's heaviest consumers, CourseCard, SemesterColumn and ReadOnlySemesterColumn: CourseCard recolors the hairline per status (`border-[#153974]/20` = `yu-navy-a20`, `border-green-200`, `border-gray-200`, `border-red-200`) and swaps the fill (`yu-navy-a5`, `green-50`, `gray-50`, `red-50`); SemesterColumn keeps the bare `gray-900` hairline and adds `ring-2 ring-[#00AACA] border-[#00AACA]` (`yu-cyan`) when focused and `ring-2 ring-[#00AACA]/50 bg-[#00AACA]/5` (`yu-cyan-a50`, `yu-cyan-a5`) on drag-over; ReadOnlySemesterColumn passes only `flex flex-col`. Use it also for the settings sections on the profile page (기본 정보, 전공 설정, 계정 정보), the onboarding steps 학과 및 입학 정보 and 졸업 요건 설정, which add a 4px top rail (`border-t-4 border-[#3069B3]` = `yu-blue`, `border-t-4 border-emerald-500`), the admin stat tiles (CardContent `pt-6`, not linked) and the admin menu tiles, each wrapped in a `Link`, and dialog bodies — AddSemesterDialog (`w-full max-w-md bg-white`, CardContent `pt-6`) and the calendar event form (`w-full max-w-lg max-h-[90vh] overflow-y-auto`, CardContent `p-6`).

Don't use it for Toast, or anywhere a light `gray-200` border is expected without saying so: a bare Card draws a `gray-900` line.

## What the consumer provides

- Card, CardHeader, CardContent and CardFooter take `React.HTMLAttributes<HTMLDivElement>` and forward a div ref; CardTitle takes `HTMLAttributes<HTMLHeadingElement>`, renders an `<h3>` and (source quirk) types its ref as `HTMLParagraphElement`; CardDescription takes `HTMLAttributes<HTMLParagraphElement>` and renders a `<p>`.
- `className?: string` (default none) is merged with the base classes through `cn()` (tailwind-merge), so a consumer class replaces the matching base class. The app passes `border-red-200`, `border-dashed`, `border-t-4 border-[#3069B3]`, `p-8 text-center`, `max-w-md`, `h-full`, `animate-fade-in-up`, `mb-1 px-2 py-1.5`, `mb-2 p-3`, `cursor-move`, `opacity-60 cursor-not-allowed`, `h-full min-h-[400px]`, `min-h-[180px]` on Card, and SemesterColumn hands Card the dnd-kit `ref` (`setNodeRef`); `flex flex-row items-center justify-between` on CardHeader; `text-lg` or `text-red-600` on CardTitle; `pt-6` on CardContent when there is no header.
- No variants, sizes or defaults beyond the base classes. The component renders no text of its own.
- Children: compose CardHeader, then CardContent, then CardFooter. Inside the header put CardTitle then CardDescription, or wrap the title in a `flex items-center gap-2` row with a 20px (`icon-lg`) lucide icon in `gray-600`.
- Container: a block that fills its parent. The app places it on the `gray-50` dashboard frame, in `grid gap-4` tiles, or stacked with `space-y-6`.

## Anatomy and states

- Root: fill `white`; 1px border in `border-default` (`gray-900`), because a bare Tailwind v4 `border` is `currentColor` and the Card sets `text-gray-900`. This near-black hairline is how the product renders. Radius `radius-lg` (8px). Shadow `shadow-sm`. Text `gray-900`; untyped body copy inherits `body` (16px/24px) in `font-body`. `gray-900` on `white` is 17.7:1 for text and the border alike.
- Hover: shadow `shadow-sm` → `shadow-md`, transitioning `box-shadow` only over `duration-slow` (300ms) with `ease-standard`. Nothing else moves: no lift, no border change, no pointer cursor unless the consumer adds `cursor-pointer`. Mirror class `.is-hover`.
- CardHeader: flex column, padding `space-6` on all sides, `space-1-5` (6px) between stacked children.
- CardTitle: `heading-2` size at weight 600 — 24px, line-height 1, letter-spacing −0.025em — in inherited `gray-900`. The admin menu tiles shrink it to `text-lg`; the 계정 초기화 and 위험 구역 cards color it `red-600`.
- CardDescription: `body-sm` in `gray-500` — 4.8:1 on `white`, 4.6:1 on `gray-50`.
- CardContent: padding 0 `space-6` `space-6` (`p-6 pt-0`), so it sits flush under the header.
- CardFooter: flex row, `align-items: center`, padding 0 `space-6` `space-6`. No gap or justification of its own.
- There are no focus, active, disabled or selected states.

## Copy

The component renders no strings. Titles the app passes: 기본 정보 · 전공 설정 · 계정 정보 · 계정 초기화 · 위험 구역 · 학과 및 입학 정보 · 졸업 요건 설정. Admin menu tiles (title / description): 과목 관리 / 과목을 추가, 수정, 삭제합니다. · 학과 관리 / 학과 정보를 관리합니다. · 졸업 요건 관리 / 학과별 졸업 요건을 설정합니다. · 사용자 관리 / 사용자 목록과 권한을 관리합니다. · 피드백 관리 / 사용자 피드백과 문의를 관리합니다. · 업데이트 소식 관리 / 앱 변경사항과 업데이트 내역을 관리합니다. The preview uses 사용자 관리 with its description and the 계정 정보 rows 계정 유형 · 이메일 계정, 권한 · student, 데이터 저장 · 이 브라우저에만 저장. CardFooter is exported but unused in the app; the preview footer borrows the guest-mode 데이터 저장 · 이 브라우저에만 저장 row, which the profile page renders inside CardContent, and the 이메일 계정/권한 rows come from the signed-in branch (the two branches never render together).

## Accessibility

- The root is a plain `<div>` with no role or label; `role`, `aria-*` and `id` pass through `...props` when the consumer sets them.
- The title is a real `<h3>`, so it enters the heading outline at level 3 regardless of the surrounding structure. The description is a `<p>` and is not linked to the title with `aria-describedby`.
- Nothing inside the base component is focusable; the hover shadow has no keyboard equivalent. When a whole card is wrapped in `<Link>` (admin menus) the anchor takes the browser default focus outline; the Card adds none.

## Not reproduced

- `className` merging through `cn()`/tailwind-merge; the preview shows the base classes only (no `border-red-200`, `border-dashed`, `border-t-4`, `p-8`, `h-full`, and none of the CourseCard status fills or SemesterColumn focus/drag-over rings).
- Ref forwarding, the `<Link>` wrapper and `cursor-pointer` on admin menu tiles, and the `animate-fade-in-up` entrance on profile cards.
- Interior content (forms, Buttons, icons) belongs to other components; the preview's rows are plain inline-styled demo children.

Static rendition hand-translated from `src/components/ui/Card.tsx`.
