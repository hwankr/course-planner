The badge and pill recipes the pages write inline as `<span>`, `<div>` or `<p>`: rounded-full status badges with a 12px Lucide icon (관리자, 학생, 대기중, 해결됨, 관리자 답변), text-only status and provider badges (초안, 발행됨, Google, 이메일), identity badges (department code, version, 학번, N학점), the planner header department and major badges, the help pages' eyebrow pills, the 18px bell count, the 32px notification icon circles, and the 10px plan-status and legend chips.

## Use it for / don't use it for

- Use a badge for one short categorical fact beside a name or title: a role, a status, an identifier, a department. Each recipe is bound to its data (`role`, `provider`, `status`, `majorType`, notification `type`); keep the pairing.
- Use the eyebrow pill once per help section, above the `yu-navy` title; use the count badge only on the bell button, and only while `unreadCount > 0`.
- Don't make a badge clickable: every recipe here is static text. The planner's 학년 year-filter chips and the calendar's term chips are `<button>`s and belong to the filter-chip pattern, not here.
- Don't restyle the course-category pills (버그, 전공핵심, …): they share the semibold `px-2.5` recipe and already live in FeedbackCard (`.cp-feedback__category`) and AdminList (`.cp-admin__badge`).

## What the consumer provides

- No props: each badge is JSX in a page. admin/users reads `UserItem.role: 'student' | 'admin'`, `provider: 'credentials' | 'google'`, `studentId?: string` and, per plan row, `PlanCourse.status: 'planned' | 'enrolled' | 'completed' | 'failed'` through `getStatusLabel` / `getStatusColor`. admin/feedback and help/feedback read `FeedbackStatus = 'pending' | 'resolved'`. admin/patch-notes reads `PatchNoteStatus = 'draft' | 'published'` (`STATUS_LABELS`, `STATUS_COLORS`) and `version?: string`; admin/departments `dept.code`; admin/courses `course.credits`.
- planner reads `departmentName?`, `headerMajorType: 'single' | 'double' | 'minor'`, `secondaryDepartmentName?`. layout.tsx reads `unreadCount: number`, `isAdmin: boolean` and `NotificationItem.type: string`.
- Icons are lucide-react components sized by class: `h-3 w-3` in status badges, `h-3.5 w-3.5` in eyebrows, `w-4 h-4` in the circles.
- Container: a `flex flex-wrap items-center gap-2` row inside a `Card` (admin lists), the planner's `flex items-center gap-2 mt-1 flex-wrap` row on the `gray-50` page, a white `rounded-2xl` help card, the bell `<button class="relative p-1.5 rounded-full">` (`.cp-app-header__bell`), or a notification row.

## Anatomy and states

- Base `.cp-badge`: `inline-flex`, padding `space-0-5` × `space-2-5`, `radius-full`, `caption-medium` (500 12px/16px `font-body`). No border, no hover, no focus, no transition on any recipe; color always comes from a modifier.
- Role (`--admin`, `--student`): weight 600, `align-items: center`, `gap: space-1`, icon `icon-xs`. 관리자 `red-100` / `red-700` with Shield (5.3:1); 학생 `blue-100` / `blue-700` with User (5.6:1).
- Feedback status (`--pending`, `--resolved`): weight 500, `gap: space-1`, icon `icon-xs`. 대기중 `yellow-100` / `yellow-700` with Clock (4.6:1); 해결됨 `green-100` / `green-700` with CheckCircle (4.5:1, at the floor).
- 관리자 답변 (`--reply`): weight 600, padding `space-0-5` × `space-2`, `gap: space-1`, `green-100` / `green-700`, Reply at `icon-xs` on the admin page only.
- Patch-note status (`--draft`, `--published`): weight 600, no icon, no `items-center`. 초안 `yellow-100` / `yellow-700`; 발행됨 `green-100` / `green-700`.
- Provider (`--google`, `--email`): weight 500 — lighter than the role badge beside it. Google `yellow-100` / `yellow-700`; 이메일 `gray-100` / `gray-700` (9.4:1).
- Identity: 학번 (`--student-id`) `purple-100` / `purple-700` at weight 500 (6.0:1); department code (`--dept-code`) `blue-100` / `blue-700` at weight 600; version (`--version`) the same pair at weight 600 with padding `space-0-5` × `space-2`; N학점 (`--credits`) `slate-100` / `slate-600` at weight 500 with padding `space-0-5` × `space-2` (6.9:1).
- Planner header (`--department`, `--double`, `--minor`): weight 500 with `align-items: center`. Department `yu-navy-a10` / `yu-navy` (9.0:1 composited on `gray-50`); 복수전공 `purple-100` / `purple-700`; 부전공 `orange-100` / `orange-700` (4.6:1).
- Eyebrow (`--eyebrow` + tone): `gap: space-2`, padding `space-1` × `space-3`, weight 600, icon `icon-sm`. `--eyebrow-slate` `slate-100` / `slate-700` (9.5:1); `--eyebrow-cyan` `yu-cyan-a10` / `yu-cyan` — 2.5:1 on white in the source, kept, flagged; `--eyebrow-purple` `purple-50` / `purple-600` (5.2:1); `--eyebrow-navy` `yu-navy-a5` / `yu-navy` (10.3:1). `--eyebrow-spaced` adds the `mb-3` (`space-3`) that help and help/feedback set; graduation-guide renders a `<p>` without it.
- Bell count (`--count`): `position: absolute` at −`space-1` top and right of the bell, `flex` centered, `min-width` and `height` 18px (no size token), padding 0 `space-1`, `radius-full`, 700 10px/15px (the `micro-10` size at bold). Student `red-500` / `white` — 3.8:1 in the source, kept, flagged; admin (`--count-admin`) `yellow-400` / `yellow-900` (5.5:1).
- Notification circle (`--chip`): `flex` centered, `icon-2xl` square, padding 0, `radius-full`, icon `icon-md`. Default `blue-100` with `blue-600` (4.3:1); `--chip-patch-note` `purple-100` with Megaphone `purple-600` (4.7:1); `--chip-feedback-new` `yellow-100` with MessageSquareText `yellow-600` — 2.7:1 for a meaning-carrying icon, kept, flagged.
- Plan-status mini pill (`--mini` + status): `display: inline`, padding `space-0-5` × `space-1-5`, 500 10px with the row's inherited unitless line-height 1.3333 (13.33px, not `micro-10`'s 15px). 이수 `green-100` / `green-700`; 수강중 `blue-100` / `blue-700`; 미이수 `red-100` / `red-700`; 계획 `slate-100` / `slate-600`.
- Legend chip (`--legend` + state): `display: inline`, padding `space-0-5` × `space-1-5`, `radius-sm`, 500 10px/15px. 예정 `blue-100` / `blue-700`; 이수 `emerald-100` / `emerald-700` (4.7:1). The `↔` and 클릭하여 변경 beside them are `gray-400` text (2.6:1 — kept, flagged) and not part of the chip.

