Catalogue of the six overlay-and-panel recipes the app writes inline around its seven dialogs, each labelled by its source file.

## Use it for / don't use it for

- Use the CustomCourseForm shell (a) for a short form opened from the planner; AddSemesterDialog (b) for a Card-styled picker with a 24px title; AllPlansModal (c) for a wide, scrollable browser with a `gray-50` header band, close button and footer notice; the admin shells (d) for CRUD forms and the `container-sm` delete confirm under `/admin`; the calendar shell (e) only as the existing event form.
- Don't add a seventh recipe: pick one of these.
- Don't put a modal inside a Card or another modal except AllPlansModal → AnonymousPlanModal, which is why (c) sits at `z-overlay` (40) under the detail's `z-modal` (50).

## What the consumer provides

- No shell component exists; each file owns its open state and renders the overlay conditionally. CustomCourseForm: `onClose: () => void`, `departmentId?: string`, `availableCategories?: RequirementCategory[]`, `focusedSemester?: { year: number; term: string } | null`, `onClickAdd?: (courseId: string, courseData: { code: string; name: string; credits: number; category?: RequirementCategory; departmentId?: string }) => void`; the parent mounts it when open. AddSemesterDialog: `isOpen: boolean`, `onClose: () => void`, `onAdd: (year: number, term: Term) => void`, `existingSemesters: Array<{ year: number; term: Term }>`, `isLoading?: boolean` (false). AllPlansModal: `isOpen: boolean`, `onClose: () => void`, `departmentId?: string`.
- Admin pages: `showForm: boolean`, `editingCourse: CourseItem | null` / `editingId: string | null`, `deleteConfirmId: string | null`, `isSaving: boolean`. Calendar: `showEventForm: boolean`, `editingEvent: CalendarEvent | null`.
- Children: a header (title, optional subtitle, optional close button), a `<form>` or text body, and an action row. The overlay is `position: fixed; inset: 0`, so the container is the viewport; the preview pins it to a stage.

## Anatomy and states

- Overlay: `position: fixed; inset: 0`, flex-centered, fill `black-a50`, `z-modal` (50); (c) uses `z-overlay` (40). (a), (c) and (e) add a `space-4` gutter; (b) and (d) have none, so below the panel's max-width the `w-full` panel meets the viewport edges. No shell sets a text color or font, so content inherits the body `foreground` at 16px/24px `font-body`. Backdrop click closes (b) and (c) only (`e.target === e.currentTarget`); the others ignore it.
- Panel (a): `white`, `radius-lg`, `shadow-xl`, `max-width: container-md`, `max-height: 90vh`, scrolls. Panel (b): `.cp-card` at `container-md` — `radius-lg`, 1px `border-default` hairline (bare `border` = currentColor = `gray-900`), `shadow-sm` → `shadow-md` on hover, `gray-900` text; no max-height. Panel (c): `white`, `radius-xl`, `shadow-2xl`, `container-4xl`, `max-height: 85vh`, flex column, `overflow: hidden`, `outline: none` on the `tabindex="-1"` focus target. Panel (d): `white`, `radius-2xl`, `shadow-xl`, padding `space-6`; `container-lg` for the forms (courses adds `max-height: 90vh` + scroll), `container-sm` for the confirm. Panel (e): `.cp-card` at `container-lg`, `max-height: 90vh`, scroll; CardContent `p-6` and (b)'s `pt-6` both resolve to `space-6` on every side after `cn()`.
- Header (a): padding `space-4` × `space-6`, 1px `gray-200` bottom rule (1.2:1 on white, decorative). Header (c): flex, space-between, same padding, fill `gray-50`, bottom rule 1px `foreground` — the bare `border-b` is currentColor, not `gray-200`. Header (d courses): flex, space-between, `margin-bottom: space-5`; (d departments) has no header row — the `<h2>` stands alone and the form takes `margin-top: space-4`. Header (e): flex, space-between, `margin-bottom: space-4`.
- Title: `heading-4` (600 18px/28px) in `gray-900` (a); the same at 700 (c, d); `heading-2` size at 600 with `margin-bottom: space-6`, inheriting `gray-900` (b); `heading-3` (600 20px/28px) in `yu-navy` via inline style (e). Subtitle: `body-sm` in `gray-500`, `margin-top: space-1` (a) or `space-0-5` (c, shown once `plansData` loads) — 4.8:1 on `white` (a), 4.6:1 on `gray-50` (c). Confirm body: `body-sm` in `slate-600`, `margin-top: space-2` (7.6:1).
- Close button: a hand-rolled `<button>` with no border or fill, `radius-lg`, Lucide X at `icon-lg`. (c): padding `space-2`, icon `gray-500`, hover fill `gray-200`, `duration-fast` color transition, `aria-label="닫기"`. (d courses): padding `space-1`, `slate-400` icon (2.6:1 on white — misses 3:1, kept, flagged), hover fill `slate-100` + `slate-600`, pointer cursor, no transition, no label. (e): padding `space-2`, icon inherits `gray-900`, hover fill `gray-100`, `duration-fast`. (a), (b) and the departments dialogs have no close button.
- Content (c): `flex: 1`, `overflow-y: auto`, padding `space-4` × `space-6`; the preview leaves it empty. Bodies: `space-y-4` (a, d, e) or `space-y-6` (b); (a) adds padding `space-6`, (d departments) `margin-top: space-4`.
- Action row (a, b): flex, `gap: space-3`, `padding-top: space-2`, children `flex: 1`; (a) `.cp-button--ghost` 취소 then `.cp-button--default` 추가; (b) default 추가 then `.cp-button--outline` 취소. (d courses): `justify-content: flex-end`, `gap: space-2`, `padding-top: space-2`; 취소 `slate-200` fill / `slate-600` label (6.2:1), hover `slate-300`; 추가 `yu-cyan` fill / `white` `body-sm-medium` (2.8:1 — kept, flagged), hover `yu-navy`, `opacity-disabled` while saving, no transition. (d departments form): `align-items: center`, `gap: space-3`, `padding-top: space-2`; ghost 취소 (`slate-600`, hover `slate-100`, `duration-fast`), the same cyan 추가 with `transition-colors`. (d confirm): `margin-top: space-4`, `gap: space-3`; ghost 취소 and 삭제 `red-600` fill / `white` (4.8:1), hover `red-700`. (e): `gap: space-3`, `padding-top: space-4`; 취소 1px `gray-300` outline on transparent, inherits `gray-900`, hover `gray-50`; 추가 `yu-navy` fill / `white`, no hover, `opacity-disabled` while pending; both `flex: 1`, 16px.
- Footer (c): padding `space-3` × `space-6`, top rule 1px `foreground`, fill `gray-50`; notice flex, `gap: space-2`, `caption` in `gray-400` (2.5:1 on `gray-50` — kept, flagged) with a Lucide Info at `icon-sm`, `margin-top: space-0-5`, `flex-shrink: 0`.
- Motion: none of the six animates in or out.

