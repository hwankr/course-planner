The split-screen frame behind 로그인 and 회원가입: a brand panel on the panning `yu-navy-hover` → `yu-navy` → `yu-blue` ramp beside a `white` form panel.

## Use it for / don't use it for

- Use it for the two unauthenticated pages only: `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` repeat this markup inline; nothing else in the app does.
- Keep the feature bullets to three and the headline to two lines (`whitespace-pre-line` around a literal `\n`); the brand panel is sized for that.
- Don't use it for dashboard pages, modals or the onboarding flow: those sit in the `gray-50` app frame with the nav bar, and this pattern fills the viewport with no nav.
- Don't put a second column of controls in the form panel; its content is one `container-md` column.

## What the consumer provides

- No props: both pages are default-exported, prop-less client components (`'use client'`). Login keeps `email`, `password`, `error`, `isSubmitting` and `inAppInfo` in local state; register keeps `formData` (`name`, `email`, `password`, `confirmPassword`), `error`, `isSubmitting`.
- Hooks: `useAuth()` → `login(email, password)`, `loginWithGoogle()`, `register({ name, email, password })`, `isLoading`; `useGuestStore((s) => s.enterGuestMode)` for the guest button.
- Primitives: `Input` with `id`, `type`, `value`, `onChange`, `placeholder`, `required`, plus `name` on the register page (its `handleChange` keys `formData` by `e.target.name`); no `className`, no `error`; `Button` with `type="submit" className="w-full" isLoading={isSubmitting || isLoading}` and, for Google, `type="button" variant="outline" className="w-full mt-4"`.
- Container: RootLayout's `flex-1 bg-gray-50` wrapper inside a `flex flex-col min-h-screen` body, with `Footer` after it. The login root is `min-h-screen flex`; the register root is `flex-1 flex` (modifier `--register`). Both panels cover the gray wrapper completely.

## Anatomy and states

- Root: flex row, 100vh minimum (login), inherits the body's `body` type in `font-body` and `foreground`.
- Brand panel: hidden below md (768px); `display: flex`, 50% wide from md, 60% from lg (1024px); `overflow: hidden`; `linear-gradient(to right in oklab, yu-navy-hover, yu-navy, yu-blue)` at `background-size: 200% 200%`, resting at `background-position: 0% 50%` (the gradientShift 0% keyframe), so the panel shows the left half, `yu-navy-hover` → `yu-navy`; `yu-blue` is off-panel at rest and under `prefers-reduced-motion`. The panel has no `justify-content`, so the hero wrap sits at the left edge and stretches to full height.
- Mesh overlay: absolute, inset 0, `opacity: 0.3`; the five `.bg-mesh` radial stops `yu-navy-a15`, `yu-blue-a12`, `yu-cyan-a10`, `yu-blue-a8`, `yu-cyan-a6`.
- Discs: three absolute `radius-full` circles in `white-a20` with `blur(24px)`. Login: 128px at `space-20`/`space-20`, 160px at `space-32` from bottom and right, 96px at 50% top and `space-20` right. Register (`--register`): 144px at `space-24` top and right, 176px at 160px bottom and `space-32` left, 112px at 33.33% top and `space-24` left.
- Hero wrap: `position: relative`, `z-sticky`, flex centered, padding `space-12`. Content: `max-width: container-lg`, `white`.
  - Logo: `yu-logo-white.svg` at `space-12` (48px) tall, width auto (about 249px), `margin-bottom: space-6`.
  - Headline `<h1>`: 700 36px/1.25 at md, 48px/1.25 from lg (`leading-tight` overrides the `display-sm` / `display-md` line-heights), `margin-bottom: space-8`, `white-space: pre-line`.
  - Feature list: `space-6` between rows; each row flex, `align-items: flex-start`, `gap: space-4`. Icon: Lucide `check-circle-2` at `icon-xl`, `margin-top: space-1`, 2px stroke in `white`. Title `<h3>`: `heading-3` (600 20px/28px) in `white`, `margin-bottom: space-1`. Description `<p>`: `body` in `blue-100` — 8.6:1 on `yu-navy-hover` and 9.2:1 on `yu-navy` at rest; 4.5:1 on `yu-blue` when the pan reaches its 50% keyframe.
