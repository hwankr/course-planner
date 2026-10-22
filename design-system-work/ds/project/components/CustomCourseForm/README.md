Modal for adding a user-defined course to the focused semester: a `black-a50` overlay centering a `white` `container-md` panel with a ruled header, three required fields (과목명, 학점, 이수구분), a `blue-50` or `amber-50` status banner and a 취소 / 추가 footer.

## Use it for / don't use it for

- Use it where CourseCatalog mounts it: the catalog's `emerald-500` `+ 추가` button (`caption-medium` in `white`) sets `showCustomForm`, and the modal creates a course that is not in the catalog (code auto-generated as `CUS-…`) and drops it straight into the focused semester. CourseCatalog passes `onClose`, `departmentId`, `focusedSemester` and `onClickAdd`; it never passes `availableCategories`.
- Don't use it to edit an existing course, as the 학기 추가 dialog (AddSemesterDialog has its own layout and puts the primary button on the left), or as a generic confirm. Don't open it without a focused semester and a department: the submit stays disabled and only the amber notices change.

## What the consumer provides

- `onClose: () => void` — required. Called by 취소 and again after a successful create; the parent unmounts the modal.
- `departmentId?: string` (default `undefined`) — saved as `department`. Missing: the amber 학과를 먼저 설정해주세요 line appears and 추가 stays disabled.
- `availableCategories?: RequirementCategory[]` (default `undefined` → all seven categories in `categoryLabels` order; a list restricts and reorders the options).
- `focusedSemester?: { year: number; term: string } | null` (default `undefined`) — `term === 'spring'` renders 1학기, any other term 2학기. Null: amber banner, 추가 disabled.
- `onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => void` (default `undefined`) — called after the mutation resolves, before `onClose`.
- No children. Renders its own fixed overlay; mount it at the end of the catalog, conditionally. Internal state starts at `{ name: '', credits: 3, category: '' }`, and the submit is disabled while `createCourse.isPending || !departmentId || !formData.category || !focusedSemester` — so a freshly opened modal always shows 추가 faded until a category is picked.

## Anatomy and states

- Overlay `.cp-custom-course-form`: `position: fixed; inset: 0`, fill `black-a50`, flex-centered, `z-modal`, padding `space-4`. `--staged` is a preview-only modifier that pins it to a relative stage instead of the viewport.
- Panel `__panel`: fill `white`, `radius-lg`, `shadow-xl`, width 100% up to `container-md` (448px), `max-height: 90vh` with vertical scroll. The panel sets no text color of its own; the Input, select and 취소 label inherit the body `foreground` (17.9:1 on `white`); every other text part sets its color below.
- Header `__header`: padding `space-4` × `space-6`, bottom hairline `gray-200` (`line-neutral`; 1.2:1 on `white`, decorative, kept). Title `__title` `heading-4` (600 18px/28px) in `gray-900` (17.8:1); subtitle `__subtitle` `body-sm` in `gray-500` (4.8:1) with `space-1` above.
- Body `__body` (the `<form>`): padding `space-6`; `space-4` between every pair of children.
- Label `__label`: block, `body-sm-medium` in `gray-700` (10.3:1), `space-1` below. Asterisk `__required` in `red-500` — 3.8:1 on `white` in the source, kept, flagged.
- 과목명 and 학점 are the Input component (`.cp-input__field`): `control-md`, `gray-300` hairline (1.5:1, flagged in the Input card) → `gray-400` on hover, border transparent plus a 2px `yu-cyan` ring on focus (2.8:1, flagged), `gray-400` placeholder 예: 데이터베이스. 학점 is `type="number"`, min 1, max 12, initial 3.
- Select `__select`: `control-md`, width 100%, 1px `gray-300`, `radius-md`, fill `white`, padding `space-2` × `space-3`, `body-sm`, inherited color, native chevron. The source gives it no hover, focus, transition or disabled style, so keyboard focus shows only the browser's default outline — the one control in the modal without the `yu-cyan` ring.
- Info banner `__notice --info` (focusedSemester set): `body-sm` `blue-600` on `blue-50` (4.8:1), `radius-md`, padding `space-2` × `space-3`; the semester name is `__notice-strong` (weight 500).
- Warning banner `__notice --warning` (no focusedSemester): `amber-600` on `amber-50` — 3.1:1 in the source, kept, flagged.
- Department line `__warning` (no departmentId): `body-sm` `amber-600` on `white` with no fill — 3.2:1, kept, flagged. Its link `__link` 프로필 설정 (`href="/profile"`) is underlined, weight 500, and inherits `amber-600`.
- Error `__error` (createCourse.isError): `body-sm` `red-500` (3.8:1, flagged); text is `error.message` or the fallback below.
- Footer `__footer`: flex, gap `space-3`, `space-2` above (24px under the last line with the stack gap). Both Buttons are `__action` (`flex: 1`). 취소 is Button `ghost` with `type="button"` on the LEFT (inherited label color, hover fill `gray-100`); 추가 is Button `default` with `type="submit"` on the RIGHT (gradient `yu-navy → yu-blue` under `white`, 11.2:1 / 5.5:1; hover `yu-navy-hover → yu-navy` with `shadow-md`). Disabled: `opacity-disabled` (0.5), no pointer events. While `isPending` the label reads 추가 중... and the button is disabled — the Button `isLoading` spinner is not used.
- There is no close X, no Escape handler and no backdrop-click close: 취소 is the only way out, and a successful 추가 closes the modal itself.

