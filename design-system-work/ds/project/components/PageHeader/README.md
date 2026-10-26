The page header each dashboard page writes inline above its content, in three recipes: the planner's 수강 계획 title with department badges, instruction line and the 내보내기 / 초기화 outline Buttons; the statistics gradient title with its lead and meta line; and the admin back link, title row and cyan 과목 추가 button.

## Use it for / don't use it for

- Use the planner recipe at the top of a page about the student's own plan: the badges come from the session or guest profile, and the right-hand cluster holds page-level commands (export, reset) that appear only once the plan has a semester.
- Use the statistics recipe for a read-only report: a gradient title, one lead line, and a meta line stating the data source and freshness.
- Use the admin recipe on admin sub-pages: they share the back link to `/admin` and the title + count line. A create button sits on the right of the title row only on some pages — yu-cyan 과목 추가 on admin/courses; admin/patch-notes and admin/requirements use a yu-navy fill with their own hovers (`hover:bg-[#0f2a57]`, `hover:bg-[#1a4a94]`); admin/departments puts its yu-cyan 학과 추가 in the filter row instead; admin/users and admin/feedback have none.
- Don't mix recipes on one page, and don't put filters or fields in the header — the admin page puts them in a separate `flex flex-wrap gap-3` row below it.

## What the consumer provides

- No props: each header is JSX inside the page's default export. The planner reads `departmentName?: string | null`, `headerMajorType: MajorType` (`'single' | 'double' | 'minor'`, from `session.user.majorType || 'single'` or `useGuestProfileStore`), `secondaryDepartmentName?: string | null` (members get `departments.find(...)?.name`, guests the store's `string | null`; both are truthiness-checked), `activePlan.semesters.length > 0` (shows the buttons), `showExportMenu: boolean`, `isExporting: boolean`, `resetPlanMutation.isPending: boolean` and `isGuest: boolean`.
- The statistics header reads `stats.departmentName: string`, `stats.totalStudents: number` and `stats.updatedAt` through `formatRelativeTime(new Date(...))`. The admin header reads `courses.length: number` and calls `openCreateForm()`.
- 내보내기 and 초기화 are `Button` from `@/components/ui` with `variant="outline"`, `className`, `disabled` / `isLoading`; the back link and the 학과를 설정해주세요 fallback are `next/link`.
- Container: the first child of the page root — `space-y-6` (planner, admin) or `container mx-auto px-4 py-8 max-w-7xl` (statistics) — inside the dashboard `<main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">` on the `gray-50` frame. Text color is inherited from the body (`foreground`).

## Anatomy and states

Planner (`planner/page.tsx`):
- Row: flex column, `gap: space-3`, items start; from `sm` (640px) a row with items centered and `justify-content: space-between`.
- Title `<h1>`: 700 20px/28px, `heading-2` (24px/32px) from `sm`, in `gray-900` (17.0:1 on `gray-50`).
- Badge row: flex, wrap, `gap: space-2`, `margin-top: space-1`. Badge: inline-flex, `padding: space-0-5 space-2-5`, `radius-full`, `caption-medium`. Department: `yu-navy-a10` fill with `yu-navy` text (9.0:1 over `gray-50`). 복수전공: `purple-100` / `purple-700` (6.0:1). 부전공: `orange-100` / `orange-700` (4.6:1).
- No department: `<a href="/profile">` replaces the whole badge row (so no 복수전공/부전공 badge either), in `caption`, `gray-400`, underlined; hover `yu-navy`. `gray-400` on `gray-50` is 2.5:1 in the source — kept, flagged.
- Instruction `<p data-export-ignore>`: `margin-top: space-1`, `body-sm` → `body` from `sm`, `gray-600` (7.2:1).
- Actions: flex, wrap, `gap: space-2` → `space-3` from `sm`. 내보내기 is `.cp-button.cp-button--outline` (1px `gray-300` on `white`, `radius-md`, `control-md`, `body-sm-medium` in the inherited `foreground`), label a flex `gap: space-1` with the Download icon at `icon-md`; hover `gray-50`. Exporting: `disabled` (`opacity-disabled`, no pointer events), label becomes a 12px (`icon-xs`) `gray-600` bottom-arc spinner (`cp-spin` 1s) + 내보내는 중.... The `gray-300` border is 1.5:1 on `white` — kept, flagged.
- Export menu (open): absolute, `top: 100%`, `margin-top: space-1`, left-anchored → right-anchored from `sm`, `min-width: 140px` (no token), `white`, 1px border in `foreground` (bare `border` = currentColor), `radius-lg`, `shadow-lg`, `padding: space-1 0`, `z-modal`. Item: full-width `<button>`, left-aligned, `padding: space-2 space-3`, `body-sm` in the inherited color, transparent; hover `gray-50`; no pointer cursor.
- 초기화: the same outline Button with `red-600` text (4.8:1 on `white`) and a `red-300` border (1.9:1 — kept, flagged); hover `red-50` fill, where `red-600` reads 4.4:1 — kept, flagged. `isLoading` swaps the label for Button's `cp-button__spinner` + 로딩중... and disables it.
- Export-only header (rendered inside the capture while `isExporting`): `padding-bottom: space-2`, `<h1>` fixed at 700 20px/28px `gray-900`, the same badges (`caption-medium` pills), but no 학과를 설정해주세요 link when the department is missing, and the 복수전공/부전공 badge shows even without a department badge; no instruction line, no actions.

