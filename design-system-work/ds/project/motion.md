# Motion

Motion lives in two registers. Product screens (planner, forms, admin) move almost nothing: `transition-colors` at the Tailwind default 150 ms (`duration-fast`, `ease-standard`) on hover and focus, a 200 ms `transition-all` on Button and Input, and a 300 ms shadow lift on Card. The landing page and the auth brand panel are where the entrances, floats and gradients live. Keep that split: never add a landing-page entrance to a dashboard list.

## Durations and curves

| Token | Value | Where |
| --- | --- | --- |
| `duration-fast` | 150ms | Every `transition-colors` (153 uses) — links, nav, chips, icon buttons |
| `duration-base` | 200ms | Button and Input `transition-all duration-200`, `.drag-scroll-active`, compact column collapse |
| `duration-slow` | 300ms | Card `transition-shadow duration-300`, `.card-hover`, scale-in / slide-up / slide-down |
| `duration-enter` | 500ms | `fadeInDown`, `slideInLeft`, `slideInRight` |
| `duration-enter-long` | 600ms | `fadeIn`, `fadeInUp` (the common landing entrance, 17 uses), `bounceSoft` |
| `duration-scroll` | 700ms | `.animate-on-scroll` reveal |
| `duration-ambient` | 3s | `float`; loops: `pulseSoft` 2s, `shimmer` 2s, `gradientShift` 8s, `gradientFlow` 4s, `cursorBlink` 1s |
| `ease-standard` | cubic-bezier(0.4, 0, 0.2, 1) | Tailwind default; `.card-hover`, `.animate-on-scroll` |
| `ease-out` | cubic-bezier(0, 0, 0.2, 1) | Every entrance utility (`ease-out both`) |
| `ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | `float`, `pulseSoft` |

## Keyframe utilities (globals.css)

All are `animation: <name> <duration> <ease> both` unless marked loop. Use the class, not the keyframe.

| Class | From → to | Duration | Used by |
| --- | --- | --- | --- |
| `.animate-fade-in` | opacity 0 → 1 | 0.6s ease-out | landing sections |
| `.animate-fade-in-up` | opacity 0, translateY(20px) → rest | 0.6s ease-out | Toast entry, patch-note cards, landing blocks (17) |
| `.animate-fade-in-down` | opacity 0, translateY(−20px) → rest | 0.5s ease-out | landing hero eyebrow and nav |
| `.animate-slide-in-left` / `-right` | translateX(∓30px) → rest | 0.5s ease-out | landing split sections |
| `.animate-scale-in` | scale(.95), opacity 0 → rest | 0.3s ease-out | one modal panel |
| `.animate-slide-up` / `-down` | translateY(±100%) → rest | 0.3s ease-out | defined, unused in pages |
| `.animate-bounce-soft` | translateY(0 → −5px → 0) | 0.6s ease | defined, unused |
| `.animate-float` | translateY(0 → −10px → 0) | 3s ease-in-out loop | landing hero decorations (6) |
| `.animate-pulse-soft` | opacity 1 → .7 → 1 | 2s ease-in-out loop | landing |
| `.animate-gradient` | background-position sweep, `background-size: 200% 200%` | 8s ease loop | landing gradient text/panels (2) |
| `.animate-shimmer` | translateX(−100% → 100%) | 2s loop | defined, unused |
| `.animate-cursor` | opacity blink | 1s step-end loop | landing typewriter caret |
| `.text-gradient-typing` | `gradientFlow` background-position, `background-size: 300% 100%`, drop-shadow 0 0 20px `yu-cyan` at 40% | 4s ease loop | landing hero headline |
| Tailwind `animate-pulse` | opacity 1 → .5 → 1 | 2s cubic-bezier(0.4,0,0.6,1) loop | skeletons (35), first-time status-pill hint |
| Tailwind `animate-spin` | rotate 360° | 1s linear loop | Button spinner, `loader-2` icons (16) |

Stagger with `.anim-delay-100` … `.anim-delay-700` (100 ms steps, plus an ad-hoc `anim-delay-50`): these set `animation-delay` and work only with the `animate-*` classes above.

## Scroll reveal

`.animate-on-scroll` starts at opacity 0, translateY(24px) and transitions opacity and transform over 700 ms `ease-standard`; JavaScript adds `.visible` when the block enters the viewport. Stagger siblings with `.scroll-delay-0 / -100 / -150 / -200 / -300 / -400 / -450 / -500` — these set `transition-delay`, not `animation-delay`, so never mix them with `anim-delay-*`. Used on 14 landing blocks.

## Hover and press

- Card: `shadow-sm` → `shadow-md` over 300 ms. `.card-hover` (landing feature cards) also lifts `translateY(−4px)` and takes `shadow-card-hover`.
- Button: `active:scale-[0.98]`, 200 ms `transition-all`; the primary gradient darkens to `yu-navy-hover` → `yu-navy` and the shadow grows `shadow-sm` → `shadow-md`.
- Links and icon buttons: color only, 150 ms.
- Compact status pill: `hover:ring-2 hover:ring-offset-1 hover:ring-gray-300`.

## Drag and drop (dnd-kit)

The dragged course translates with `CSS.Translate` and no transition; the source fades to `opacity-50`; the target column gets `ring-2 yu-cyan-a50` and a `yu-cyan-a5` wash instantly (Card transitions only its shadow). While the planner auto-scrolls during a drag the frame gets `.drag-scroll-active` (opacity .3, pointer-events none, 200 ms). `scroll-behavior: smooth` is deliberately NOT set on `html` because it fights the drag library's scroll tracking; use the `smoothScrollTo()` utility.

## Reduced motion

`@media (prefers-reduced-motion: reduce)` disables every `animate-*` utility and `.animate-on-scroll` (opacity 1, transform none, no animation or transition). Tailwind's `animate-pulse` / `animate-spin` and the 150–300 ms transitions are not covered; keep them short.

## Known dead classes

`ZoomableImage` applies `animate-in fade-in duration-200` to its lightbox; those names come from the `tailwindcss-animate` plugin, which is not installed, so the lightbox appears without animation. Do not copy them.