## Copy

- Header: `커스텀 과목 추가` · `나만의 과목을 추가하세요.`
- Labels: `과목명 *` · `학점 *` · `이수구분 *` (asterisk is a separate `red-500` span). Placeholder: `예: 데이터베이스`.
- Select: `선택하세요` (empty value) then `전공핵심` · `전공필수` · `전공선택` · `교양필수` · `교양선택` · `교직` · `자유선택`.
- Banners: `{year}학년 1학기에 바로 추가됩니다.` / `{year}학년 2학기에 바로 추가됩니다.` (year and term in the 500-weight span) · `학기를 먼저 클릭하여 포커스하면 해당 학기에 바로 추가됩니다.` · `학과를 먼저 설정해주세요. 프로필 설정`.
- Error fallback: `과목 생성에 실패했습니다.` Buttons: `취소` · `추가` · `추가 중...`.

## Accessibility

- The overlay is a plain `div`: no `role="dialog"`, `aria-modal` or `aria-labelledby`, no focus trap, no initial focus, no Escape or backdrop-click handling; the page behind stays in the tab order.
- The three `<label>`s have no `htmlFor` and the controls no `id`, so labels are not programmatically associated; `name`, `required`, `min` and `max` are native. The asterisk is visual only.
- The banners and the error line have no `role`, `aria-live` or `aria-describedby`; screen readers meet them only in reading order.
- The select relies on the browser's default focus outline; the Inputs' ring is `focus:` (mouse and keyboard) and the Button ring is `focus-visible:` with a `currentColor` (white, invisible) ring on 추가.
- Disabled 추가 leaves the tab order; nothing announces the pending or error state (`aria-busy`, `aria-invalid` are absent).

## Not reproduced

- `useCreateCourse` mutation, the `CUS-<base-36 timestamp>` code, `semesters: ['spring', 'fall']`, the `onClickAdd` / `onClose` calls and the `isPending` / `isError` toggling; controlled `formData` and `availableCategories` filtering (the preview lists all seven categories).
- `position: fixed` over the viewport — the preview uses the `--staged` modifier inside a 540px stage; `max-h-[90vh]` scrolling never engages because the panel is shorter than the stage.
- The second row shows the form body alone (no header) to fit the amber and error states; hover and focus are shown at rest through `.is-hover` / `.is-focus` mirror classes, and the preview's 프로필 설정 link points at `#` instead of `/profile`.

Static rendition hand-translated from `src/components/features/CustomCourseForm.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Button.tsx`.
