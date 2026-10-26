Single-line text field: a 40px white box with a `gray-300` hairline, 6px radius and 14px text that trades its border for a 2px `yu-cyan` ring on focus, with an optional `red-500` message line; the `--soft` variant is the hand-written admin and form recipe (`slate-200` hairline, 8px radius, faint `yu-cyan-a20` ring).

## Use it for / don't use it for

Use the component for the login and register forms (이메일, 비밀번호, 이름, 비밀번호 확인), the profile 기본 정보 fields (이름, 입학년도), the onboarding 학과 및 입학 정보 card (입학연도) and its 졸업 요건 step's credit fields (졸업학점, 교양학점 … 복수전공 전공학점, 부전공 전공학점 — 18 fields, the largest single consumer), the 커스텀 과목 추가 dialog (과목명, 학점), the admin RequirementForm credit grid (졸업학점, 교양학점, 전공학점, 전공핵심 (최소) …) and the CourseCatalog search box (과목명 또는 코드 검색...). Pair it with a consumer `<label>` in `body-sm-medium` `gray-700` with `space-1` below it (`mb-1`), `caption-medium` `gray-600` with `space-1` below (`mb-1`) in the dense RequirementForm grid, or `caption` (400) `gray-600` with `space-1` below (`mb-1`) as the onboarding credit fields use; the CourseCatalog search box is the one unlabeled use, relying on its placeholder.

Use `.cp-input--soft` where the app writes the inline recipe on bare controls: the admin 과목 / 학과 / 졸업 요건 / 사용자 / 피드백 / 업데이트 소식 pages, the admin dashboard filter and the help 피드백 form. It is the dominant field style on `<select>` (16 of 24; the 8 others — profile ×3, RequirementForm ×2, CustomCourseForm, onboarding, calendar — sit on `gray-300`) and `<textarea>` (4 of 5). The profile `<select>`s instead copy the component's resting classes inline, without its focus ring.

Don't use either for Buttons, SearchableSelect (its own component), or the `blue-500`-ring plain controls (`focus-ring-form`). Passing `className="flex-1"` has no effect — it reaches the `<input>`, not the `w-full` wrapper, which is the flex item and shrinks by default.

## What the consumer provides

- `error?: string` (default `undefined`). A non-empty string turns the field border and focus ring `red-500` and renders the text in a `<p>` under the field. The app never passes it; forms pass `className="border-red-500"` and print their own `caption` `red-500` message with `mt-1`.
- `type?: HTMLInputTypeAttribute` (React.InputHTMLAttributes; default `undefined` → text). The app passes `email`, `password`, `number`, `text`.
- `className?: string` merged last through `cn()` onto the `<input>`: `border-red-500`, `flex-1`.
- Every other `React.InputHTMLAttributes<HTMLInputElement>` passes through: `id`, `name`, `value`, `onChange`, `placeholder`, `required`, `min`, `max`, `disabled`.
- Ref: `forwardRef<HTMLInputElement>`; the ref reaches the `<input>`. No children; no label, icon, prefix or suffix slot.
- Container: a block the field can fill. The root is `<div class="w-full">`; the app stacks fields with `space-y-4` (16px) or lays them in `grid grid-cols-2 gap-x-3 gap-y-2`.
- For `.cp-input--soft` the app has no wrapper and no error line; the `.cp-input` block here is a neutral `width: 100%` stand-in for the parent `<div>`. Variants of the recipe in the app: 22 of 43 add `bg-white`; 2 rest on `bg-slate-50` and turn `white` on focus; 12 omit the text color (inherits); 13 omit `w-full` (12 filter selects and the 과목 관리 search input); one textarea uses `rounded-xl px-4 py-3 transition-colors` on `bg-slate-50`; others add `text-slate-900 placeholder:text-slate-400`, `uppercase` (과목 코드), `resize-none` on textareas, `pl-9`/`pl-10` for a leading lucide icon (the icon fields add `pr-9`/`pr-8`, once `pr-3`), and once `disabled:bg-slate-50 disabled:text-slate-400`.

## Anatomy and states

