Inline graduation-requirement editor on a recessed gray-50 panel: help banner, 전공 유형 radios, load-from-department row, two-column credit grids, 기이수 cutoff select with an amber suggestion, and a 저장 / 취소 footer.

## Use it for / don't use it for

Use it inside the RequirementsSummary Card when the student enters or edits their graduation requirement (`졸업 요건 입력` / `졸업 요건 수정`); it replaces the summary in place rather than opening a modal. Do not use it for the admin department requirement tables, for per-course edits, or anywhere outside a white Card: its bare borders and the Button focus rings take their color from the Card's `text-gray-900`.

## What the consumer provides

- `initialData?: RequirementFormData` — existing values; when present the submit label reads 수정, otherwise 저장. Without it the form starts at 단일전공, empty 졸업 기준 fields, every 기이수 field at `0`, and the cutoff select on 선택 안 함.
- `onSubmit: (data: RequirementFormData) => void` — receives parsed integers after validation passes.
- `onCancel: () => void` — the 취소 outline Button.
- `isLoading?: boolean` — submit Button shows the spinner and 로딩중... and is disabled.
- `onLoadFromDeptReq?: () => Promise<Partial<RequirementFormData> | null>` — renders the 학과 기준표에서 불러오기 row only when given.
- `userMajorType?: MajorType` (`'single' | 'double' | 'minor'`) — hides radio options that do not apply; undefined shows all three.
- `requirementYear?: number` with `onYearChange?: (year: number) => void` — both required for the year select (2025년 / 2026년).
- `semesterOptions?: Array<{ year: number; term: 'spring' | 'fall'; label: string }>` — renders the cutoff select when non-empty; labels look like `2학년 1학기`.
- `suggestedCutoff?: { year: number; term: 'spring' | 'fall'; label: string } | null` — drives the amber suggestion banner.
- Container: a Card (`bg-white text-gray-900`); the form takes the full Card width. No children.

## Anatomy and states

