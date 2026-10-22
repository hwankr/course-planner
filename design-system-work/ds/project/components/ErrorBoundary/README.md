React error boundary that swaps a throwing dashboard subtree for a centered gray-50 card with 문제가 발생했습니다, a dev-only 오류 상세 정보 disclosure and a 다시 시도 button that reloads the page; the error is reported to Sentry first.

## Use it for / don't use it for

- Use it once around a whole page region. The app mounts it in `src/app/(dashboard)/layout.tsx` around `<OnboardingGuard>{children}</OnboardingGuard>` inside `<main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">`, so any dashboard page that throws while rendering shows this card in place of its content.
- Pass `fallback` when a region needs its own recovery UI; the built-in card is sized for a full page (400px minimum) and its only action reloads the window.
- Don't use it for expected failures: a failed fetch, a rejected mutation or a validation error. The app shows those with inline banners and Toast. A boundary catches only errors thrown while rendering its subtree (render, lifecycle methods, constructors) — not event handlers, promises, timers or server components.

## What the consumer provides

- `children: React.ReactNode` — the subtree to guard; returned unchanged while `hasError` is false.
- `fallback?: React.ReactNode` — optional replacement for the built-in card; when set it is returned as-is and nothing below renders. No call site in the app passes it.
- No `onReset`, `onError` or `resetKeys`: recovery is `window.location.reload()` and reporting is `Sentry.captureException(error, { extra: { componentStack } })`, both fixed.
- Container: a block that fills its parent's width. In the app that is the `container` inside `<main>` on the gray-50 app frame, so the card's `gray-50` fill matches the page and only the `gray-200` hairline marks its edge.

## Anatomy and states

- Card: flex column, centered both ways, `gap: space-4`, `min-height: 400px` (an arbitrary `min-h-[400px]`; no size token), padding `space-8`, `radius-lg`, 1px `gray-200` border on a `gray-50` fill, `text-align: center`. The `gray-200` hairline is 1.2:1 on `gray-50` in the source — kept, flagged.
- Icon well: `radius-full` disc, fill `red-100`, padding `space-3` (56px across).
- Glyph: the inline heroicons-v1 exclamation-triangle (stroke `currentColor`, width 2, round caps and joins, no fill), `icon-2xl` (32px), `red-600`. 3.9:1 on `red-100` — passes 3:1 for a meaning-carrying icon.
- Text block: `space-y-2` — `space-2` between heading and body; the details block's own `margin-top: space-4` wins over it (block margins collapse), so body→details is 16px.
- Heading `<h2>`: `heading-3` (600 20px/28px `font-body`) in `gray-900` (17.0:1 on `gray-50`).
- Body `<p>`: `body-sm` (400 14px/20px) in `gray-600` (7.2:1 on `gray-50`).
- Details (development builds only): `margin-top: space-4`, `text-align: left`. Summary `body-sm` in `gray-500` (4.6:1 on `gray-50`) → `gray-700` on hover (9.9:1), `cursor: pointer`, native disclosure marker. Stack `<pre>`: `margin-top: space-2`, padding `space-2`, `radius-sm`, fill `gray-100`, 400 12px/16px in `font-mono` (the `caption` size on the `mono-sm` face; no single type token matches), `gray-700` (9.4:1 on `gray-100`), `overflow: auto`, `white-space: pre`. Content is `error.message`, a blank line, then `error.stack`.
- Retry button: a hand-rolled `<button>`, not the Button primitive. Fill `yu-navy`, label `body-sm-medium` (500 14px/20px) in `white` (11.2:1), padding `space-2` × `space-4`, `radius-md`, 36px tall (no explicit height), `transition-colors` (`duration-fast`, `ease-standard`). Hover fill `yu-navy-hover` (10.6:1). No pointer cursor (Tailwind v4 preflight).
- Retry focus: `outline: none` and `box-shadow: 0 0 0 2px white, 0 0 0 4px yu-cyan` on any focus (`focus:`, not `focus-visible:`), so it also appears after a mouse click. The `yu-cyan` ring is 2.8:1 against its white offset and 2.6:1 against the `gray-50` card — misses 3:1 in the source, kept, flagged.
- No disabled, loading or active state exists on any part.

## Copy

- `문제가 발생했습니다` — the heading.
- `일시적인 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.` — the body.
- `오류 상세 정보` — the details summary (development builds only).
- `다시 시도` — the retry button label.
- The `<pre>` shows the raw `error.message` and `error.stack` — runtime text, not app copy.

## Accessibility

- The heading is a real `<h2>`, the disclosure a native `<details>/<summary>` (toggled with Enter or Space), and the retry a native `<button>` reachable by Tab.
- Nothing announces the swap: the card has no `role="alert"`, `aria-live` or `aria-labelledby`, and focus is not moved into it, so a screen reader learns of the error only by re-reading the page.
- The SVG has no `aria-hidden`, `role` or title; it is exposed as an unnamed graphic next to the heading.
- The retry ring is applied on `:focus`, not `:focus-visible`, and its `yu-cyan` color misses 3:1 (see Anatomy).
- 다시 시도 reloads the whole page, discarding any unsaved state in the subtree.

## Not reproduced

- Catching: `getDerivedStateFromError` setting `hasError` and `error`, and `componentDidCatch` sending the error and `componentStack` to Sentry.
- `window.location.reload()` on 다시 시도.
- The `process.env.NODE_ENV !== 'production'` gate: the preview shows the details as a development build does, with `open` set and a sample message and stack.
- The `fallback` prop swap and the normal state (children rendered through, none of this card visible).

Static rendition hand-translated from `src/components/ErrorBoundary.tsx`.