Statistics (`statistics/page.tsx`):
- Root `margin-bottom: space-8`. Title `<h1>` in `heading-1` (700 30px/36px), `margin-bottom: space-2`; the text sits in `<span class="text-gradient">`: `linear-gradient(135deg, yu-navy, yu-blue, yu-cyan)` clipped to the glyphs. The `yu-cyan` end is 2.6:1 on `gray-50`, under the 3:1 large-text floor — kept, flagged.
- Lead `<p>`: 400 20px/28px in `gray-700` (9.9:1), `margin-bottom: space-2`.
- Meta row: flex, `gap: space-2`, `body-sm` in `gray-500` (4.6:1); Users icon at `icon-md`; three `<span>`s: the student count, a `·` span, and the update time.

Admin (`admin/courses/page.tsx`):
- Back `<a href="/admin">`: inline-flex, `gap: space-2`, `margin-bottom: space-4`, `body-sm-medium` in `yu-cyan` (2.6:1 on `gray-50` — kept, flagged), ArrowLeft at `icon-md`, `transition-colors` over `duration-fast`; hover `yu-navy` (10.7:1). No underline (preflight inherits none).
- Title row: flex, items centered, `justify-content: space-between`. `<h1>` in `heading-2`, `gray-900`; `<p>` `margin-top: space-1`, `body` in `gray-600`.
- 과목 추가 `<button type="button">` (not the Button primitive): inline-flex, `gap: space-2`, `padding: space-2 space-4`, `radius-lg`, `yu-cyan` fill with `white` `body-sm-medium` (2.8:1 — kept, flagged), Plus at `icon-md`, `cursor: pointer`, `transition-colors`; hover `yu-navy` (11.2:1).

## Copy

- Planner: `수강 계획` · `복수전공: {secondaryDepartmentName}` · `부전공: {secondaryDepartmentName}` · `학과를 설정해주세요` · `학기를 클릭하여 포커스 후, 과목 리스트에서 과목을 추가하세요.` · `내보내기` · `내보내는 중...` · `PNG 이미지` · `PDF 문서` · `초기화` · `로딩중...` (from Button). Confirm: `모든 학기와 과목이 삭제됩니다. 계획을 초기화하시겠습니까?`. Toasts: `로그인 후 이용할 수 있는 기능입니다.` (guest export), `계획이 초기화되었습니다.`.
- Statistics: `학과 수강 통계` · `{departmentName} 학생들이 많이 듣는 과목` · `{totalStudents}명의 학생 데이터 기반` · `·` · `{relativeTime} 갱신` where relativeTime is `방금 전`, `{n}분 전`, `{n}시간 전`, `{n}일 전` or `{n}개월 전`.
- Admin: `관리자 대시보드로 돌아가기` · `과목 관리` · `등록된 과목을 관리합니다. ({courses.length}건)` · `과목 추가`.

## Accessibility

- Each recipe uses one real `<h1>`; while exporting, the planner has a second `<h1>` (the export-only header) in the DOM.
- The export menu is a plain `<div>` of `<button>`s: no `aria-haspopup`, `aria-expanded`, `role="menu"` or arrow-key handling; it closes on outside `mousedown` / `touchstart`, after an item is chosen, or when the trigger is pressed again; not on Escape, and the trigger shows no open state.
- Button gives 내보내기 and 초기화 the `focus-visible` ring (currentColor) and `disabled` while exporting or loading; the menu items, the admin button and the links rely on the browser focus ring.
- Lucide icons render with `aria-hidden="true"` (the lucide-react 0.563 default when no aria prop is passed) and no title; the `·` separator and the spinner `<span>` are unlabeled.
- 초기화 asks through `window.confirm`; guests pressing 내보내기 get a Toast instead of the menu.

## Not reproduced

- Toggling the export menu, the outside-click close, `exportAsPng()` / `exportAsPdf()` (the html-to-image `toPng` capture, plus jsPDF for the PDF; the page's `beforeCapture` sets `style.minWidth = '768px'`) and the guest info Toast; `window.confirm` and `resetPlanMutation`.
- Session and guest-store reads that choose the badges, the `activePlan.semesters.length` gate on the buttons, and the TanStack loading of `stats` and `courses`; `formatRelativeTime` — names, counts and the relative time are sample values.
- Hover is shown at rest only on the PNG 이미지 item (`.is-hover`); the other hovers, `:focus-visible` and `:active` work live in the preview.
- The mobile layout (column header, left-anchored menu, 20px title, 14px instruction, `gap: space-2`) — the media rules are in the stylesheet, the preview renders at desktop width.

Pattern extracted from inline markup in `src/app/(dashboard)/planner/page.tsx`, `src/app/(dashboard)/statistics/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`; no component exists in the source
