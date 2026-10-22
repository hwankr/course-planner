# Planner semantics

The planner encodes three things with color: a course's requirement category, its status, and graduation progress. The maps below are copied from the source (`CourseCard.tsx`, `SemesterColumn.tsx`, `ReadOnlySemesterColumn.tsx`, `RequirementsSummary.tsx`). Use the alias tokens, not raw palette names, so the meaning travels with the color.

## Requirement category (`RequirementCategory`)

Chips: `caption-medium` (12px/500) or `micro-10` in compact rows, `space-0-5` × `space-1-5` padding (`space-1` horizontal in compact), `radius-sm`.

| Key | Full label | Short label | Fill | Text |
| --- | --- | --- | --- | --- |
| `major_required` | 전공핵심 | 전핵 | `category-major-required-bg` (red-100) | `category-major-required-text` (red-700) |
| `major_compulsory` | 전공필수 | 전필 | `category-major-compulsory-bg` (rose-100) | `category-major-compulsory-text` (rose-700) |
| `major_elective` | 전공선택 | 전선 | `category-major-elective-bg` (orange-100) | `category-major-elective-text` (orange-700) |
| `general_required` | 교양필수 | 교필 | `category-general-required-bg` (blue-100) | `category-general-required-text` (blue-700) |
| `general_elective` | 교양선택 | 교선 | `category-general-elective-bg` (green-100) | `category-general-elective-text` (green-700) |
| `teaching` | 교직 | 교직 | `category-teaching-bg` (violet-100) | `category-teaching-text` (violet-700) |
| `free_elective` | 자유선택 | 자선 | `category-free-elective-bg` (gray-100) | `category-free-elective-text` (gray-600) |

Unknown or missing categories fall back to the 자유선택 pair. Semester headers summarize credits with the short labels glued to numbers and joined by middle dots: `(전핵3 · 전선6 · 교필3)`.

Department chips (string-matched on the label): 복수전공 → `dept-double-major-bg` / `dept-double-major-text` (purple-100 / purple-700); 부전공 → `dept-minor-bg` / `dept-minor-text` (orange-100 / orange-700, the same pair as 전공선택).

## Course status

Two vocabularies exist for one enum; use the one that matches the density.

| Status | Default label | Compact pill label | Card surface (default mode) | Compact pill |
| --- | --- | --- | --- | --- |
| `planned` | 계획 | 예정 | `status-planned-bg` + `status-planned-border` (yu-navy at 5% / 20%) | `pill-planned-bg` / `pill-planned-text` (blue-100 / blue-700) |
| `enrolled` | 수강중 | 수강중 | `status-enrolled-bg` / `status-enrolled-border` (green-50 / green-200) | `pill-enrolled-bg` / `-text` (green-100 / green-700) |
| `completed` | 완료 | 이수 | `status-completed-bg` / `-border` (gray-50 / gray-200) | `pill-completed-bg` / `-text` (emerald-100 / emerald-700) |
| `failed` | 재수강 | 재수강 | `status-failed-bg` / `-border` (red-50 / red-200) | `pill-failed-bg` / `-text` (red-100 / red-700) |

The default-mode status pill is outlined: white fill, `caption`, `radius-full`, and a bare `border` (so `border-default`, the dark currentColor hairline). Clicking it toggles planned ↔ completed only. In compact mode the pill is filled, `micro-9` at 500 weight, `radius-sm`, and shows a one-time `animate-pulse` + `ring-2 blue-300/50` hint on planned courses.

Known collisions to design around: the 예정 pill and the 교양필수 chip are the same blue pair; the 재수강 pill and the 전공핵심 chip are the same red pair; 전공선택 and 부전공 share orange. Keep the chip order (status, category, department) so position disambiguates.

## Graduation progress (`RequirementsSummary`)

Stacked bars run earned → enrolled → planned inside a `gray-100` track with `radius-full`; heights `space-2-5` (hero, 10px), `space-2` (track rows, 8px), `space-1-5` (sub-rows, 6px).

