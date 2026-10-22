The app's one button: a native `<button>` styled by cva with six variants and four sizes, a loading state that swaps the label for a spinner and 로딩중..., and a half-opacity disabled state.

## Use it for / don't use it for

- Use it for form submits (로그인, 회원가입, 저장), dialog and form actions (취소, 학과 기준표에서 불러오기), the nav bar's auth actions at `size="sm"` (구글 로그인, 회원가입, 로그아웃), wizard steps (이전, 다음), error recovery (다시 시도) and the landing CTAs at `size="lg"` (바로 시작하기 with a trailing arrow; ghost 비회원으로 체험하기).
- The app only ever renders `default`, `outline` and `ghost` at `default`, `sm` and `lg`; `destructive`, `secondary`, `link` and `icon` exist in cva but no page uses them.
- Don't use it for the planner's compact controls: CourseCard and SemesterColumn draw their own raw `<button>`s (icon buttons, chips, drag handles). Don't use it as a navigation link on its own; the app wraps it in `<Link>`.

## What the consumer provides

- `variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'` — default `'default'`.
- `size?: 'default' | 'sm' | 'lg' | 'icon'` — default `'default'`.
- `isLoading?: boolean` — default `false`; when true the button is disabled and shows the spinner plus 로딩중... instead of `children`.
- `disabled?: boolean` — rendered as `disabled || isLoading`.
- `className?: string` — merged last through `cn()` (clsx + tailwind-merge), so `w-full`, `flex-1`, `shadow-glow` and `text-xs sm:text-sm` override the variant classes.
- Every other `React.ButtonHTMLAttributes<HTMLButtonElement>` (`type`, `onClick`, `aria-*`) is spread onto the `<button>`; `ref` is forwarded to it.
- `children`: the label, optionally with a 16px icon before it (`w-4 h-4 mr-1` ArrowLeft) or after it (`w-4 h-4 ml-1` ArrowRight/CheckCircle), a 20px icon before it (`w-5 h-5 mr-2`: the Google SVG, the heroicon plus), the 20px ArrowRight after it on the landing CTA (`ml-2 w-5 h-5`), or an icon alone (`w-4 h-4` X/Pencil).
- Container: an inline-flex item with no margin of its own; place it in a `flex gap-2` row, or stretch it with `w-full` / `flex-1`.

## Anatomy and states

- Root `<button>`: `inline-flex`, centered, `white-space: nowrap`, radius `radius-md`, label `body-sm-medium` (500 14px/20px `font-body`), `transition: all duration-base ease-standard`. No `cursor: pointer` (Tailwind v4 preflight).
- Sizes: default `control-md` (40px) with padding `space-2` × `space-4`; `sm` `control-sm` (36px), padding 0 × `space-3`; `lg` `control-lg` (44px), padding 0 × `space-8`; `icon` a `control-md` square with no padding.
- `default`: fill `linear-gradient(to right in oklab, yu-navy, yu-blue)`, label `white`, `shadow-sm`; hover shifts the gradient to `yu-navy-hover → yu-navy` and lifts to `shadow-md`. White reads 11.2:1 on `yu-navy` and 5.5:1 on `yu-blue`.
- `destructive`: fill `red-600`, label `white` (4.8:1); hover `red-700` (6.4:1).
- `outline`: 1px `gray-300` border on a `white` fill; the label inherits `color` (body `foreground`, 18:1); hover fill `gray-50`. The `gray-300` border is 1.5:1 on white and misses 3:1 in the source — kept, flagged.
- `secondary`: fill `gray-100`, label `gray-900` (16:1); hover `gray-200`.
- `ghost`: no fill, label inherits `color`; hover fill `gray-100`.
- `link`: label `yu-navy` (11.2:1), `text-underline-offset` 4px, underline on hover; it keeps the full button box.
- Active: `transform: scale(0.98)` while pressed.
- Focus-visible: `outline: none` and a ring `0 0 0 2px white, 0 0 0 4px currentColor`. The source names no ring color, so Tailwind v4 falls back to `currentColor`: on `default` and `destructive` the ring is white on white and invisible against `white` or `gray-50` pages — kept exact, flagged. On the other variants it takes the label color and is clearly visible.
- Disabled: `opacity-disabled` (0.5) and `pointer-events: none`, so hover and active never fire. Inactive controls are exempt from WCAG contrast; the label's ratio still roughly halves.
- Loading: the disabled state plus an `icon-md` (16px) spinner with `margin-right: space-2`, turning `cp-spin 1s linear infinite`; its track circle is `currentColor` at `opacity-spinner-track` (0.25), its arc at `opacity-spinner-head` (0.75); the text 로딩중... follows.

## Copy

- `로딩중...` — the only string the component renders itself.
- Labels the app passes as children: 로그인 · 회원가입 · 구글 로그인 · 로그아웃 · 저장 · 취소 · 이전 · 다음 · 다시 시도 · 바로 시작하기 · 비회원으로 체험하기 · 학과 기준표에서 불러오기 · 회원가입하여 데이터 영구 저장 · Google로 로그인 · 추가 · 추가 중... · 수정 · 완료 · 처리 중... · 직접 입력 · 기본 요건 생성 · 생성 중... · 다시 시도 중... · 저장 중... · 초기화 · 내보내기 · 내보내는 중... · 계정 초기화 · 회원 탈퇴 · 삭제 중... · 학기 추가.
- The app's own pending labels (저장 중..., 생성 중..., 추가 중..., 처리 중..., 삭제 중..., 내보내는 중..., 다시 시도 중...) are passed as `children` together with `disabled`, not through `isLoading`.

## Accessibility

- Native `<button>`: Enter and Space activate it and it joins the tab order. The source sets no default `type`, so an untyped Button inside a `<form>` submits it.
- The focus ring is keyboard-only (`focus-visible`) and, on `default` and `destructive`, invisible (see above).
- Loading sets `disabled`, which removes the button from the tab order; there is no `aria-busy`, `aria-live`, or `aria-hidden` on the spinner SVG, so assistive tech learns of the state only by re-reading 로딩중....
- `size="icon"` renders no text; the consumer must pass `aria-label` (the app never uses this size). The one icon-only Button in the app (profile header edit toggle, ghost sm, X/Pencil) passes no aria-label, so it has no accessible name.
- Hover and active do not react on disabled buttons (`pointer-events: none`).

## Not reproduced

- `cn()` class merging and consumer `className` overrides: `w-full`, `flex-1`, `shadow-glow`, responsive `text-xs sm:text-sm`; the hero CTA's `bg-white text-[#153974] hover:bg-white/90 shadow-lg shadow-black/20 group` (바로 시작하기 on the navy hero is a `white` button with a `yu-navy` label, not the gradient) and its arrow's `group-hover:translate-x-1 transition-transform`; the hero ghost's `text-white/70 hover:text-white hover:bg-white/10`; the red outline overrides `text-red-600 border-red-300 hover:bg-red-50` (planner 초기화; profile 계정 초기화 and 회원 탈퇴 add `hover:border-red-400`); and the dashed ghost 학기 추가 (`text-gray-500 hover:text-gray-700 border-dashed border-2 px-6 py-3`).
- `ref` forwarding, `onClick` handlers and form submission.
- The switch between idle and loading: the preview's spinner turns, but nothing toggles it.
- Hover, active and focus are shown at rest through mirror classes (`.is-hover`, `.is-active`, `.is-focus`); the real pointer and keyboard states also work in the preview.

Static rendition hand-translated from `src/components/ui/Button.tsx`.