## Copy

- Role `관리자` · `학생`; provider `Google` · `이메일`; feedback status `대기중` · `해결됨`; reply `관리자 답변`; patch-note status `초안` · `발행됨`.
- Identity: `{dept.code}`, `{note.version}` (placeholder `v1.0.0`), `{user.studentId}`, `{course.credits}학점`.
- Planner: `{departmentName}`, `복수전공: {secondaryDepartmentName}`, `부전공: {secondaryDepartmentName}`.
- Eyebrows: `도움말 가이드` · `Contact` · `빠른 문의` · `내 문의 내역` · `졸업 정보 가이드` · `STEP 1` · `STEP 2`.
- Bell: `{unreadCount}` or `99+`; the bell button's `title="알림"`. Plan rows: `이수` · `수강중` · `미이수` · `계획`; legend `예정` · `↔` · `이수` · `클릭하여 변경`.

## Accessibility

- Every badge is a plain `<span>`, `<div>` or `<p>` with visible text; none carries `role`, `aria-label` or `title`, and the Lucide icons are not `aria-hidden`, so screen readers get the text only (icons have no accessible name).
- Meaning is carried by color plus text everywhere except the notification circles, whose icon alone distinguishes the type; the `yellow-600` icon misses 3:1.
- The bell count is text inside the bell `<button>` (which has `title="알림"`, `aria-expanded`, `aria-haspopup="true"`), so its accessible name becomes `알림 3`-style; there is no live region for count changes.
- Nothing is focusable or interactive; no focus styles apply.

## Not reproduced

- The data that picks a recipe: `role`, `provider`, `status`, `majorType`, `type`, `unreadCount` (and the `99+` cap), the 30s unread-count poll, and the `studentId`, `version`, `secondaryDepartmentName` guards that hide a badge.
- The surrounding rows: `Card` list rows, the 알림 panel row, the help card and heading, the expanded 수강 계획표 course row (`rounded bg-white px-2.5 py-1.5 text-xs` on `slate-50`). The preview places each recipe on a white or `gray-50` stage.
- Course-category pills (FeedbackCard, AdminList) and the planner's 학년 filter `<button>` chips.

Pattern extracted from inline markup in `src/app/(dashboard)/admin/users/page.tsx`, `src/app/(dashboard)/admin/feedback/page.tsx`, `src/app/(dashboard)/admin/patch-notes/page.tsx`, `src/app/(dashboard)/admin/departments/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`, `src/app/(dashboard)/help/page.tsx`, `src/app/(dashboard)/help/feedback/page.tsx`, `src/app/(dashboard)/help/graduation-guide/page.tsx`, `src/app/(dashboard)/planner/page.tsx`, `src/app/(dashboard)/layout.tsx`; no component exists in the source
