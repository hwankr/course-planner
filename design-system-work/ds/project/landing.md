# Landing page

The marketing page (`src/app/page.tsx`) is the loud register of the brand: dark navy gradients, diagonal section edges, giant outlined numerals, a typewriter headline. Nothing from this page belongs inside the product UI, and nothing from the product UI (cards, tables, chips) appears here. Use this section when you build a marketing or auth surface; use the brand book's foundations for everything behind the login.

## Page skeleton

Sticky glass nav → full-viewport hero → white overview section (`space-24` vertical padding) → dark flow band (`space-32`, 160px from `md` — `py-40`, no token, with diagonal top and bottom edges) → pale-blue closing CTA (`space-24`). Anchored sections carry `scroll-mt-20` (80px) to clear the nav. The root layout's shared `Footer` follows the closing CTA.

## Surfaces

- **Hero**: `linear-gradient(to bottom right in oklab, yu-navy-deepest, yu-navy, yu-navy-dark)`, under a second wash `to bottom, yu-navy-deepest-a60 → yu-navy-a30 → yu-navy-deepest-a80` that sits over a mosaic of five product screenshots at 8% opacity, rotated ±1–3°, `radius-xl`, 1px blur. Two `deco-ring` circles (400px and 200px, 2px `yu-cyan-a15` stroke) and two blurred orbs (`yu-blue-a10` 384px, `yu-cyan-a8` 288px, `blur-3xl` = 64px) float behind the copy. The bottom edge is cut by `clip-hero-bottom` (`polygon(0 0, 100% 0, 100% 88%, 0 100%)`).
- **Overview**: `white`, with a 500px `yu-cyan-a5` disc off the left edge and a `.bg-dots` patch (`black-a6` dots on a 24px grid) at 20% in the corner.
- **Flow band**: `linear-gradient(to bottom right in oklab, landing-navy-stop, yu-navy)`, clipped by `clip-diagonal-both` (`polygon(0 6%, 100% 0, 100% 94%, 0 100%)`), with a faint `.bg-grid` and one `deco-ring` at 10%.
- **Closing CTA**: `linear-gradient(to bottom, white, yu-tint-sky, yu-tint-ice)` with a 600px `yu-cyan-a8` glow centered behind the copy.

## Navigation

