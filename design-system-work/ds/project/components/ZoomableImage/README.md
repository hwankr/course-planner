A clickable screenshot thumbnail that shows a 탭하여 확대 / 클릭하여 확대 hint pill over the image and opens it at natural pixel size in a full-screen black lightbox with a round close button and a drag hint.

## Use it for / don't use it for

- Use it for UI screenshots the reader may need to inspect closely: the help page (`/help`) wraps each of its six `/help/*.png` captures (onboarding, planner grid, course catalog, requirements widget, two statistics views) in it.
- Use it inside a block that clips and frames the image; every call site uses `overflow-hidden rounded-xl border border-slate-200`.
- Don't use it for logos, icons or decorative imagery, and don't use it for images smaller than the viewport: the lightbox shows the image at natural size and expects the reader to pan.

## What the consumer provides

- `src: string` — image URL for both the thumbnail and the lightbox.
- `alt: string` — alt text, used on both images.
- `width: number`, `height: number` — intrinsic size for `next/image`. The help page passes 1080–1500 × 200–800; `planner-semesters.png` is declared 1500×600 but is 1528×648 on disk.
- `className?: string` — default `''`; applied to the thumbnail `<img>` only. Every call site passes `w-full h-auto`.
- No children. The lightbox renders as a following sibling with `position: fixed`, so no ancestor may set `transform`, `filter` or `contain`, or the lightbox will be clipped to it.

## Anatomy and states

- Thumbnail root: `position: relative`, `cursor: pointer`; the whole block is the click target and the hover `group`. Text inside inherits the app body (16px, line-height 1.5, `font-body`).
- Thumbnail image: `next/image` with the consumer's `className`; preflight makes it `display: block`, `max-width: 100%`, `height: auto`.
- Hint overlays (two, stacked over the image): `inset: 0`, flex-centered, fill `transparent` (bg-black/0) → `black-a10` on hover, `transition-all` `duration-fast` `ease-standard`. The mobile overlay shows below 768px (`md:hidden`), the desktop overlay from 768px (`hidden md:flex`).
- Mobile pill: always visible at rest. `radius-full`, fill `black-a40`, padding `space-1-5` × `space-3`, gap `space-1-5`, 400 11px text (text-[11px]; line-height inherits 1.5 → 16.5px) in `white-a80`, ZoomIn `icon-xs`. Contrast depends on the screenshot beneath: over a white region it reads 2.4:1 (2.8:1 with the hover wash) — kept, flagged.
- Desktop pill: `opacity: 0` → `1` on hover (`transition-opacity` `duration-fast`). `radius-full`, fill `yu-navy-a90`, padding `space-2` × `space-4`, gap `space-2`, `body-sm-medium` in `white`, `shadow-lg`, ZoomIn `icon-md`. 8.8:1 over the wash on a white region.
- Lightbox root (while `isOpen`): `position: fixed; inset: 0`, `z-modal`, flex-centered, fill `black-a95`, padding `space-4`; a click on the backdrop closes. Its `animate-in fade-in duration-200` classes are dead: `animate-in` and `fade-in` come from tailwindcss-animate, which is not installed, and `duration-200` alone sets `transition-duration: duration-base` with no transition property, so the lightbox appears with no fade.
- Close button: `space-4` from the top and right, `z-sticky`, `control-md` square, `radius-full`, fill `white-a10` → `white-a20` on hover → `white-a30` on active, `transition-colors` `duration-fast`; X icon `icon-xl` in `white` (15.3:1 at rest, 7.4:1 on active). No pointer cursor (Tailwind v4 preflight; the source sets none).
- Pan container: `max-width: 100%; max-height: 100%; overflow: auto`, `touch-action: pan-x pan-y`, inline `-webkit-overflow-scrolling: touch`; clicks inside stop propagation so the lightbox stays open.
- Full image: `width: auto; height: auto; max-width: none` — natural pixel size, `quality={100}`, `priority`; larger than the viewport it scrolls inside the pan container.
- Drag hint: `bottom: space-4`, centered with `translateX(-50%)`, `radius-full`, fill `white-a10`, padding `space-2` × `space-4`, `caption` in `white-a80`, `backdrop-filter: blur(8px)` (backdrop-blur-sm under v4). 10.3:1 over the backdrop.
- While open the component sets `document.body.style.overflow = 'hidden'` and clears it on close or unmount.

## Copy

- `탭하여 확대` — mobile hint pill.
- `클릭하여 확대` — desktop hover pill.
- `닫기` — `aria-label` of the close button.
- `이미지를 드래그하여 이동하세요` — bottom hint in the lightbox.
- Alt texts the help page passes, e.g. `학기 그리드 - 학년별 학기 카드와 과목 배치`, `과목 카탈로그 - 학년/학기/카테고리 필터와 추가 버튼`, `졸업요건 위젯 - 전공/교양 카테고리별 진행률 바`.

## Accessibility

- The thumbnail is a `<div onClick>` with no `role`, `tabIndex` or key handler: it is not focusable, not announced as a control and cannot be opened from the keyboard. Both hint pills stay in the DOM at every width; the inactive one is `display: none`.
- The lightbox has no `role="dialog"`, `aria-modal`, focus trap, Escape handler, initial focus or focus return. The close button is a native `<button>` with `aria-label="닫기"` and is the only focusable element; its SVG is `aria-hidden="true"` (lucide-react adds it to icons without children or a11y props), so the button's accessible name comes from `aria-label="닫기"` alone.
- The pan container has no `tabindex`, so panning is pointer and touch only.
- `alt` is identical on the thumbnail and the full image; the hints are visible text, not labels.
- No `prefers-reduced-motion` handling; the only motion is the 150ms hover transitions.

## Not reproduced

- Opening and closing (`useState`), the backdrop click-to-close and the pan container's `stopPropagation`, and the body scroll lock.
- `next/image` optimization (srcset, lazy loading, `quality={100}`, `priority`); the preview uses a plain `<img>` of `planner-semesters.png`.
- The `fixed` viewport pinning: the preview uses the `--staged` mirror inside a 260px stage.
- The `md` media-query switch between the two overlays: the preview forces each with the `--mobile` / `--desktop` mirrors (the real breakpoints also work in the fragment).
- Touch panning and momentum scrolling; the pan container's scrollbars stand in.
- Hover is shown at rest through `.is-hover`; the real `:hover` and `:active` states also work in the preview.

Static rendition hand-translated from `src/components/ui/ZoomableImage.tsx`.