- Wrapper `.cp-input`: block, width 100%, nothing else.
- Field `.cp-input__field`: height `control-md` (40px); padding `space-2` `space-3` (8px 12px); 1px border `gray-300` (`line-input`); radius `radius-md` (6px); fill `white`; text `body-sm` in the inherited color (`foreground` #171717 on the page, `gray-900` inside a Card, 17.9:1 / 17.7:1 on `white`); placeholder `gray-400` (`ink-placeholder`), 2.6:1 on `white` — the source pair, flagged. The `gray-300` hairline is 1.5:1 on `white` — below 3:1, kept, flagged. Every property transitions over `duration-base` (200ms) with `ease-standard`.
- Hover: border `gray-300` → `gray-400` (2.6:1, flagged). Because `hover:` is a variant it also recolors an error field's `red-500` border to `gray-400` while hovered, and still fires on a disabled field. Mirror `.is-hover`.
- Focus (any focus, not only keyboard): `outline: none`; border `transparent` (the 1px stays in the layout); ring `box-shadow: 0 0 0 2px` `yu-cyan` (`focus-ring`). `yu-cyan` on `white` is 2.8:1 — misses 3:1, kept from source, flagged. Focus wins over hover. Mirror `.is-focus`.
- Error (`.cp-input--error`, from the `error` prop): border `red-500`; focused ring `red-500` instead of `yu-cyan`. Message `.cp-input__error`: `body-sm` in `red-500`, `space-1` (4px) above. `red-500` on `white` is 3.8:1 for both text and border — the source pair, flagged.
- Disabled: `cursor: not-allowed`; `opacity-disabled` (0.5) on the whole field, so text drops to about 3.4:1, the border to 1.2:1 and the placeholder to 1.6:1 on `white` — kept, flagged.
- Soft variant `.cp-input--soft .cp-input__field`: inline-block, height auto (38px: 20 line + 16 padding + 2 border); padding `space-2` `space-3`; 1px border `slate-200` (`line`, 1.2:1 on `white` — flagged); radius `radius-lg` (8px); fill `transparent` (Tailwind v4 preflight; the page shows through); text `body-sm` in `slate-700` (10.4:1); placeholder is preflight `currentColor` at 50% (about 2.7:1, flagged); no hover, no transition, no disabled styling.
- Soft focus: `outline: none`; border `yu-cyan` (2.8:1, flagged); ring `0 0 0 2px` `yu-cyan-a20` (1.2:1 against `white` — decorative, kept). Mirror `.is-focus`.

## Copy

The component renders only the `error` string it is given; it has no labels or icons. Placeholders the app passes: email@example.com · •••••••• · 홍길동 · 8자 이상 (대문자, 소문자, 숫자 포함) · 비밀번호 재입력 · 이름 · 2024 · 예: 데이터베이스 · 과목명 또는 코드 검색... · 예: 130 · 예: 30 · 예: 60 · 예: 24 · 예: 2024 · 예: 21 · 예: 9 · 예: 63 · 0. Soft-recipe placeholders: 예: CSE · 예: 컴퓨터공학과 · 예: 공과대학 · 예: CSE1001 · 예: 프로그래밍 기초 · 과목명 또는 코드 검색 · 과목에 대한 설명을 입력하세요 · 학과명 또는 코드로 검색... · 답변을 입력하세요... · 업데이트 제목을 입력하세요 · v1.0.0 · 변경사항을 입력하세요... · 학과명 검색... · 공과대학 · 건축학부 건축학전공 · 이름 또는 이메일 검색... · 문의 내용을 입력하세요. Validation strings the forms print under a field: 1 이상의 학점을 입력하세요 · 0 이상의 학점을 입력하세요 · 전공핵심은 전공학점 이하여야 합니다 · 복수전공핵심은 복수전공학점 이하여야 합니다 · 부전공핵심은 부전공학점 이하여야 합니다. The preview uses 이메일, 이름, 비밀번호, 졸업학점, 입학년도, 학과 코드, 학과명 and the message 1 이상의 학점을 입력하세요.

## Accessibility

- Renders a native `<input>`; `id`, `name`, `required`, `aria-*` and `type` pass through, so a consumer `<label htmlFor>` associates correctly. The component generates no `id`, `aria-invalid`, `aria-describedby` or `aria-required`.
- The error `<p>` is not linked to the field (no `aria-describedby`, no `role="alert"`); screen readers meet it only in reading order.
- Focus uses `focus:` not `focus-visible:`, so the ring also appears on mouse focus. The ring is the only focus cue (the outline is removed); at 2.8:1 it does not meet 3:1 on `white`.
- Disabled fields keep the native `disabled` semantics; the 50% fade is visual only. The hover variant is wrapped in Tailwind v4's `@media (hover: hover)` in the compiled CSS (touch devices never see it); there is no reduced-motion guard on the 200ms transition.

## Not reproduced

- `className` merging through `cn()`/tailwind-merge; the preview shows the base classes (no `border-red-500` via className, no `flex-1`).
- Ref forwarding, controlled `value`/`onChange`, native validation for `required`, `min` and `max`, and the number-field spin buttons' browser styling.
- The soft recipe's `<select>` chevron and `<textarea>` resize box, its `pl-9`/`pl-10` icon variants and the one `disabled:bg-slate-50 disabled:text-slate-400` field.
- The real `@media (hover: hover)` wrapper Tailwind v4 puts around `hover:`; the fragment uses a plain `:hover`.

Static rendition hand-translated from `src/components/ui/Input.tsx` (soft recipe from `src/app/(dashboard)/admin/page.tsx`, `src/app/(dashboard)/admin/*/page.tsx`, `src/app/(dashboard)/help/feedback/page.tsx`).