## Copy

- (a) `커스텀 과목 추가` · `나만의 과목을 추가하세요.` · `취소` · `추가` / `추가 중...`
- (b) `학기 추가` · `추가` / `로딩중...` · `취소`
- (c) `익명 수강계획 전체 보기` (title and `aria-label`) · `총 {total}개의 수강계획` · `닫기` (aria-label) · `이 계획은 익명으로 공유되며, 작성자의 개인정보는 포함되지 않습니다.`
- (d) `과목 추가` / `과목 수정` · `학과 추가` / `학과 수정` · `취소` · `추가` / `수정` / `저장 중...` · `학과 삭제` · `정말로 이 학과를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.` · `삭제`
- (e) `일정 추가` / `일정 수정` · `취소` · `추가` / `수정` / `저장 중...`

## Accessibility

- Only (c) declares `role="dialog"`, `aria-modal="true"` and an `aria-label`, moves focus to the panel (`tabindex="-1"`, `outline: none`) and labels its close button; it also sets `document.body.style.overflow = 'hidden'`. The other five are plain `<div>`s: no role, no focus move, no scroll lock, and background content stays in the tab order.
- Escape closes (b) and (c) (window / document keydown listeners; (c) ignores it while the detail modal is open). (a), (d) and (e) have no key handling.
- No shell traps focus or restores it on close. The (d) and (e) close buttons have no text or `aria-label`, so they read as empty buttons.
- Titles are real `<h2>` / `<h3>` elements but are not linked by `aria-labelledby`.

## Not reproduced

- Open and close state (`isOpen`, `showForm`, `deleteConfirmId`, `showEventForm`), backdrop-click and Escape handlers, the body overflow lock, `modalRef.current?.focus()`, and the smart-default and duplicate logic inside AddSemesterDialog.
- The inner fields and lists: the three forms' inputs, selects and segmented buttons, the AllPlansModal plan grid, loader, 더 보기 paginator and empty state (its content area is shown empty), the confirm's mutation.
- Button gating: (a) 추가 `disabled={createCourse.isPending || !departmentId || !formData.category || !focusedSemester}` — `category` starts as `''`, so (a) always opens with 추가 disabled and the preview shows it that way; (b) 추가 `disabled={isDuplicate || isLoading}` and 취소 `disabled={isLoading}`; (d) 추가 `disabled={isSaving}` in both forms, and the departments form's 취소 `disabled={isSaving}` too; (e) 추가 `disabled={createMutation.isPending || updateMutation.isPending}`. Those disabled states (other than (a)'s 추가) and (b)'s `isLoading` spinner are not shown: every other action is at rest. `:hover`, `:focus-visible` and `:active` work live in the preview.
- The viewport: `position: fixed; inset: 0` is pinned to a 300 × 240 stage and the `90vh` / `85vh` clamps measure the stage.

Pattern extracted from inline markup in `src/components/features/CustomCourseForm.tsx`, `src/components/features/AddSemesterDialog.tsx`, `src/components/features/AllPlansModal.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`, `src/app/(dashboard)/admin/departments/page.tsx`, `src/app/(dashboard)/calendar/page.tsx`; no component exists in the source
