Full-width site footer on the deep `footer-navy` ground: a 1px blue hairline on top, a brand column with the white YU logo, wordmark and a click-to-copy contact line, three link columns (Service, Support, Legal), a copyright bar and a 4px navy-to-cyan brand gradient along the bottom edge.

## Use it for / don't use it for

- Use it once, at the end of every page: `RootLayout` renders `<Footer />` after the `flex-1 bg-gray-50` page wrapper inside a `flex flex-col min-h-screen` body, and `mt-auto` pins it to the bottom of short pages.
- Use `CopyEmail` only as the footer's contact line; it is a part of Footer, not a general copy button.
- Don't use it inside cards, modals or the planner frame, and don't add columns or links without a route: every link maps to an app route or the university site.

## What the consumer provides

- `Footer` takes no props and has no children slot; all copy, routes and the contact address are hardcoded.
- `CopyEmail` takes `email: string` (required, no default; the footer passes `fabronjeon@gmail.com`). It is a client component (`'use client'`) that keeps a local `copied` boolean for 2000 ms after a click.
- Container: the body's flex column. The footer spans the full viewport width; its content sits in a Tailwind `container mx-auto px-4` (100% wide, max-width 640 / 768 / 1024 / 1280 / 1536px at the sm / md / lg / xl / 2xl breakpoints).

## Anatomy and states

- Root `<footer>`: `margin-top: auto`; inherits the body's `body` type (16px/1.5 `font-body`) and `foreground` color. Every visible text sets its own color.
- Top hairline: 1px tall, `linear-gradient(to right in oklab, transparent, yu-blue, transparent)`. Decorative; `yu-blue` is 2.7:1 on `footer-navy`.
- Body: fill `footer-navy`, padding `space-16` top and `space-8` bottom.
- Grid: 2 columns below md, 4 from md (768px); `gap: space-10`, `margin-bottom: space-12`. At md the container is 768px wide and each column 154px.
- Brand column: spans 2 columns below md, 1 from md. The logo link is a flex row, `align-items: center`, `gap: space-2`, `margin-bottom: space-4`, with no hover or focus style of its own.
  - Logo: `yu-logo-white.svg` at height `space-6` (24px), width auto (about 125px from the 297.4×57.3 viewBox), `color: transparent` from next/image.
  - Wordmark: `text-lg` at weight 700 (18px/28px, the `heading-4` size in bold) in `white` (14.8:1). At md (768–1023px) the column is 154px, narrower than logo (≈125px) + 8px gap + wordmark (≈137px), so the span shrinks to its min-content and wraps one syllable per line (6 lines); at lg (1024–1279px) the 218px column wraps it to two lines; it sits on one line from xl (1280px, 282px column). Kept exact, flagged.
  - Blurb `<p>`: `body-sm` in `gray-400` with `leading-relaxed` and `margin-bottom: space-3`. Empty in the source, so it renders no height and its margin collapses into the link's `space-4`. Kept exact.
  - CopyEmail: a bare `<button>` (preflight resets, `cursor: pointer`) in `body-sm` `gray-400` (5.7:1 on `footer-navy`); hover `white`, `transition-colors` over `duration-fast` with `ease-standard`. Mirror `.is-hover`. Label `Contact : {email}`, `title="클릭하여 복사"`.
  - Copied state: for 2000 ms after a click a trailing `<span>` `복사됨!` appears, `margin-left: space-2`, `caption` size in `yu-cyan` (5.4:1 on `footer-navy`). The button text itself keeps its color.
- Link columns (Service, Support, Legal):
  - Heading `<h4>`: `overline` (600 12px/16px, `letter-spacing: 0.1em`, uppercase) in `white`; `margin-bottom: space-5`.
  - List: `body-sm` in `gray-400` (5.7:1), `space-3` between items. Links inherit the color; hover `yu-cyan` (5.4:1) with `transition-colors`. Mirror `.is-hover`. No underline and no focus style beyond the browser default.
  - Disclaimer (Legal only): `margin-top: space-4`, `caption` size at `leading-relaxed` (12px/19.5px) in `gray-500`. 3.05:1 on `footer-navy` in the source, misses 4.5:1; kept, flagged.
- Bottom bar: 1px top border in `white-a10` (1.3:1, decorative), `padding-top: space-6`; a column below md, a row with `justify-content: space-between` from md; `align-items: center`, `gap: space-4`.
  - Copyright: `caption` in `gray-500` (3.05:1; kept, flagged).
  - Icon row: flex with `space-5` between children (a single child in the source). The mail link is `gray-500` (3.05:1, meets 3:1 for a non-text icon by a hair), hover `white`, `transition-colors`; Lucide `mail` at `icon-md` (16px), 2px stroke in `currentColor`. Mirror `.is-hover`.
- Bottom gradient bar: height `space-1` (4px), `linear-gradient(to right in oklab, yu-navy, yu-blue, yu-cyan)`.

## Copy

- Wordmark `YU 수강 플래너`; logo `alt` `영남대학교`.
- CopyEmail `Contact : fabronjeon@gmail.com`; tooltip `클릭하여 복사`; feedback `복사됨!`.
- Service (`/planner`, `/planner`, `/statistics`, `/help`): `수강 계획` · `졸업 요건 추적` · `학과 통계` · `도움말`.
- Support: `문의 및 건의` (`/help/feedback`) · `영남대학교 바로가기` (https://www.yu.ac.kr/main/index.do, new tab).
- Legal: `개인정보처리방침` (`/privacy`) · `이용약관` (`/terms`); disclaimer `이 서비스는 영남대학교 공식 서비스가 아닙니다`.
- Bottom bar: `© {year} YU 수강 플래너. All rights reserved.` where the year is `new Date().getFullYear()` (the preview shows 2026). The mail link opens `mailto:fabronjeon@gmail.com`.
- Column headings stay English in the source: `Service`, `Support`, `Legal`.

## Accessibility

- `<footer>` provides the `contentinfo` landmark; there is no `<nav>` or `aria-label` around the link columns, and the three `<h4>` headings sit outside the page's heading order.
- The logo `<img>` has `alt="영남대학교"` and shares its link with the wordmark text.
- CopyEmail is a native `<button type="button">` with a `title` tooltip; nothing announces `복사됨!` (no `aria-live`), and the accessible name does not change.
- The mail icon link has no `aria-label` or text, and lucide-react renders the SVG with `aria-hidden="true"`, so the link has no accessible name beyond its `href`.
- The external link uses `target="_blank" rel="noreferrer"` with no visual or spoken new-tab hint.
- No focus styles are set anywhere; links and the button take the browser's default focus ring on `footer-navy`.

## Not reproduced

- `navigator.clipboard.writeText(email)` and the 2000 ms `copied` timer; the preview shows the copied span statically in the state strip.
- Next.js `Link` prefetching and `next/image` loading; the preview uses a plain `<img>` with `width="120" height="48"` as the component renders.
- The dynamic copyright year.
- Hover states are shown at rest through `.is-hover` in the state strip; the real pointer states also work in the preview.

Static rendition hand-translated from `src/components/ui/Footer.tsx` and `src/components/ui/CopyEmail.tsx`.