- Root `<form>`: fill `gray-50`, padding `space-4`, radius `radius-lg`, 1px `border-default` (a bare `border` = currentColor from the Card). Children stack with `space-5`.
- Help banner: fill `blue-50`, 1px `blue-100` border, `radius-md`, padding `space-2` × `space-3`, `caption` in `gray-500` (4.4:1 on blue-50 in the source — kept, flagged). HelpCircle at `icon-sm` in `yu-cyan` (2.5:1 — flagged). Link `yu-cyan` underlined (2.5:1 — kept, flagged) → `yu-navy` on hover, no transition.
- Section headings: `body-sm-semibold` in `gray-800`; every heading except 기이수 학점 carries a `border-b` + `space-2` padding whose line is `gray-800` (currentColor of the heading itself), and the grid-section headings add `space-3` below. Later sections open with a `border-default` top rule and `space-4` padding. 기이수 학점 has no rule; its subheading is `caption` in `gray-400` (2.5:1 — kept, flagged).
- Radios: row gap `space-4`; each label is flex, gap `space-2`, `cursor: pointer`; native 16px radio; text `body-sm` in the inherited `gray-900`. With `userMajorType="single"` the row is replaced by a `caption` notice in `gray-500` with the same cyan link.
- Load row: outline Button size sm (`control-sm`, padding `space-3`, 1px `gray-300` (1.5:1 on white — kept, flagged), fill `white` → `gray-50` on hover) beside the year select; success line `caption` in `blue-600` (5.0:1).
- Selects —  year = `caption` text, 1px `gray-300`, `radius-md`, padding `space-1-5` × `space-2`, fill `white`, text `gray-700` (`gray-300` borders on white are 1.5:1 in the source — kept, flagged); cutoff = the same at `body-sm`, padding `space-2` × `space-3`, width 100%. Both focus with `outline: none` and a 1px `blue-500` ring (3.6:1 on the gray-50 form), border unchanged.
- Field grid: two equal columns, `space-3` column gap, `space-2` row gap. Label `caption-medium` in `gray-600`, `space-1` below. Input = the shared `.cp-input` recipe (`control-md`, 1px `gray-300` → `gray-400` on hover, `radius-md`, `body-sm`, placeholder `gray-400`, 2.6:1 on white — kept, flagged); focus turns the border `transparent` under a 2px `yu-cyan` ring (2.6:1 on the gray-50 form — kept, flagged). Input borders at 1.5:1 on white are the source pair, flagged.
- Error field: the form passes `className="border-red-500"` (not the `error` prop), so only the border turns `red-500` (3.8:1); hover still swaps it to `gray-400` and focus still rings `yu-cyan`. Message `caption` in `red-500` with `space-1` above (3.6:1 on gray-50 — kept, flagged). Hints are `caption` in `gray-400` with `space-0-5` above.
- Suggestion banner: fill `amber-50`, 1px `amber-200`, `radius-md`, padding `space-2` × `space-3`, text `caption` in `amber-800` (6.8:1). Its raw button: `caption-medium` in `amber-800`, fill `amber-100` → `amber-200` on hover (`duration-fast` colors), 1px `amber-300`, `radius-sm`, padding `space-1` × `space-2`, `space-1-5` above; no focus style, no pointer cursor.
- Footer: flex, gap `space-2`, `space-2` padding above. Submit = primary Button (`control-md`, padding `space-2` × `space-4`, `white` label on `yu-navy` → `yu-blue` gradient in oklab, `shadow-sm`; hover `yu-navy-hover` → `yu-navy` with `shadow-md`) stretched with `flex: 1`; 취소 = outline Button at natural width. Both scale to 0.98 on active, dim to `opacity-disabled` when disabled, and on keyboard focus draw a 2px `white` offset plus a 2px ring in currentColor (gray-900 on the outline, white on the primary — Tailwind v4's default ring color; on the primary the ring is `white` on a `white` offset over `gray-50` (1.0:1), so the source has no visible keyboard focus indicator there — kept, flagged).
- Loading: submit disabled with the 16px `icon-md` spinner (`cp-spin` 1s linear, track `opacity-spinner-track`, head `opacity-spinner-head`) and 로딩중....

## Copy

- 졸업 기준과 취득 학점을 잘 모르시나요? / 확인 방법 보기 (→ /help/graduation-guide)
- 전공 유형 · 단일전공 · 복수전공 · 부전공 · 단일전공으로 설정되어 있습니다. / 복수전공/부전공은 프로필에서 변경하세요. (→ /profile)
- 학과 기준표에서 불러오기 · 2025년 · 2026년 · 학과 기준표에서 불러왔습니다. 수정할 수 있습니다.
- 졸업 기준 · 졸업학점 (예: 130) · 교양학점 (예: 30) · 전공학점 (예: 60) · 전공핵심 (최소) (예: 24)
- 복수전공 · 복수전공 학점 (예: 60) · 복수전공핵심 (최소) (예: 24) · 부전공 · 부전공 학점 (예: 21) · 부전공핵심 (최소) (예: 9) · 주전공 최소 학점 (예: 63)
- 기이수 학점 · 성적표 기준으로 이미 이수한 학점 · 졸업학점 · 이미 이수한 총 학점 (전공+교양+기타 포함) · 교양 · 전공 · 전공핵심 · 복수전공 · 복수전공핵심 · 부전공 · 부전공핵심 (placeholders 0)
- 계획에 ‘이수’ 과목이 있습니다. 해당 학기가 기이수(성적표)에 이미 반영되어 있다면, 기준 학기를 설정해야 중복 합산되지 않습니다. / 기이수 학점을 수정했습니다. 성적표에 새로 반영된 학기가 있다면 기준 학기도 함께 올려주세요. / {label}까지로 설정
- 기이수에 반영된 마지막 학기 · 선택 안 함 — 계획의 이수 과목을 모두 합산 · {label}까지 기이수에 반영됨 · 선택한 학기까지 계획에 ‘이수’로 표시한 과목은 기이수 학점에 이미 포함된 것으로 보고 중복 합산하지 않습니다.
- Validation: 1 이상의 학점을 입력하세요 · 0 이상의 학점을 입력하세요 · 전공핵심은 전공학점 이하여야 합니다 · 복수전공핵심은 복수전공학점 이하여야 합니다 · 부전공핵심은 부전공학점 이하여야 합니다 · 전공 + 복수전공/부전공 + 교양 학점이 졸업학점을 초과합니다 · 기이수 전공핵심은 기이수 전공 학점 이하여야 합니다 · 기이수 복수전공핵심은 기이수 복수전공 학점 이하여야 합니다 · 기이수 부전공핵심은 기이수 부전공 학점 이하여야 합니다 · 기이수 졸업학점은 {전공+교양 | 전공+복수전공+교양 | 전공+부전공+교양} 합계({n}학점) 이상이어야 합니다 (the last four come from `src/lib/priorCredits.ts`)
- 저장 / 수정 · 취소 · 로딩중...

## Accessibility

Radios are native inputs sharing `name="majorType"` inside `<label>` elements, so their text is a label. Field labels are `<label>` elements without `htmlFor`, and the Inputs have no `id`, `aria-invalid` or `aria-describedby`; error lines are plain `<p>` text with no live region. The year select has no label at all. The primary Button's keyboard focus is not visible (white ring on a white offset). Buttons use real `<button>` elements with `type`; the Button keyboard ring is `focus-visible` only, while the amber suggestion button has no focus style. Links are Next `Link` anchors. Submitting runs validation and, on failure, only repaints borders and text.

## Not reproduced

- Validation, parseInt submit payload, and the cross-field rules.
- `onLoadFromDeptReq` fetch and the prefill it triggers; `onYearChange` refetch.
- The 복수전공 and 부전공 sections and their 기이수 fields (shown only when that radio is selected).
- The suggestion banner's visibility logic (`suggestedCutoff` ahead of the current cutoff, prior credits entered, or earned fields edited) and the click that sets the select.
- Next `Link` navigation.

Static rendition hand-translated from `src/components/features/RequirementForm.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Button.tsx`.
