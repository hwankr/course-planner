# AuthLayout — verification findings not yet applied

From an adversarial line-by-line check against the source. Re-check each against the source before applying; if the source disagrees, skip it.

1. **[value] _work/fragments/AuthLayout.css** — .cp-auth-layout__brand (lines 38-44) — the `.animate-gradient` class on the brand panel
   - source: globals.css `.animate-gradient { animation: gradientShift 8s ease infinite; background-size: 200% 200%; }` with the 0% keyframe `background-position: 0% 50%` — the panel never shows the whole ramp; at rest (0% keyframe, and under prefers-reduced-motion where only `animation` is cancelled) it shows the LEFT half of a 200%-wide image, i.e. yu-navy-hover #003e7e → yu-navy #153974 only, with yu-blue off-panel
   - found: background-image only; no `background-size`, no `background-position` — the panel shows all three stops #003e7e → #153974 → #3069b3 across its width, a frame the app never renders. `background-size` is a static property, not motion, yet it was dropped under 'Not reproduced' while the discs were correctly rested at THEIR 0% keyframe
   - fix: Add `background-size: 200% 200%; background-position: 0% 50%;` to `.cp-auth-layout__brand` so the panel rests at the 0% keyframe like the discs; then change the README 'Not reproduced' bullet and the fragment comment (lines 36-37) to say only the 8s panning is omitted (the panel rests on yu-navy-hover → yu-navy). Re-check the blue-100 contrast sentence in README line 26 afterwards (yu-blue is no longer on screen at rest, so the 4.5:1 worst case becomes 8.7:1 / 9.2:1).

2. **[token] _work/fragments/AuthLayout.css** — .cp-auth-layout__mesh background-image, lines 59-63 (5 occurrences)
   - source: tokens.json color token `transparent` = `#00000000` (Input.css already writes `var(--transparent, #00000000)`)
   - found: `var(--transparent, transparent)` — the fallback literal is the keyword, not the token's value
   - fix: Replace all five `var(--transparent, transparent)` with `var(--transparent, #00000000)` so the fallback equals the token value as the brief requires ('exact literal as fallback').

3. **[docs] ds/project/components/AuthLayout/README.md** — Accessibility section, line 56: 'the check icons and the Google G have no `aria-hidden` and no title'
   - source: lucide-react 0.563.0 `dist/esm/Icon.js` line 33: `...!children && !hasA11yProp(rest) && { "aria-hidden": "true" }` — `<CheckCircle2 className="w-6 h-6 mt-1 flex-shrink-0" />` has no children and no aria-*/title/role prop, so the app renders each check icon WITH `aria-hidden="true"`. Only the hand-written Google `<svg>` lacks it.
   - found: README states both the check icons and the Google G have no `aria-hidden`; the preview's three `.cp-auth-layout__feature-icon` svgs (preview.html lines 36, 43, 50) are also emitted without `aria-hidden="true"`, unlike the app's output
   - fix: Rewrite line 56 to: 'Both logos carry `alt="영남대학교"`; the three Lucide check icons render `aria-hidden="true"` (lucide-react default when no a11y prop is passed); the inline Google G has no `aria-hidden` and no title.' Optionally add `aria-hidden="true"` to the three feature-icon `<svg>` tags in preview.html to match the rendered DOM.

4. **[copy] ds/project/components/AuthLayout/README.md** — Line 1 — the first sentence, which the brief says 'becomes the card subtitle' and must be a 'one-line summary'
   - source: Brief: 'First sentence = one-line summary (becomes the card subtitle)'; for patterns 'the README's first sentence says what the pattern is'
   - found: A single 418-character sentence (~70 words) enumerating every part of both panels ('…beside a `white` form panel with the wordmark row, a title and subtitle, labelled `Input` fields, a full-width primary `Button`, and (login only) an 또는 divider, a Google outline button, a guest text button and a footer link.')
   - fix: Cut the first sentence to one line, e.g. 'The split-screen frame behind 로그인 and 회원가입: a brand panel on the `yu-navy-hover` → `yu-navy` → `yu-blue` ramp beside a `white` form panel.' and move the part inventory into the Anatomy section (where it is already repeated).

5. **[docs] ds/project/components/AuthLayout/README.md** — What the consumer provides, line 14: 'Primitives: `Input` with `id`, `type`, `value`, `onChange`, `placeholder`, `required` (no `className`, no `error`)'
   - source: register/page.tsx passes `name="name"`, `name="email"`, `name="password"`, `name="confirmPassword"` on every `<Input>` (lines 133, 148, 163, 184) — `handleChange` keys `formData` by `e.target.name`, so `name` is load-bearing there; login passes no `name`
   - found: `name` is omitted from the Input prop list, although the preview itself emits `name="name"`, `name="password"`, `name="confirmPassword"` on the register inputs
   - fix: Change to: '`Input` with `id`, `type`, `value`, `onChange`, `placeholder`, `required`, plus `name` on the register page (its `handleChange` keys `formData` by `e.target.name`); no `className`, no `error`.'

6. **[contract] _work/fragments/AuthLayout.css** — .cp-auth-layout--staged (lines 27-30), a preview-only modifier
   - source: Brief: 'Put ONLY layout for the preview itself in the inline `<style>` … component styling lives in the fragment'; the modifier corresponds to no state of the app (the comment itself says 'preview only')
   - found: `.cp-auth-layout--staged { min-height: 0; }` ships in the component fragment (and therefore in `components/bundle.css`) and is referenced from preview.html line 23
   - fix: Delete `.cp-auth-layout--staged` from the fragment and put `.stage > .cp-auth-layout { min-height: 0; }` in preview.html's inline `<style>`; drop the `cp-auth-layout--staged` class from the preview root `<div>`.

7. **[contract] ds/project/components/AuthLayout/preview.html** — Inline `<style>`, line 10: `body { margin: 16px 0; … }` (self-flagged by the builder)
   - source: Brief preview contract: inline style holds 'body margin 16px, a flex row with gap, …'; the natural-height figure is for 'your layout at 960px wide'
   - found: `margin: 16px 0` — the stage runs edge to edge so the md split is a full 960px; the strip below re-adds 16px gutters by hand (`.cap`, `.strip` margins)
   - fix: Either keep and accept (defensible: the page is full-bleed in the app and 928px would still be md) or revert to `body { margin: 16px }`, drop the hand-added `16px` left/right margins on `.cap` and `.strip`, and re-check the height (unchanged at 1016 since the form panel still drives the stage).

8. **[missing-state] ds/project/components/AuthLayout/preview.html** — Strip cell 3 (lines 138-150), the Android in-app notice
   - source: login/page.tsx line 183: `hover:bg-amber-200` on the 외부 브라우저에서 열기 button; the fragment defines the mirror `.cp-auth-layout__inapp-button.is-hover { background-color: var(--amber-200, #fee685) }` (lines 361-364) and README line 36 says 'Mirror `.is-hover`'
   - found: The Android button is shown only at rest (amber-100); no element in the preview carries `cp-auth-layout__inapp-button is-hover`, so the amber-200 hover fill (the one fill-changing hover unique to this pattern) is defined but never exercised
   - fix: Either add a second `<button type="button" class="cp-auth-layout__inapp-button is-hover">외부 브라우저에서 열기</button>` under the Android notice (with a caption 'rest · hover') and bump `height` by ~40px, or drop the claim of coverage from the caption. Low priority.
