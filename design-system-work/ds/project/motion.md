# Motion

Motion lives in two registers. Product screens (planner, forms, admin) move almost nothing: `transition-colors` at the Tailwind default 150 ms (`duration-fast`, `ease-standard`) on hover and focus, a 200 ms `transition-all` on Button and Input, and a 300 ms shadow lift on Card. The landing page and the auth brand panel are where the floats, gradients and most entrances live (profile and onboarding cards, the mobile menu and Toast also fade in). Keep that split: never add a landing-page entrance to a dashboard list.

## Durations and curves

| Token | Value | Where |
| --- | --- | --- |
| `duration-fast` | 150ms | Every bare `transition-colors` (151 of 153 uses; 2 onboarding step labels add `duration-300`) — links, nav, chips, icon buttons |
| `duration-base` | 200ms | Button and Input `transition-all duration-200`, `.drag-scroll-active`, compact column collapse |
| `duration-slow` | 300ms | Card `transition-shadow duration-300`, scale-in / slide-up / slide-down (and the unused `.card-hover`) |
| `duration-enter` | 500ms | `fadeInDown`, `slideInLeft`, `slideInRight` |
| `duration-enter-long` | 600ms | `fadeIn`, `fadeInUp` (the common entrance, 17 uses, 8 of them profile cards), `bounceSoft` |
| `duration-scroll` | 700ms | `.animate-on-scroll` reveal |
| `duration-ambient` | 3s | `float`; loops: `pulseSoft` 2s, `shimmer` 2s, `gradientShift` 8s, `gradientFlow` 4s, `cursorBlink` 1s |
| `ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | Tailwind default; `.animate-on-scroll` (and the unused `.card-hover`) |
| `ease-out` | cubic-bezier(0, 0, 0.58, 1) | Every entrance utility (CSS keyword `ease-out both`) |
| `ease-in-out` | cubic-bezier(0.42, 0, 0.58, 1) | `float`, `pulseSoft` (CSS keyword) |

## Keyframe utilities (globals.css)

All are `animation: <name> <duration> <ease> both` unless marked loop. Use the class, not the keyframe.

| Class | From → to | Duration | Used by |
| --- | --- | --- | --- |
| `.animate-fade-in` | opacity 0 → 1 | 0.6s ease-out | auth brand-panel copy, profile banner |
| `.animate-fade-in-up` | opacity 0, translateY(20px) → rest | 0.6s ease-out | Toast entry, profile and onboarding cards, auth form panel, landing hero (17) |
| `.animate-fade-in-down` | opacity 0, translateY(−20px) → rest | 0.5s ease-out | landing nav, onboarding header, mobile nav menu |
| `.animate-slide-in-left` / `-right` | translateX(∓30px) → rest | 0.5s ease-out | defined, unused |
| `.animate-scale-in` | scale(.95), opacity 0 → rest | 0.3s ease-out | landing hero badge |
| `.animate-slide-up` / `-down` | translateY(±100%) → rest | 0.3s ease-out | defined, unused in pages |
| `.animate-bounce-soft` | translateY(0 → −5px → 0) | 0.6s ease | defined, unused |
| `.animate-float` | translateY(0 → −10px → 0) | 3s ease-in-out loop | auth brand-panel orbs (6) |
| `.animate-pulse-soft` | opacity 1 → .7 → 1 | 2s ease-in-out loop | defined, unused |
| `.animate-gradient` | background-position sweep, `background-size: 200% 200%` | 8s ease loop | auth brand-panel backgrounds (2) |
| `.animate-shimmer` | translateX(−100% → 100%) | 2s loop | defined, unused |
| `.animate-cursor` | opacity blink | 1s step-end loop | landing typewriter caret |
| `.text-gradient-typing` | `gradientFlow` background-position, `background-size: 300% 100%`, drop-shadow 0 0 20px `yu-cyan` at 40% | 4s ease loop | landing hero headline |
| Tailwind `animate-pulse` | opacity 1 → .5 → 1 | 2s cubic-bezier(0.4,0,0.6,1) loop | skeletons (34), first-time status-pill hint |
| Tailwind `animate-spin` | rotate 360° | 1s linear loop | Button spinner, `loader-2` icons (9), border-ring spinners (6) |

Stagger with `.anim-delay-100` … `.anim-delay-700` (100 ms steps; the `anim-delay-50` on two profile cards is never defined and does nothing): these set `animation-delay` and work only with the `animate-*` classes above.

## Scroll reveal

`.animate-on-scroll` starts at opacity 0, translateY(24px) and transitions opacity and transform over 700 ms `ease-standard`; JavaScript adds `.visible` when the block enters the viewport. Stagger siblings with `.scroll-delay-0 / -100 / -150 / -200 / -300 / -400 / -450 / -500` — these set `transition-delay`, not `animation-delay`, so never mix them with `anim-delay-*`. Used on 13 landing blocks.

## Hover and press

- Card: `shadow-sm` → `shadow-md` over 300 ms. globals.css also defines `.card-hover` (lift `translateY(−4px)`, `shadow-card-hover`), but no page applies it.
- Button: `active:scale-[0.98]`, 200 ms `transition-all`; the primary gradient darkens to `yu-navy-hover` → `yu-navy` and the shadow grows `shadow-sm` → `shadow-md`.
- Links and icon buttons: color only, 150 ms.
- Compact status pill: `hover:ring-2 hover:ring-offset-1 hover:ring-gray-300`.
- Every `hover:` utility applies only where the device can hover: Tailwind v4 wraps it in `@media (hover: hover)`, so touch screens never show a hover state. Never put information only in a hover state. In the bundle, real `:hover` selectors sit in such blocks and previews show the state through `.is-hover` mirror classes.

## Drag and drop (dnd-kit)

The dragged course translates with `CSS.Translate` and no transition; the source fades to `opacity-50`; the target column gets a `yu-cyan-a5` wash instantly, while its `ring-2 yu-cyan-a50` eases in over 300 ms (Tailwind rings are box-shadows, which Card transitions). While the planner auto-scrolls during a touch drag from the catalog, the catalog gets `.drag-scroll-active` (opacity .3, pointer-events none, 200 ms). `scroll-behavior: smooth` is deliberately NOT set on `html` because it fights the drag library's scroll tracking; use the `smoothScrollTo()` utility.

## Reduced motion

`@media (prefers-reduced-motion: reduce)` disables every `animate-*` utility and `.animate-on-scroll` (opacity 1, transform none, no animation or transition). Tailwind's `animate-pulse` / `animate-spin`, the `.text-gradient-typing` loop and the 150–500 ms transitions are not covered; keep them short.

## Known dead classes

`ZoomableImage` applies `animate-in fade-in duration-200` to its lightbox; those names come from the `tailwindcss-animate` plugin, which is not installed, so the lightbox appears without animation. Do not copy them.
