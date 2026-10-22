The help page's feedback pattern: a rounded-2xl section card (eyebrow pill, navy title, lead) that holds either the 빠른 문의 textarea form with its counter and navy submit button, or the 내 문의 내역 list of bordered items with a status pill, timestamp, delete button and, once answered, a green-railed item with the 관리자 답변 box; the admin page repeats the item inside `Card` with category pills, a status toggle, a reply form and a meta line.

## Use it for / don't use it for

- Use the section card for the two blocks under 문의하기 on `/help/feedback`: 빠른 문의 (one textarea, POST `/api/feedback` with `category: 'contact'`) and 내 문의 내역 (the signed-in user's own items from `/api/feedback/my`). Stack cards `space-6` apart (`mt-6`).
- Use the admin item recipe only on `/admin/feedback`, one `Card` per row of `/api/feedback?limit=100`, under the page's status and category filter selects.
- Don't use the item for anything but feedback: the pills are fixed to `pending | resolved` and the five `FeedbackCategory` values. Don't add a category picker to the user form; the source has none.

## What the consumer provides

- No props: both pages inline the markup. The user card reads `content: string` (sliced to 2000), `isPending`, `showMyFeedback = isAuthenticated && !isGuest`, and `myFeedbacks.data: MyFeedbackItem[]` (`_id`, `category`, `message`, `status: 'pending' | 'resolved'`, `adminReply?`, `adminReplyAt?`, `isReadByUser`, `createdAt`, `updatedAt`).
- The admin item reads `FeedbackItem` (adds `email?`, `userId?: { _id; email; name }`, `isReadByAdmin`), `expandedIds: Set<string>`, `replyingId`, `replyContent` (sliced to 2000), `isReplying`, `isDeletingFeedback`.
- Container: user cards sit in `mx-auto max-w-3xl px-4 md:px-6` on a `from-slate-50 via-white to-slate-100` page; admin items in a `space-y-3` stack on the dashboard's `gray-50` page. Padding and title size follow `p-5 sm:p-8 md:p-12` and `text-xl sm:text-2xl`; the preview renders the 768px-and-up values.

## Anatomy and states

- Section card `.cp-feedback`: fill `white`, 1px `slate-200` border (1.2:1, decorative hairline), `radius-2xl`, `shadow-sm`, padding `space-12`; text color inherits `foreground`.
- Eyebrow `.cp-feedback__eyebrow`: `inline-flex`, `gap: space-2`, padding `space-1` × `space-3`, `radius-full`, 600 12px/16px (`caption` size), `margin-bottom: space-3`, with a 14px (`icon-sm`) Lucide icon. `--cyan` (Send, 빠른 문의): fill `yu-cyan-a10`, text `yu-cyan` — 2.5:1 in the source, kept, flagged. `--purple` (MessageSquareText, 내 문의 내역): fill `purple-50`, text `purple-600` (5.2:1).
- Title `<h2>` at 700 24px/32px (`heading-2`) in `yu-navy` (11.2:1); lead `body-sm` with `leading-relaxed` in `slate-600` (7.6:1), `margin-top: space-2`.
- Textarea `.cp-feedback__textarea` (a bare `<textarea rows=4>`, not `Input`): `width: 100%`, `resize: none`, padding `space-3` × `space-4`, 1px `slate-200` border, `radius-xl`, fill `slate-50`, `body-sm` text in `slate-900`, placeholder `slate-400` (2.5:1 on `slate-50` — kept, flagged), `transition-colors` at `duration-fast` / `ease-standard`. Focus on any focus (`:focus` / `.is-focus`): `outline: none`, border `yu-cyan`, fill `white`, ring `0 0 0 2px yu-cyan-a20` (ring 1.3:1, border 2.8:1 — kept, flagged). `disabled` while `isPending` changes nothing visually. `--sm` (admin reply, `rows=2`): `radius-lg`, padding `space-2` × `space-3`.
- Counter row `.cp-feedback__form-footer`: flex, space-between, `margin-top: space-2`; `{n}/2000` in `caption` `slate-400` (2.6:1 — kept, flagged).
- Submit `.cp-feedback__submit` (same recipe as the 로그인하기 `.cp-feedback__gate-link`): `inline-flex`, `gap: space-1-5`, padding `space-2` × `space-4`, `radius-lg`, fill `yu-navy` with `white` `body-sm-medium` (11.2:1), 16px (`icon-md`) Send, `cursor: pointer`; hover `yu-blue-dark` (8.7:1). Disabled when `content.trim().length < 5 || isPending`: `opacity-disabled`, `cursor: not-allowed`, label 5자 이상 입력해주세요 or Loader2 (`cp-spin` 1s linear) + 전송 중...; no `pointer-events-none`, so the hover fill still lands on a disabled button, and the faded white-on-navy reads about 2.8:1.
- Signed-out gate `.cp-feedback__gate`: `margin-top: space-5`, padding `space-6`, 1px dashed `slate-200`, `radius-xl`, fill `slate-50`, centered `body-sm` in `slate-500` (4.6:1), link `margin-top: space-3`.
- Empty `.cp-feedback__empty`: the same dashed box with padding `space-8`, a 40px (`space-10`) MessageSquareText in `slate-300` (decorative) and `body-sm` `slate-500` text at `margin-top: space-3`. Skeleton `.cp-feedback__skeleton`: 96px (`space-24`) `radius-xl` `slate-100` under `cp-pulse` (2s); `--admin` 128px (`space-32`) `radius-2xl` `slate-200`.
- List `.cp-feedback__list`: `margin-top: space-5`, children `space-3` apart.
- Item `.cp-feedback__item`: padding `space-4`, 1px `slate-200`, `radius-xl`, fill `white`, `transition-colors` with no state that changes it. `--replied` (has `adminReply`): left border 4px `green-400` (1.8:1 on white for a meaning-carrying rail — kept, flagged), fill `green-50-a30`.
- Head row `.cp-feedback__item-head`: flex, centered, space-between; the left cluster `.cp-feedback__item-meta` has `gap: space-2`.
- Status pill `.cp-feedback__status`: `inline-flex`, `gap: space-1`, padding `space-0-5` × `space-2-5`, `radius-full`, `caption-medium`, 12px (`icon-xs`) icon. `--pending`: `yellow-100` / `yellow-700` with Clock (4.6:1). `--resolved`: `green-100` / `green-700` with CheckCircle (4.5:1).
- Timestamp `.cp-feedback__date`: `caption` in `slate-400` (2.6:1 on white — kept, flagged), formatted by `toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })`.
- Delete `.cp-feedback__delete`: a 28px square, padding `space-1-5`, `radius-lg`, 16px Trash2 in `slate-400` (2.6:1, misses 3:1 for an icon — kept, flagged), `transition-colors`, `cursor: pointer`; hover fill `red-50` with `red-500` (3.5:1); `opacity-disabled` while a delete runs.
- Message `.cp-feedback__message`: `margin-top: space-2`, 400 14px with `leading-relaxed` in `slate-700` (10.4:1), `white-space: pre-wrap`. `--admin` drops the margin (its `mt-3` wrapper spaces it); `--clamped` is `line-clamp-3` for messages over 150 characters, followed by `.cp-feedback__more` (더보기 + ChevronDown or 접기 + ChevronUp, `caption-medium` in `yu-cyan` — 2.8:1, kept, flagged; hover `yu-navy`, no transition).
- Reply box `.cp-feedback__reply`: `margin-top: space-3`, padding `space-3`, 1px `green-200` (1.2:1, decorative), `radius-lg`, fill `white`; `--admin` fills `green-50`. Head: flex, `gap: space-1-5`, `margin-bottom: space-1-5`. Pill `.cp-feedback__reply-pill`: `green-100` / `green-700` (4.5:1), 600 12px/16px, padding `space-0-5` × `space-2`; the admin page adds a 12px Reply icon. Text is set like the message with no margin.
- Admin item `.cp-feedback__admin`: `.cp-card` with `overflow: hidden` and `.cp-card__content` padding `space-5` (`p-4 sm:p-5`; `Card` draws its `border-default` gray-900 hairline). Head `.cp-feedback__admin-head`: flex, wrap, `align-items: flex-start`, space-between, `gap: space-2`; tags and actions clusters `gap: space-2`.
- Category pill `.cp-feedback__category`: padding `space-0-5` × `space-2-5`, `radius-full`, 600 12px/16px; `--bug` `red-100` / `red-700` 버그 (5.3:1), `--feature` `blue-100` / `blue-700` 기능 요청 (5.6:1), `--data-error` `orange-100` / `orange-700` 데이터 오류 (4.6:1), `--other` `gray-100` / `gray-700` 기타 (9.4:1), `--contact` `teal-100` / `teal-700` 문의 (4.8:1).
- Status toggle `.cp-feedback__toggle`: padding `space-1-5` × `space-3`, `radius-lg`, `caption-medium`, `transition-colors`, `cursor: pointer`. `--resolve` (pending, 답변 없이 해결): `green-600` with `white` text — 3.2:1 in the source, kept, flagged; hover `green-700` (5.0:1). `--reopen` (resolved, 대기로 변경): `slate-200` / `slate-600` (6.2:1), hover `slate-300` (5.1:1).
- Reply form `.cp-feedback__reply-form`: `margin-top: space-3`, children `space-2` apart. Its footer row renders only while `replyContent` is non-empty: the counter, 취소 `.cp-feedback__cancel` (transparent, `slate-600`, hover `slate-100`) and 답변 및 해결 처리 `.cp-feedback__send` (`green-600` / `white` — 3.2:1, kept, flagged; hover `green-700`; disabled `opacity-disabled` + `cursor: not-allowed`; 12px Reply, or a spinning Loader2 with 전송 중...).
- Meta `.cp-feedback__admin-meta`: flex, wrap, `gap: space-3`, `margin-top: space-3`, `caption` in `slate-400` (2.6:1 — kept, flagged): `{name} ({email})`, the bare `email`, or 익명, then the date.
- Admin empty `.cp-feedback__admin-empty`: padding `space-12`, 1px `slate-200`, `radius-2xl`, `white`, a 48px (`space-12`) MessageSquare in `slate-300`, text at `margin-top: space-4` in `slate-500` (4.8:1). Admin error `.cp-feedback__admin-error`: padding `space-6`, 1px `red-200`, `radius-2xl`, fill `red-50`, centered `body-sm` in `red-600` — 4.4:1 in the source, kept, flagged.

## Copy

- Eyebrows, titles, leads: 빠른 문의 · 문의 남기기 · 간단한 문의사항을 남겨주세요. 관리자가 확인합니다. · 내 문의 내역 · 문의 내역 확인 · 내가 남긴 문의와 관리자 답변을 확인할 수 있습니다.
- Form: placeholder 문의 내용을 입력하세요 · `{content.length}/2000` · 문의 남기기 · 5자 이상 입력해주세요 · 전송 중... · 문의를 남기려면 로그인이 필요합니다. · 로그인하기.
- List: 대기중 · 해결됨 · 관리자 답변 · 아직 문의 내역이 없습니다. · delete `title="문의 삭제"` · `window.confirm('이 문의를 삭제하시겠습니까?')`.
- Admin: 버그 · 기능 요청 · 데이터 오류 · 기타 · 문의 · 답변 없이 해결 · 대기로 변경 · 더보기 · 접기 · placeholder 답변을 입력하세요... · `{replyContent.length}/2000` · 취소 · 답변 및 해결 처리 · 익명 · 피드백이 없습니다. · 피드백 목록을 불러오는데 실패했습니다. · `title="피드백 삭제"` · `window.confirm('이 피드백을 삭제하시겠습니까?')`.
- Toasts raised by the mutations: 문의가 성공적으로 제출되었습니다. · 문의가 삭제되었습니다. · 피드백 상태가 업데이트되었습니다. · 답변이 등록되었습니다. · 피드백이 삭제되었습니다.

## Accessibility

- The textareas carry a placeholder but no `<label>`, `aria-label` or `maxlength`; the 2000-character cap lives in `onChange`, and the counter is plain text, not `aria-live`.
- Delete buttons are icon-only with a `title` and no `aria-label`; the Lucide SVGs come with `aria-hidden="true"`, so the tooltip text is the whole accessible name. Deletion is guarded by `window.confirm`.
- Every control is a native `<button type="button">` or `<a>` and is reachable by keyboard. Buttons keep the browser's default focus outline; the textareas replace it with the cyan border and the `yu-cyan-a20` ring.
- Status, category and replied state are conveyed by text as well as color; the green rail and the three-line clamp have no text alternative beyond 더보기.
- Titles are real `<h2>` elements; items, pills, the reply box and the meta line are `<div>` / `<span>` with no roles or live regions.

## Not reproduced

- Fetching (`/api/feedback/my`, `/api/feedback?status&category&limit=100`), the POST / PATCH / DELETE mutations, query invalidation and the toasts they raise.
- `content.slice(0, 2000)`, the five-character minimum, `window.confirm`, the 더보기 / 접기 expand toggle and the `replyingId` logic that reveals the admin footer row only while typing; the preview hard-codes each state.
- `toLocaleDateString('ko-KR', …)`; the dates are literal strings.
- The admin page's status / category filter `<select>`s, both 돌아가기 links, the auth-guard skeletons and the `router.push('/planner')` redirect.
- The responsive chains (`p-5 sm:p-8 md:p-12`, `text-xl sm:text-2xl`, `p-4 sm:p-5`) and the page gradient behind the user cards; the preview renders the 768px-and-up values on white.

Pattern extracted from inline markup in `src/app/(dashboard)/help/feedback/page.tsx` and `src/app/(dashboard)/admin/feedback/page.tsx`; no component exists in the source