| Segment | Fill | Legend label |
| --- | --- | --- |
| Earned, requirement met | `emerald-500` | 이수 N (기이수 N 포함) |
| Earned, not yet met | `blue-600` | 이수 N |
| Enrolled | `sky-400` | 수강중 N |
| Planned | hatch: `repeating-linear-gradient(135deg, progress-hatch-dark 0 3px, progress-hatch-light 3px 6px)` | 예정 N |
| Unplanned | `gray-200` (legend swatch only) | 미계획 N |

Legend swatches are 8 × 8 with `radius-xs`. Values read `{earned}/{required}` in `caption` `gray-500`, prefixed `✓ ` and colored `emerald-600` once met; the hero percentage is `heading-4` weight 600 in `gray-800`, `emerald-600` at 100%, with a `→ 계획 반영 시 N%` projection in `gray-400`. Sub-rows are indented with `└ ` in `micro-11` `gray-400`. The year badge is `micro-10` `teal-700` on `teal-50` with a `teal-200` border, `radius-full`. Note that none of the brand blues are used for progress; the summary's own tint button (요건 수정) is `yu-navy` on `yu-navy-a10`.

Summary states map to Card treatments: loading → a single `h-4` `gray-200` `animate-pulse` bar; error → Card with `red-200` border, `red-600` message and an outline `다시 시도` button; empty → `border-dashed` Card, `gray-500` prompt, `직접 입력` + `기본 요건 생성`; ready → the progress view.

## Labels and formats

- Semester: `{year}학년 {1학기|2학기}` (spring → 1학기, fall → 2학기). Credits: `{n}학점`, never a space before 학점. Counts: `{n}과목`, `{n}개`.
- Separators: ` · ` between summary items; `/` between earned and required; `→` for projections; `+N개 더 보기` and `접기 / 펼치기` for overflow.
- Destructive prompts are native `window.confirm` in 합니다체: "이 학기의 모든 과목(N개)을 제거하시겠습니까?", "이 학기에 N개의 과목이 있습니다. 정말 삭제하시겠습니까?".
- Empty semester copy: "과목을 드래그하세요", or "과목 리스트에서 + 버튼으로 과목을 추가하세요" when the column is focused. The focused column also shows an English `Focus` badge in `yu-navy` with white `caption-medium` text.

## Catalog filter chips and tags (`CourseCatalog`)

Filter chips are pills: `caption-medium`, `space-0-5` × `space-2` padding, `radius-full`, `transition-colors`. Active chips fill at the 500 step with white text; inactive chips sit on the 50 tint with 600 text and hover to the 100 tint. Brand rows (학과 내 학과 / 주전공, 학년, the 전체 chip) use `yu-navy` active and `yu-navy-a10` / `yu-navy` text inactive, hovering to `yu-navy-a20`.

| Row | Chip | Active | Inactive → hover |
| --- | --- | --- | --- |
| 학과 | 내 학과 / 주전공 | `yu-navy` + white | `yu-navy-a10` + `yu-navy` → `yu-navy-a20` |
| 학과 | 복수전공 | `purple-500` + white | `purple-50` + `purple-600` → `purple-100` |
| 학과 | 부전공 | `orange-500` + white | `orange-50` + `orange-600` → `orange-100` |
| 학과 | 공통 | `indigo-500` + white | `indigo-50` + `indigo-600` → `indigo-100` |
| 학년 | 전체, 1 … 6 | `yu-navy` + white | `yu-navy-a10` + `yu-navy` → `yu-navy-a20` |
| 학기 | 전체 / 1학기 / 2학기 | `emerald-500` + white | `emerald-50` + `emerald-600` → `emerald-100` |
| 이수 | 전공핵심 | `red-500` + white | `red-50` + `red-600` → `red-100` |
| 이수 | 전공필수 | `rose-500` + white | `rose-50` + `rose-600` → `rose-100` |
| 이수 | 전공선택 | `orange-500` + white | `orange-50` + `orange-600` → `orange-100` |
| 이수 | 교양필수 | `blue-500` + white | `blue-50` + `blue-600` → `blue-100` |
| 이수 | 교양선택 | `green-500` + white | `green-50` + `green-600` → `green-100` |
| 이수 | 교직 | `violet-500` + white | `violet-50` + `violet-600` → `violet-100` |
| 이수 | 자유선택 | `gray-500` + white | `gray-100` + `gray-600` → `gray-200` |