Sticky, `z-modal`, `.glass` (`white-a70`, 12px backdrop blur, 1px `white-a30` border, which overrides the source's `gray-200` 50% bottom hairline); container with `space-4` gutters and `space-4` vertical padding. Left: the color logo at 24px beside the wordmark "YU 수강 플래너" in `heading-3` size, bold, filled with `.text-gradient` (`135deg yu-navy → yu-blue → yu-cyan`, clipped to text). Right, from `md`: three section links in `body-sm` `gray-500` hovering to `yu-navy`, then a pill — `radius-full`, `yu-navy-a5` fill, `yu-navy-a20` border, `space-1-5` × `space-4`, `body-sm-medium` in `yu-navy`, hover `yu-navy-a10` — reading 로그인 or, when signed in, 플래너로 이동. Below `md` the links simply disappear; there is no menu.

## Hero copy block

Centered in a `container-3xl` column. A badge pill (`white-a10` fill, `white-a20` border, `radius-full`, `space-2` × `space-4`) with a 16px `sparkles` icon and "YU the Future" in `body-sm-medium` `white-a80`, scaling in. The headline is two lines of `display-sm` → `display-lg` (`sm`) → `display-xl` (`lg`), bold, `leading-tight`, `tracking-tight`: line one "영남대학교 생활을" in `white-a90`; line two typed character by character (100 ms per glyph in, 50 ms out, 2 s hold) through 스마트하게 설계하다. / 직관적으로 관리하다. / 아름답게 기록하다., filled with `.text-gradient-typing` (`90deg yu-cyan-light → gradient-typing-blue → gradient-typing-violet → yu-cyan-light`, animated, with a `yu-cyan-a40` glow) over a skewed `yu-cyan-a30` highlight bar, followed by a blinking `|`. Under it, `body` (18px from `lg`) copy in `white-a60`, `leading-relaxed`, `container-xl` wide; then the CTA pair; then a `body-sm` `white-a40` footnote "비회원은 데이터가 저장되지 않습니다" (about 3.1:1 on navy — kept, flagged).

## CTA pair

Primary first, ghost second; stacked on phones, inline from `sm`, `space-4` apart. Both are the Button component at size `lg` (44px, `space-8` horizontal padding).

- Hero primary is a white button with `yu-navy` text and `shadow-lg` in `black-a20`, with a 20px `arrow-right` icon that slides 4px on hover. The source passes `bg-white text-[#153974]` to the default (gradient) variant; tailwind-merge files `bg-gradient-to-r` and `bg-white` in the same background group and drops the gradient, so the white renders — the recipe leans on that merge, so prefer an explicit outline or custom variant.
- Hero ghost: `white-a70` text, hover `white` on `white-a10`.
- Closing CTA primary: the default gradient Button with `shadow-glow`; closing ghost: the plain ghost variant (inherits body text, hovers `gray-100`).

## Section headings

Eyebrow in `body-sm`, uppercase, 0.2em tracking (`tracking-widest` 0.1em, medium weight and `space-4` below in the closing section), semibold, `yu-cyan`, `space-3` below; the `h2` in `heading-1` → `display-sm` (`md`), bold, `tracking-tight`, `gray-900` on light and `white` on dark, `space-4` below; a lead in `gray-500` or `white-a60`, `container-lg` wide (the closing lead fills its `container-2xl` column). The overview block is left-aligned from `md`; the others stay centered. The closing CTA's heading grows to `display-md` at `md`.

## Feature rows (overview)

Four alternating two-column rows (`space-8` gap, 64px → 96px apart), each pairing a giant outlined numeral with a text block. The numeral is `.deco-number`: `clamp(80px, 15vw, 160px)`, weight 800, transparent fill, 1.5px `yu-navy-a8` stroke, non-interactive. The text block leads with an 8px `yu-cyan` disc (`.deco-dot-accent`) beside a `heading-2`-size bold title in `gray-900`, then `body` copy in `gray-600`, `leading-relaxed`. No cards, borders or shadows — the rows are typographic.

## Flow steps (dark band)

Three centered columns from `md` (`space-8` side padding) separated by 1px vertical gradient rules (`transparent → white-a20 → transparent`); stacked on phones with 75%-wide horizontal rules (`white-a15`). Each step: the numeral in `.deco-number-light` (1.5px `white-a6` stroke; 56px inline on phones), a 24px `yu-cyan` icon (`mouse-pointer-click`, `layout-grid`, `check-circle`), a `heading-3`-size bold white title (가입 / 계획 / 완성), and `body-sm` `white-a60` copy, `leading-relaxed`.

## Motion on this page

Nav `fade-in-down`; badge `scale-in`; headline, lead, CTA row and footnote `fade-in-up` staggered with `anim-delay-100/200/300`; every section block and row reveals on scroll with `scroll-delay-0 … 300`; the headline gradient and cursor loop. All of it is disabled under `prefers-reduced-motion` except the JavaScript typewriter and the headline gradient flow.

## Utilities defined for this page only

In use: `.glass` (the sticky nav), `.text-gradient` (also the auth panels, statistics, onboarding and the app header), `.text-gradient-typing`, `.bg-mesh` (five radial brand tints; only on the login and register brand panels, at 30% opacity), `.bg-dots`, `.bg-grid` (also the dashboard shell), `.shadow-glow`, `.clip-diagonal-both`, `.clip-hero-bottom`, `.deco-number`, `.deco-number-light`, `.deco-ring` (+ `-lg`, `-sm`), `.deco-dot-accent`, `.divider-vertical-gradient`, `.divider-horizontal-gradient`. Defined but applied by no page: `.glass-strong`, `.text-gradient-light`, `.text-gradient-warm`, `.card-hover`, `.gradient-border` (a 1px `yu-navy → yu-blue → yu-cyan` ring masked to the edge), `.section-line` (40 × 3px `yu-navy → yu-cyan` rule), `.clip-diagonal-top`, `.stat-separator` (1 × 40px `white-a20`). They live in `globals.css`; copy the definition, not the name, when you reuse one elsewhere.