- Form panel: flex centered, `width: 100%`, 50% from md, 40% from lg; padding `space-8`; fill `white`. Form box: `width: 100%`, `max-width: container-md`.
  - Brand row: flex, `align-items: center`, `gap: space-2`, `margin-bottom: space-8`. Logo `yu-logo.svg` at `space-6` (24px) tall, width auto. Wordmark `<h2>`: `heading-2` (700 24px/32px) filled by `.text-gradient`, `linear-gradient(135deg, yu-navy, yu-blue, yu-cyan)` clipped to the glyphs; the `yu-cyan` end is 2.8:1 on `white`, under 3:1 for 24px bold — kept, flagged.
  - Title block: `margin-bottom: space-8`. Title `<h1>`: `heading-2` in `gray-900` (17.7:1), `margin-bottom: space-2`. Subtitle `<p>`: `body` in `gray-500` (4.8:1).
  - Form: `space-4` between children. Error alert (only while `error` is set): padding `space-3`, 1px `red-200` border, `radius-md`, fill `red-50`, `body-sm` in `red-600` — 4.4:1 on `red-50` in the source, misses 4.5:1; kept, flagged.
  - Field: bare `<div>`; label `body-sm-medium` in `gray-700` (10.3:1), `display: block`, `margin-bottom: space-1`; then `.cp-input` (40px, `gray-300` border, `yu-cyan` focus ring, `gray-400` placeholder — 2.6:1, the Input source pair, kept, flagged). Register adds a hint under 비밀번호: `margin-top: space-1`, `caption` in `gray-500`.
  - Submit: `.cp-button--default` stretched to `width: 100%`; `isLoading` swaps the label for the spinner and 로딩중... and disables it (`opacity-disabled`). Mirror of the loading state: `disabled` plus the spinner markup.
- Alternatives block (login only): `margin-top: space-6`.
  - Divider: a `relative` box; the rule is absolute, inset 0, flex centered, 1px `gray-300` top border (decorative, 1.5:1); the label row is `relative`, flex centered, `body-sm`; the 또는 span pads `space-2` on a `white` fill in `gray-500`.
  - Google button: `.cp-button--outline` at `width: 100%`, `margin-top: space-4`; label inherits `foreground` (17.9:1); hover fill `gray-50` (mirror `.is-hover`). The inline monochrome G is a 20px (`icon-lg`) SVG, `margin-right: space-2`, four `currentColor` paths.
  - In-app notice (when `inAppInfo.isInApp`, instead of the Google button): `margin-top: space-4`, padding `space-4`, 1px `amber-200` border, `radius-lg`, fill `amber-50`. Title `body-sm-medium` in `amber-800` (6.8:1), `margin-bottom: space-2`. iOS hint: `caption` in `amber-700` (4.9:1) with 700-weight spans. Android button: bare `<button>`, `width: 100%`, `margin-top: space-1`, padding `space-2` vertical, `radius-md`, fill `amber-100`, `body-sm-medium` in `amber-900` (8.1:1); hover fill `amber-200` (7.3:1), `transition-colors` over `duration-fast` with `ease-standard`. Mirror `.is-hover`.
  - Guest button: bare `<button>`, `width: 100%`, `margin-top: space-3`, padding `space-2` vertical, `body-sm` in `gray-500` (4.8:1); hover `yu-navy` (11.2:1), `transition-colors` over `duration-fast`. Mirror `.is-hover`. No pointer cursor (Tailwind v4 preflight).
- Footer line `<p>`: `margin-top: space-6`, centered `body-sm` in `gray-600` (7.6:1); the link is `yu-navy` at weight 500, no underline, underline on hover (mirror `.is-hover`).
- No focus styles of its own anywhere: `Input` and `Button` bring theirs; the guest, in-app and footer links take the browser default.

## Copy

