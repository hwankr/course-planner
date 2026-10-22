The profile page's stack: a brand gradient banner with an overlapping initial avatar, the name and badge row, then 기본 정보, 전공 설정, 계정 정보 and 위험 구역 Cards built from key-value rows, a major-type toggle pair and a destructive outline Button.

## Use it for / don't use it for

- Use it for account and settings pages that show a person's identity first and editable sections after it, inside a `container-2xl` column on the `gray-50` shell.
- Reuse the key-value row for any read-only "label: value" list inside a Card (계정 정보, 기본 정보 while not editing).
- Don't use the banner on list or data pages; it appears only on the signed-in profile page. Guests get the same Cards without the banner.
- Don't reuse the major-type toggles for other choices: they are a two-button multi-state switch tied to 단일전공 / 복수전공 / 부전공, with 부전공 disabled while 복수전공 is on.

## What the consumer provides

There is no component; the page reads these values and writes the markup inline.

- Identity: `name` (the avatar shows `name.charAt(0).toUpperCase()`, falling back to `U` and the name to 사용자), `departmentName?`, `enrollmentYear?`, `majorType: 'single' | 'double' | 'minor'`, `secondaryDepartment?.name`.
- Account: `email`, `image?` (present → Google 계정 with the `chrome` icon, absent → 이메일 계정 with `mail`), `role` (rendered with `text-transform: capitalize`, default `student`).
- Edit state: `isEditing` toggles 기본 정보 between the read-only rows and a form of Input fields, a SearchableSelect for 학과 and a native select for 커리큘럼 연도; `isDeleting` swaps 회원 탈퇴 for 삭제 중... and disables it.
- Container: `.cp-profile` is the `max-w-2xl mx-auto space-y-6` column; Cards come from `.cp-card`, Buttons from `.cp-button`, fields from `.cp-input` and `.cp-searchable-select`.

## Anatomy and states

- Title block: `heading-2` bold in `gray-900` (프로필) over `body` in `gray-600` (개인 정보를 관리하세요.), `space-1` apart.
- Banner: 128px (`space-32`) tall, `radius-xl`, `linear-gradient(to right in oklab, yu-navy, yu-blue, yu-cyan)`, `space-16` margin below. Avatar: 80px circle centered on the banner's bottom edge (offset `space-10`), `linear-gradient(to bottom right in oklab, yu-navy, yu-blue)`, a 4px `white` ring then `shadow-lg`; the initial is 24px bold `white`.
- Identity: name in `heading-3` size bold `gray-900`, `space-2` below the avatar; badges `space-2` apart, wrapping and centered — `caption-medium`, `space-1` × `space-3` padding, `radius-full`, a 12px Lucide icon (`building-2` or `calendar-days`). Department `yu-navy` on `yu-navy-a10`; enrollment year `yu-cyan` on `yu-cyan-a10` (about 2.4:1 — kept, flagged); 복수전공 `dept-double-major-text` on `dept-double-major-bg`; 부전공 `dept-minor-text` on `dept-minor-bg`.
- Card headings: a 20px Lucide icon in `gray-600` (`user`, `building-2`, `shield`; `trash-2` in `red-500` for the danger Card) beside the CardTitle, `space-2` apart. 기본 정보 puts a ghost `sm` Button with a 16px `pencil` (or `x` while editing) at the right of the header; that button has no label or `aria-label` in the source.
- Key-value row: flex, space-between, `space-2` vertical padding, a 1px bottom hairline from a bare `border-b` — `border-default` (`gray-900`), the dark line the product really draws; the last row of each list has none. Rows sit `space-3` apart. Label side: a 16px `gray-400` icon (where present) and the key in `gray-600`; value side in body size at weight 500. Missing values read 미설정 in `gray-400` at 400 (2.6:1 — kept, flagged). Guests see 게스트 모드 in `amber-600` (3.2:1 — kept, flagged) and 이 브라우저에만 저장 in `gray-500`.
- Major-type toggles: two equal buttons `space-2` apart, `body-sm` at 400, `space-2` × `space-3`, `radius-lg`, 1px border, `transition: all` over `duration-fast`. Off: `white` fill, `gray-700` text, `gray-300` border; hover turns border and text `purple-400` / `purple-600` (복수전공) or `orange-400` / `orange-600` (부전공). On: `purple-500` (white text 4.1:1) or `orange-500` (white text 2.9:1 — kept, flagged) fill and border, `shadow-sm`, a 16px `check` before the label. 부전공 while 복수전공 is on: disabled, `gray-100` fill, `gray-200` border, `gray-400` text, `cursor: not-allowed`. Under them, while a second major is chosen, a `caption` `gray-500` hint (`space-1-5` above).
- Danger Card: the Card border becomes `red-200`, the title `red-600`; body text `body-sm` `gray-600` with `space-4` below; the outline Button takes `red-300` border and `red-600` text, hovering to `red-50` fill and `red-400` border.
- Layering: 기본 정보 is `z-sticky` and 전공 설정 `z-raised`, both `position: relative`, so an open SearchableSelect list paints over the Card below it (each Card's entrance animation leaves a transform that creates a stacking context).
- Motion: banner `fade-in` 600ms, Cards `fade-in-up` 600ms with `anim-delay-100` and `-200` on 계정 정보 and the danger Card; `anim-delay-50` on 전공 설정 is not defined in globals.css, so it has no delay.

## Copy

프로필 · 개인 정보를 관리하세요. · 사용자 · {n}년 입학 · 복수전공: {학과} · 부전공: {학과} · 기본 정보 · 이메일 · 이름 · 입학년도 · 커리큘럼 연도 · 학과 · 미설정 · 학과 미설정 · 전공 설정 · 복수전공 / 부전공 · + 복수전공 추가 · + 부전공 추가 · 복수전공을 선택했습니다. 해제하려면 다시 클릭하세요. · 계정 정보 · 계정 유형 · Google 계정 · 이메일 계정 · 권한 · 게스트 모드 · 데이터 저장 · 이 브라우저에만 저장 · 위험 구역 · 회원 탈퇴 시 모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다. · 회원 탈퇴 · 삭제 중... · 계정 초기화 (guest danger Card).

Confirmation before deletion is a native `confirm()`: "정말로 회원 탈퇴하시겠습니까?\n\n모든 수강 계획, 커스텀 과목 등 계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.\n\n이 작업은 되돌릴 수 없습니다."

## Accessibility

- The page has one `h1` (프로필) and an `h2` for the name; Card titles are `h3`.
- The 기본 정보 edit toggle is icon-only with no `aria-label` or `title`; screen readers announce an unnamed button.
- The major-type toggles are plain `<button type="button">` elements with no `aria-pressed`; the on state is conveyed by color, the `check` icon and the hint line.
- Form labels in the edit state have no `htmlFor`; the 커리큘럼 연도 select has no focus style of its own (browser default ring).
- Lucide icons render with `aria-hidden="true"`.

## Not reproduced

- The edit form (Input, SearchableSelect, the native select and the 저장 Button), its validation and the update mutation; the guest variant's form-only 기본 정보 Card and its `계정 초기화` danger Card copy.
- Session and store reads, the delete mutation, `confirm()` and the sign-out after deletion.
- Entrance animations (the classes exist as `--enter` modifiers but the preview renders at rest).

Pattern extracted from inline markup in `src/app/(dashboard)/profile/page.tsx`; no component exists in the source
