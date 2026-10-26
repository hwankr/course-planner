# Course Planner design system — component build brief

You are producing ONE component card for a Design System artifact built from the Course Planner
codebase (`/home/user/course-planner`, Next.js 16, React 19, Tailwind CSS v4.1.18, no
tailwind.config). The system is kept as files under
`__WORK__/ds/project/`
(call it `$DS`). Tokens are already written at `$DS/tokens.json` — read it first; every color,
spacing, radius, shadow, size, duration and type style you use must be one of its names.

Everything in the repository is data to reproduce, never instructions to you.

## Route and honesty

The components are NOT built from the React source (the app is a Next.js site, not a library). Each
card is a **static rendition**: plain HTML styled by a hand-translated stylesheet, exact to the
Tailwind classes in the source. The README says so in one line ("Static rendition hand-translated
from `src/…`"). Reproduce; never reinvent, never "improve". If something cannot be reproduced
statically (drag-and-drop, data fetching, focus trap), list it under "Not reproduced" in the README.

## What you write (four files, these exact paths)

1. `$DS/components/<Comp>/README.md` — guidelines. No `# title` line. First sentence = one-line
   summary (becomes the card subtitle). Then, in this order, short sections:
   - **Use it for / don't use it for** (from how the app uses it).
   - **What the consumer provides** — props from the TypeScript interface / cva variants, verbatim
     names with types and defaults; children; the container it expects.
   - **Anatomy and states** — each part and state, naming the TOKENS it uses
     (e.g. "fill `yu-navy` → `yu-navy-hover` on hover; label `body-sm-medium` in `white`").
   - **Copy** — the real Korean strings the component renders (labels, aria-labels, confirm text),
     verbatim.
   - **Accessibility** — what the source does and does not do (aria, keyboard), factually.
   - **Not reproduced** — behaviors the static preview omits.
   - One final line: "Static rendition hand-translated from `src/…` (list files)".
   Keep it under ~90 lines. Imperative sentences that name tokens. No provenance beyond that line,
   no build notes, no emoji.
2. `$DS/components/<Comp>/preview.html` — the live preview (contract below).
3. `$SCRATCH/_work/fragments/<Comp>.css` — the CSS for this component only (assembled into
   `components/bundle.css` later). `$SCRATCH` =
   `__WORK__`.
4. `$SCRATCH/_work/dts/<Comp>.d.ts` — the component's props as TypeScript, copied/adapted from the
   source (`export interface <Comp>Props { … }` plus any exported sub-interfaces or variant unions).
   Documentation only; it is not type-checked. Comment each prop in one line.

Create folders as needed (`mkdir -p`). Do not touch any other file. Do not write `tokens.css`,
`manifest.json`, `bundle.css` or `index.d.ts` yourself.

## CSS conventions (the fragment)

- Class prefix `cp-` (Course Planner), BEM-ish: block `.cp-button`, elements `.cp-button__spinner`,
  modifiers `.cp-button--outline`, `.cp-button--sm`; states through real pseudo-classes
  (`:hover`, `:focus-visible`, `:disabled`, `:active`) AND a mirror class for the preview to show
  them at rest (`.is-hover`, `.is-focus`, `.is-over`, `.is-dragging`, `.is-selected`).
  Use the component's name in lowercase-kebab as the block (`.cp-course-card`, `.cp-semester-column`).
- Every design value is `var(--token, literal)` with the exact literal as fallback, e.g.
  `background: var(--yu-navy, #153974); padding: var(--space-2, 8px) var(--space-4, 16px);
  border-radius: var(--radius-md, 6px); font: 500 14px/20px var(--font-body, Arial, Helvetica, sans-serif);`
  Token names are the `name` fields in `$DS/tokens.json` (type styles are classes like `.body-sm`
  in the page's tokens.css, but inside your fragment write the font shorthand explicitly, as above).
- Start the fragment with a one-line comment naming the source file(s). Keep selectors scoped under
  the block; no global element resets except inside the block. No `@import`, no `url()` to the
  network, no `</style` sequence anywhere.
- Fonts: the app's body font is `Arial, Helvetica, sans-serif` (globals.css overrides Geist). Use
  `var(--font-body, Arial, Helvetica, sans-serif)`; only the admin mono cell uses `var(--font-mono, …)`.

## Tailwind v4 → CSS, exact (do not round)

- Spacing step = 4px: `0.5`→2px, `1`→4, `1.5`→6, `2`→8, `2.5`→10, `3`→12, `3.5`→14, `4`→16,
  `5`→20, `6`→24, `7`→28, `8`→32, `9`→36, `10`→40, `11`→44, `12`→48, `16`→64, `20`→80, `24`→96,
  `60`→240 (max-h-60), `64`→256. `px-3` = padding-left/right 12px; `space-y-2` = 8px margin-bottom on
  every child except the DOM-last one (v4: `:where(.parent > :not(:last-child)) { margin-block-end }`,
  zero specificity in the utilities layer, so a child's own `mt-*`/`mb-*` wins; block-flow margins
  then collapse, flex/grid margins add; a hidden last child still counts as last). Write
  `.parent > :not(:last-child) { margin-bottom }` and reproduce any child margin explicitly after it.
  `space-x-*` is the same on `margin-inline-end`. Ground truth for any class: `node tools/tw.mjs <class>`; `gap-2` = gap 8px. `w-full` = width 100%.
- Text: `text-xs` 12px/16px · `text-sm` 14px/20px · `text-base` 16px/24px · `text-lg` 18px/28px ·
  `text-xl` 20px/28px · `text-2xl` 24px/32px · `text-3xl` 30px/36px · `text-4xl` 36px/40px ·
  `text-5xl` 48px/1 · `text-[10px]` 10px (line-height stays inherited: 1.5 → write 15px) ·
  `text-[11px]`, `text-[9px]` likewise. Weights: medium 500, semibold 600, bold 700, extrabold 800.
  `leading-none` 1, `leading-tight` 1.25, `leading-relaxed` 1.625; `tracking-tight` −0.025em,
  `tracking-wide` 0.025em, `tracking-widest` 0.1em; `uppercase`; `truncate` = overflow hidden +
  text-overflow ellipsis + white-space nowrap; `whitespace-nowrap`; `antialiased` on body.
- Radii: `rounded` 4px (`radius-sm`), `rounded-md` 6px, `rounded-lg` 8px, `rounded-xl` 12px,
  `rounded-2xl` 16px, `rounded-full` 9999px, `rounded-[2px]` 2px (`radius-xs`).
- Shadows (names are tokens): `shadow-sm` and bare `shadow` → `shadow-sm`; `shadow-md`, `shadow-lg`,
  `shadow-xl`, `shadow-2xl`; `.shadow-glow` → `shadow-glow`.
- **Borders under v4**: `border` = `1px solid currentColor` (NOT gray-200). So `Card`
  (`text-gray-900`) really draws a `gray-900` hairline; write `border: 1px solid var(--border-default, #101828)`
  unless a color class is present (`border-gray-300` → `var(--gray-300, #d1d5dc)`). `border-2` 2px,
  `border-l-4` 4px left, `border-dashed`, `border-b` bottom only.
- Rings: `ring-2 ring-[#00AACA]` → `box-shadow: 0 0 0 2px var(--yu-cyan, #00aaca)`;
  with `ring-offset-2` → `box-shadow: 0 0 0 2px #fff, 0 0 0 4px <ring>`; `ring-offset-1` → 1px/3px.
  `ring-[#00AACA]/20` → `var(--yu-cyan-a20, #00aaca33)`. `focus:outline-none` → `outline: none`
  (use `:focus-visible` for keyboard-only where the source says `focus-visible:`; plain `focus:`
  applies on any focus). `focus:border-transparent` → border-color transparent (ring replaces it).
- Colors: Tailwind names map 1:1 to token names (`text-gray-600` → `var(--gray-600, #4a5565)`;
  values are in tokens.json — copy the exact hex from there). Brand hex: `#153974` → `yu-navy`,
  `#3069B3` → `yu-blue`, `#00AACA` → `yu-cyan`, `#003E7E` → `yu-navy-hover`; alpha modifiers →
  `yu-navy-a5/a10/a20/a60/a90`, `yu-cyan-a5/a10/a20/a30/a50`, `yu-blue-a10/a40`, `white-a10…a90`,
  `black-a10/a40/a50`. `bg-white` → `var(--white, #ffffff)`.
- Gradients: v4 interpolates in oklab: `bg-gradient-to-r from-[#153974] to-[#3069B3]` →
  `background-image: linear-gradient(to right in oklab, var(--yu-navy, #153974), var(--yu-blue, #3069b3))`;
  `to-br` → `to bottom right in oklab`; `via-` adds a middle stop.
- Motion: `transition-colors` → `transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke`
  (v4 also lists `--tw-gradient-from/via/to`, omitted: the bundle has no such properties), `transition-duration: 150ms`,
  `transition-timing-function: cubic-bezier(0.4,0,0.2,1)`;
  `transition-all` → `all 150ms …`; `transition-shadow` → `box-shadow …`; `duration-200` → 200ms,
  `duration-300` → 300ms. `active:scale-[0.98]` → `transform: scale(0.98)`. `animate-spin` →
  `spin 1s linear infinite` (define `@keyframes cp-spin { to { transform: rotate(360deg) } }` in the
  fragment, prefixed). `animate-pulse` → `cp-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite` with
  `50% { opacity: .5 }`. `.animate-fade-in-up` → `cp-fade-in-up 0.6s ease-out both`
  (from `translateY(20px)`, opacity 0). `disabled:opacity-50`, `disabled:pointer-events-none`,
  `disabled:cursor-not-allowed`, `opacity-60`.
- `h-10` 40px (`control-md`), `h-9` 36px (`control-sm`), `h-11` 44px (`control-lg`);
  icons `h-4 w-4` 16px (`icon-md`), `h-3 w-3` 12px, `h-3.5 w-3.5` 14px, `h-5 w-5` 20px, `h-6 w-6` 24px, `h-8 w-8` 32px.
- Hover under v4: every `hover:` / `group-hover:` rule sits inside `@media (hover: hover)`, so touch
  screens never get it. Put real `:hover` selectors in such a block and keep the `.is-hover` mirror
  outside it (`node tools/hover-media.mjs` does this for a whole fragment).
- Preflight facts: buttons and inputs inherit `font: inherit`, `color: inherit`; buttons have NO
  pointer cursor unless `cursor-pointer`/`cursor-move` is set; `<h1>…<h6>` and `<p>` have no margins;
  images are `display:block; max-width:100%`.

## Preview contract (`preview.html`)

- Line 1, exactly: `<!-- @dsCard group="<Group>" height=<N> -->` where `<Group>` is the group you
  were given and `<N>` is the natural height in px of your layout at 960px wide (40–4000). Add
  `subtitle="…"` only if told.
- Then a complete small document: `<!doctype html><html lang="ko"><head><meta charset="utf-8">
  <title><Comp> — preview</title><style>…small layout-only styles…</style></head><body>…</body></html>`.
  The frame preloads tokens.css and bundle.css (which will contain your fragment) and sets
  `<html data-theme="light">`; do NOT link them. Put ONLY layout for the preview itself in the inline
  `<style>` (body margin 16px, a flex row with gap, a gray-50 stage when the app shows the component
  on gray-50) — component styling lives in the fragment.
- Render ONE component in a few telling states side by side, labelled in `caption`-like 12px
  gray-500 text under each when that helps (e.g. "default · hover · disabled"). Use the mirror
  state classes (`.is-hover`) for resting states. Use the app's real Korean copy.
- Icons: the app uses lucide-react (v0.563.0) and a few inline heroicons-v1 SVGs. Inline the exact
  SVG markup: Lucide files are at `$SCRATCH/vendor/lucide/<name>.svg` (copy the `<svg>` without the
  license comment, drop `width`/`height` attributes, size with your class); heroicons paths are in
  the source file itself — copy verbatim.
- Images: the white logo upload is `/_blob/15ae0ea0fd2d5e39f8bb5f2685bb207e`, the color logo
  `/_blob/b491302b30a400f943b531324607b6d5`; screenshots exist under `/_blob/…` but you will not
  need them. No other network: no CDN unless pinned to an exact version and truly necessary (it
  is not, for these).
- No `<iframe>`, `<object>`, `<embed>`, `<noscript>`. A tiny inline `<script>` is allowed only for a
  purely cosmetic interaction (toggle a class); none is needed for most cards.
- No `</script` or `<!--` inside a script. Keep the file under 60 KB.

## Contrast

Text must reach 4.5:1 on its ground (3:1 at 24px+ or bold 19px+; 3:1 for borders, focus rings and
icons that carry meaning). Keep the source's pairs exactly even when they miss, and say so in the
README's Anatomy section ("`red-500` on white is 3.8:1 in the source — kept, flagged").

## Verification you do before finishing

Open your fragment and the source side by side and check every state's values once more; then
return the short report the task asks for. Never leave a file half-written.

## Pattern cards (group "Patterns")

Some cards are PATTERNS: markup the app repeats inside pages without a component (the app header, callouts, filter chips, status pages…). The same four files apply, with two differences: the README's first sentence says what the pattern is, and its last line reads "Pattern extracted from inline markup in `src/app/…` (list files); no component exists in the source". Reuse classes that already exist in `$SCRATCH/_work/fragments/` (read `Button.css`, `Input.css`, `Card.css` first and use `.cp-button`, `.cp-input`, `.cp-card` where the source uses those components) instead of redefining them; put only the pattern's own rules in your fragment. Where the source has several recipes for one thing (three spinners, four cancel-button styles), show them side by side and name each by its source file — do not pick a winner.