- Logo `alt` on both panels: `영남대학교`. Wordmark: `YU 수강 플래너`.
- Login headline: `영남대학교와 함께하는` / `학업 계획`. Bullets: `드래그앤드롭으로 학기 배치` — `직관적인 인터페이스로 쉽게 수강 계획을 세우세요`; `실시간 졸업 요건 추적` — `현재 진행 상황을 한눈에 파악하세요`; `다른 사람들의 수강 계획 참고` — `같은 학과 학생들의 수강 계획을 참고하세요`.
- Register headline: `영남대학교` / `YU the Future`. Bullets: `체계적인 학기별 수강 관리` — `4년간의 수강 계획을 한 곳에서 관리하세요`; `졸업 요건 실시간 추적` — `언제든지 졸업까지 필요한 학점을 확인하세요`; `다른 사람들의 수강 계획 참고` — `같은 학과 학생들의 수강 계획을 참고하세요`.
- Login: title `로그인`, subtitle `계정에 로그인하세요`; labels `이메일`, `비밀번호`; placeholders `email@example.com`, `••••••••`; submit `로그인`; divider `또는`; `Google로 로그인`; `비회원으로 시작하기`; footer `계정이 없으신가요? ` + link `회원가입` (`/register`). Error: `LOGIN_FAILURE_MESSAGE` = `이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.`
- Register: title `회원가입`, subtitle `새 계정을 만들어보세요`; labels `이름`, `이메일`, `비밀번호`, `비밀번호 확인`; placeholders `홍길동`, `email@example.com`, `8자 이상 (대문자, 소문자, 숫자 포함)`, `비밀번호 재입력`; hint `8자 이상, 대문자·소문자·숫자 포함`; submit `회원가입`; footer `이미 계정이 있으신가요? ` + link `로그인` (`/login`). Errors: `비밀번호가 일치하지 않습니다.`, `비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다.`, the server `err.message`, or `회원가입에 실패했습니다.`
- Loading label from `Button`: `로딩중...`.
- In-app notice: `{appName || '앱'} 내 브라우저에서는 Google 로그인이 지원되지 않습니다.` where `appName` is one of `카카오톡`, `에브리타임`, `인스타그램`, `Facebook`, `네이버`, `LINE`, `다음`, `삼성 인터넷`, `Twitter`, `TikTok`, `밴드`; iOS: `하단의 ꞏꞏꞏ 또는 공유 버튼을 눌러 "Safari로 열기"를 선택해주세요.`; Android: `외부 브라우저에서 열기`.

## Accessibility

- Every field has a `<label htmlFor>` bound to the `Input` `id` and `required`; nothing adds `aria-required`, `aria-invalid` or `aria-describedby` (the register hint is not linked to its field).
- The error alert is a plain `<div>` with no `role="alert"` or `aria-live`, so a failed submit is not announced.
- Headings: the hero `<h1>` and the form `<h1>` make two level-one headings per page, with the wordmark as an `<h2>` between them and bullet titles as `<h3>`.
- Both logos carry `alt="영남대학교"`; the three Lucide check icons render `aria-hidden="true"` (lucide-react default when no a11y prop is passed); the inline Google G has no `aria-hidden` and no title.
- Guest, in-app and Google buttons are native `<button type="button">`; the footer link is a Next `Link`. Submit is a native `type="submit"` disabled while loading.
- No `keep-all`: Korean lines may break between syllables when the panel narrows.

## Not reproduced

- Motion: the 8s gradientShift panning of `.animate-gradient` (the panel rests on `yu-navy-hover` → `yu-navy`, its 0% keyframe; `background-size: 200% 200%` is kept), `.animate-float` on the discs (3s, `anim-delay-300/400/500/600`), `.animate-fade-in` on the hero and `.animate-fade-in-up` on the form box (0.6s ease-out entrances).
- `useAuth` submit, Google OAuth redirect, guest mode (`enterGuestMode()` then `window.location.href = '/planner'`), the register password checks, and `detectInAppBrowser()` / the automatic `openInExternalBrowser()` on Android.
- `next/image` loading; the preview uses `<img>` with the source's `width`/`height` attributes.
- The register brand panel (different headline, bullets and disc geometry) and the lg layout (60/40 split, 48px headline) are CSS-only here; the preview shows the login page at md.

Pattern extracted from inline markup in `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx` (with `src/components/ui/Button.tsx` and `src/components/ui/Input.tsx` for the primitives it reuses); no component exists in the source.
