Searchable single-select: a 40px white text field (`gray-300` hairline, `radius-md`, `body-sm`) that filters a list as you type and drops a `shadow-lg` white list 4px under it, where the chosen row sits on `yu-navy-a10` in `yu-navy` medium text, groups are headed by 12px semibold `gray-500` captions on `gray-50`, and a `gray-400` X clears the value.

## Use it for / don't use it for

Use it for long lists a student searches by name: the onboarding 학과 step (options grouped by `dept.college`, disabled with placeholder 불러오는 중... while departments load), the onboarding and profile 복수전공 학과 / 부전공 학과 pickers (options filtered to exclude the primary department), and the profile 학과 field (ungrouped). Always pair it with a consumer `<label>` in `body-sm-medium` `gray-700` with `space-1` below (`mb-1`), stacked in a Card body with `space-y-4`.

Don't use it for short fixed lists (the app uses a native `<select>` for 커리큘럼 연도, 기준 연도 and the admin filters, and one section of the profile page renders 학과 as a native `<select>` too), for multi-select, or for free text (Input). Don't drop the root in as a bare flex item without `flex-1` or a width: it has no width class and shrinks to the input's intrinsic width.

## What the consumer provides

- `options: SearchableSelectOption[]` — `{ value: string; label: string; group?: string }`. Grouped options render after all ungrouped ones, groups in first-seen order. `group: ''` counts as ungrouped.
- `value: string` — the selected option's `value`, `''` for none. Controlled only.
- `onChange: (value: string) => void` — receives the clicked option's `value`, or `''` from the clear X.
- `placeholder?: string` (default `'선택하세요'`). The app passes `'학과를 검색하세요'` and `'불러오는 중...'`.
- `disabled?: boolean` (default `false`). The onboarding page passes `isDeptLoading`.
- `className?: string` (default `''`), appended to the root `<div class="relative">`, not the input. Unused by the app.
- No children, no ref, no `id`/`name`/`aria-*` passthrough. Container: any block; the root is `position: relative` and the list is absolutely positioned under it, so leave room below or accept overlap.

## Anatomy and states

- Root `.cp-searchable-select`: `position: relative`, nothing else. Control `.cp-searchable-select__control`: a second relative wrapper for the input and the X.
- Input `.cp-searchable-select__input`: height `control-md` (40px); padding `space-2` top and bottom, `space-3` left, `space-8` right (`pr-8`, room for the X); 1px border `gray-300` (`line-input`, 1.5:1 on `white` — below 3:1, kept, flagged); radius `radius-md`; fill `white`; `body-sm` in the inherited color (`gray-900` inside a Card, 17.8:1). No hover state and no transition in the source. Placeholder is the v4 preflight default, `currentColor` at 50% in oklab (about #888c94, 3.4:1 on `white` — kept, flagged).
- Focus (any focus, not only keyboard): `outline: none`; border `transparent`; ring `box-shadow: 0 0 0 2px` `yu-cyan` (`focus-ring`), 2.8:1 on `white` — misses 3:1, kept, flagged. Mirror `.is-focus`. A click opens the list and leaves the input focused until the pointer presses an option or the scrollbar; Tab focus alone does not open it.
- Clear X `.cp-searchable-select__clear` + `__clear-icon`: rendered only when `value` is set and not disabled; absolute, `space-2` from the right edge, vertically centred; a 16px (`icon-md`) inline heroicon X, 2px round strokes, in `gray-400` (2.6:1 on `white` — a meaning-carrying icon under 3:1, kept, flagged) → `gray-600` on hover (7.6:1). Default cursor, no padding, no focus style of its own. Mirror `.is-hover`.
- Disabled: `cursor: not-allowed`; `opacity-disabled` (0.5) on the input, so text drops to about 3.4:1, the placeholder to 1.7:1 and the border to 1.2:1 on `white` — kept, flagged. The X and the list are not rendered.
- Open: the input shows the search term, so with an empty term the placeholder shows even while a value is selected, and the X stays. Menu `.cp-searchable-select__menu`: absolute at its static position, `space-1` (4px) below the control; `z-modal` (50); width 100%; `max-height: 240px` (`max-h-60`; no size token, literal) with `overflow-y: auto`; 1px border `gray-300` (flagged as above); radius `radius-md`; fill `white`; `shadow-lg`.
- Option `.cp-searchable-select__option`: full-width left-aligned button, padding `space-2` `space-3` (36px rows), `body-sm` in the inherited color, transparent fill, default cursor. Hover: fill `gray-100` (text 16.1:1). Mirror `.is-hover`.
- Selected `.cp-searchable-select__option.is-selected`: fill `yu-navy-a10` (#e8ebf1 over white), text `yu-navy` at weight 500 (`body-sm-medium`), 9.4:1. Hover wins over the selected fill: `gray-100` under `yu-navy` text (10.2:1).
- Group header `.cp-searchable-select__group-label`: padding `space-1` `space-3`; fill `gray-50`; 12px/16px at weight 600 (`caption` size, `text-xs font-semibold`, no tracking) in `gray-500`, `uppercase` (no effect on Hangul); 4.6:1 on `gray-50`.
- Empty row `.cp-searchable-select__empty`: padding `space-2` `space-3`; `body-sm` `gray-500` centred, 4.8:1 on `white`.

## Copy

- Default placeholder: 선택하세요. App placeholders: 학과를 검색하세요 · 불러오는 중...
- Empty state: 검색 결과가 없습니다.
- Group headers are the consumer's `group` strings (the app: college names such as 공과대학); rows are the consumer's `label` strings (department names such as 컴퓨터공학과, 소프트웨어융합전공).
- The clear X has no text and no `aria-label`. Consumer labels next to it in the app: 학과 · 복수전공 학과 · 부전공 학과.

## Accessibility

- A plain `<input type="text">` with no `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete` or `aria-activedescendant`; the list is a `<div>` of `<button type="button">`s with no `role="listbox"`/`"option"` and no `aria-selected`. The selected row is marked by color and weight only.
- The input receives no `id`, so the app's adjacent `<label>`s are not associated with it.
- Keyboard: typing filters and opens; Escape (document listener while open) closes, clears the term and blurs; Tab walks the option buttons in DOM order, Enter/Space picks one. No arrow-key navigation, no Enter-to-select from the input, no typeahead focus management. Option buttons keep the browser's default focus outline.
- A `mousedown` outside the root closes the list and resets the term. The clear X stops propagation and refocuses the input.
- The focus ring is the only focus cue on the input and sits at 2.8:1; `focus:` fires on mouse focus too. Nothing animates, so reduced-motion is irrelevant; the two `hover:` utilities sit under v4's `@media (hover: hover)` and never fire on touch (the fragment uses plain `:hover`).
- Disabled uses native `disabled`; the X and the list leave the DOM.

## Not reproduced

- The open/close, search-term and filtering logic, the swap of the input text between the selected label and the search term, and the controlled `value`/`onChange` round trip.
- Document-level listeners (click outside, Escape), blur/refocus on select and clear, and the runtime grouping and ordering of options.
- `className` on the root; the `@media (hover: hover)` wrapper Tailwind v4 puts around `hover:` (the fragment uses plain `:hover`).
- Live scrolling inside the 240px list (the preview shows the overflow at rest with the browser scrollbar).

Static rendition hand-translated from `src/components/ui/SearchableSelect.tsx`.