White on the 500 fills is below 4.5:1 for orange, green, emerald and gray (about 2.5–3.5:1); the source keeps it, so do these chips, flagged. Row labels (학과 · 학년 · 학기 · 이수) are `micro-11` at 500 weight in `gray-400`; 학년 and 학기 sit on one row separated by a 1 × 16px `gray-200` rule.

Catalog tags: a user-made course reads 커스텀 in `micro-10` `emerald-600` (list) or as an `emerald-500` white corner ribbon (card, top-left, `radius-md` on its outer corners); a course already in the plan reads 추가됨 in `yu-navy-a60` (list) or a `yu-navy-a10` / `yu-navy` ribbon (card, top-right) and the whole item drops to 50% opacity; the 공통 tab marks items with an `indigo-100` / `indigo-700` badge or `indigo-500` ribbon. The curriculum-year badge next to the title is `micro-10` at 500 in `yu-cyan` on `yu-cyan-a10`, `radius-sm`. The round add button is 20px (`w-5 h-5`) in list rows and 24px on cards, `yu-navy` with a white bold `+`, `yu-navy-hover` on hover, `gray-300` / `gray-500` while adding.

Common quick-add cards (공통 tab): a 2-column grid of tinted cards per category — 교양필수 `blue-50` / `blue-200` border / `blue-700` title with `blue-500` → `blue-600` credit buttons; 교양선택 green; 자유선택 gray; 교직 violet — each offering 1학점 / 2학점 / 3학점 solid buttons (`body-sm-medium`, white, `radius-sm`), disabled to `gray-200` / `gray-400` until a semester is focused.

## Beyond the planner: other fixed vocabularies

| Domain | Values | Fill / text | Where |
| --- | --- | --- | --- |
| Academic event category | 학사 · 수강신청 · 시험 · 공휴일 · 기타 | `blue-100`/`blue-700` · `green-100`/`green-700` · `red-100`/`red-700` · `rose-100`/`rose-700` · `gray-100`/`gray-700`, each with a matching 200 border | calendar chips (micro: 50 tint + 700 text) |
| Feedback status | 대기중 · 해결됨 | `yellow-100`/`yellow-700` with `clock` · `green-100`/`green-700` with `check-circle` | help/feedback, admin feedback |
| Feedback category (admin) | 버그 · 기능 요청 · 데이터 오류 · 기타 · 문의 | red · blue · orange · gray · teal (100 / 700) | admin feedback |
| Patch-note status (admin) | 초안 · 발행됨 | `yellow-100`/`yellow-700` · `green-100`/`green-700` | admin patch notes |
| User role (admin) | 관리자 · 학생 | `red-100`/`red-700` with `shield` · `blue-100`/`blue-700` with `user` | admin users |
| Sign-in provider (admin) | Google · 이메일 | `yellow-100`/`yellow-700` · `gray-100`/`gray-700` | admin users |
| Major type | 복수전공 · 부전공 | chips `purple-100`/`purple-700` · `orange-100`/`orange-700`; toggles `purple-500` / `orange-500` filled when on, `gray-300` bordered white when off, `gray-100`/`gray-400` when disabled | profile, onboarding, planner header, catalog |
| Notification type | 업데이트 소식 · 새 문의 · 기타 | `purple-100`/`purple-600` `megaphone` · `yellow-100`/`yellow-600` `message-square-text` · `blue-100`/`blue-600` | header bell menu |
| Identity badges | department code, version, 학번, N학점 | `blue-100`/`blue-700` (600 weight) · `blue-100`/`blue-700` · `purple-100`/`purple-700` · `slate-100`/`slate-600` | admin lists, patch notes |
| Admin stat accents | 공식 과목 · 학과 · 사용자 · 수강 계획 | `yu-navy` · `green-600` · `purple-600` · `orange-600` (`heading-1` bold) | admin dashboard |

Admin course badges use a different category map from the planner (전공필수 orange, 전공선택 blue, 교양필수 green, 교양선택 teal, 교직 purple, 자유선택 gray-700) — a source inconsistency; the planner map above is the canonical one. Red, green, purple and orange are each overloaded across these tables (red = admin role, bug, 전공핵심, failed, and every destructive action); when you add a new status, prefer a hue the neighbouring screen does not already use.
