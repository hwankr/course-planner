A fixed bottom-center stack of up to three white cards with a colored left rail, each carrying a one-line message, an optional description or graduation-progress rows, an optional text action and a close X, auto-dismissed after `duration` ms.

## Use it for / don't use it for

- Use it for the outcome of an action the user just took: success after a create / update / delete (졸업요건이 생성되었습니다., 과목이 삭제되었습니다., PNG 이미지로 내보내기 완료), warning for a failed mutation or a missing required field (`err.message`, 제목과 시작일은 필수입니다.), info for neutral notices (실행 취소됨, 계획이 초기화되었습니다., 로그인 후 이용할 수 있는 기능입니다.).
- Use the `graduationDelta` form only from the planner: adding a course raises a success toast with 실행 취소 and two mini progress rows showing the category and the total or 전공핵심 before and after.
- Don't use it for errors that need reading time or a decision; the app uses inline banners and `window.confirm` for those. Don't rely on it for critical state: the store keeps three toasts and drops the oldest.

## What the consumer provides

- The component takes no props. It reads `useToastStore()` and renders `null` when `toasts` is empty; mount it once near the root.
- `addToast(toast: Omit<Toast, 'id'>): string` with:
  - `message: string` — the headline.
  - `type: 'success' | 'info' | 'warning'` — rail and action color.
  - `description?: string` — second line; ignored when `graduationDelta` is set. No call site in the app passes it.
  - `graduationDelta?: { creditsDelta: number; categoryLabel: string; categoryPct?: { before: number; after: number }; categoryCredits?: { after: number; required: number }; secondRowLabel: string; secondRowPct: { before: number; after: number }; secondRowCredits: { after: number; required: number } }`.
  - `action?: { label: string; onClick: () => void }` — runs `onClick`, then removes the toast.
  - `duration?: number` — default `5000`; the planner uses 1500 for 실행 취소됨, exports 3000.
- Container: none. The component positions itself with `position: fixed`; nothing else should wrap it.

## Anatomy and states

- Stack viewport: `position: fixed`, `bottom: space-4`, full width, `z-modal` (50), `pointer-events: none` so the gap between toasts does not block the page.
- Stack list: flex `column-reverse` with `gap: space-2`; margin `0 space-3` below 640px, `margin: 0 auto` and `max-width: container-sm` (384px) from `sm`. The store appends the newest toast last, so it renders on top; the oldest sits at the bottom and is dropped when a fourth arrives.
- Toast card: fill `white`, `radius-lg`, `shadow-lg`, 1px `gray-200` border with a 4px left rail, padding `space-3`, `pointer-events: auto`. Enters with `cp-fade-in-up` (`duration-enter-long`, from `translateY(20px)` and opacity 0, CSS keyword `ease-out`); `prefers-reduced-motion` removes the animation. The `gray-200` hairline is 1.2:1 on white and 1.2:1 on `gray-50` in the source — kept, flagged.
- Rail by type: success `green-500` (2.2:1 on white), info `yu-blue` (5.5:1), warning `amber-500` (2.1:1). The green and amber rails miss 3:1 for a meaning-carrying edge — kept, flagged.
- Message: `body-sm-medium` (500 14px/20px `font-body`) in `gray-900` (17.8:1), `truncate` to one line.
- Description: `caption` (400 12px/16px) in `gray-500` (4.8:1), `margin-top: space-0-5`.
- Delta block: `margin-top: space-1`, rows `space-1` apart. Each row is flex, centered, `gap: space-1-5`, `caption` size.
  - Label `gray-500` (4.8:1), width `space-7` (28px) on the first row (전공 or 교양), `width: auto` on the second (전공핵심 or 전체).
  - Track: flex-grow, height `progress-track` (6px), fill `gray-200`, `radius-full`, overflow hidden. The "after" bar lies absolute behind, the "before" bar on top: first row `yu-blue` over `yu-blue-a40`, second row `green-500` over `green-300`. On the track the `yu-blue` bar reads 4.5:1 and the `yu-blue-a40` extension 1.7:1; `green-500` 1.8:1 and `green-300` 1.1:1 — kept, flagged.
  - Value: `micro-10` size (10px, inheriting the row's 1.333 line-height ratio, 13.33px) in `gray-400`, width `space-16` (64px), right-aligned; 2.6:1 on white — kept, flagged. Text is `after/required` when credits are given, else `before→after%`.
- Actions cluster: flex, centered, `gap: space-1`, no shrink.
- Action button: `caption-medium` (500 12px/16px), padding `space-1` × `space-2`, `radius-md`, transparent, `transition-colors` (`duration-fast`, `ease-standard`); hover fill `gray-50`. Text by type: success `green-600` (3.2:1 on white — kept, flagged) → `green-700` on hover (4.7:1 on `gray-50`); info `yu-navy` (11.2:1) → `yu-navy-hover` (10.1:1); warning `amber-600` (3.2:1 — kept, flagged) → `amber-700` (4.8:1). No pointer cursor (Tailwind v4 preflight).
- Close button: padding `space-0-5`, `gray-400` (2.6:1, misses 3:1 for an icon — kept, flagged), hover `gray-600` (7.6:1), `transition-colors`; holds the `icon-md` (16px) heroicons-v1 X filled with `currentColor`.

## Copy

- `닫기` — `aria-label` of the close button, the only aria string the component owns.
- First-row delta label: `전공` when `categoryLabel` starts with 전공, otherwise `교양`. Second-row label from the planner: `전공핵심` or `전체`.
- Messages the app passes: 자료구조 추가됨 · +3학점 전공핵심 (pattern `${name} 추가됨 · +${credits}학점 ${category}`) · 실행 취소됨 · 계획이 초기화되었습니다. · 로그인 후 이용할 수 있는 기능입니다. · PNG 이미지로 내보내기 완료 · PDF 문서로 내보내기 완료 · 내보내기에 실패했습니다. · 졸업요건이 생성되었습니다. · 사용자 역할이 변경되었습니다. · 일정 저장에 실패했습니다. · 제목과 시작일은 필수입니다. · 문의가 성공적으로 제출되었습니다.
- Action label: `실행 취소` (the only one in the app).

## Accessibility

- The close button has `aria-label="닫기"`. The SVG carries no `aria-hidden="true"`, but as the child of a `<button aria-label="닫기">` it is not announced separately; the control reads as 닫기.
- Nothing announces a toast: no `role="status"`, `role="alert"`, `aria-live` or `aria-atomic` on the stack or the card, so screen readers learn of it only by chance.
- Toasts dismiss on a timer with no pause on hover or focus and no way to extend `duration` from the UI; the action and close buttons are native `<button>`s and keyboard-reachable while the toast lives.
- Focus is not moved into the toast and not returned anywhere on dismiss.
- The progress bars carry no text alternative beyond the adjacent counter; the before/after distinction is color-only.
- Hover colors on the action and close buttons use `transition-colors`; the entrance animation honors `prefers-reduced-motion` through globals.css.

## Not reproduced

- The zustand store: `addToast` id generation, the three-toast cap, the `setTimeout` auto-dismiss and `removeToast` on action or close.
- `action.onClick` and the 실행 취소 undo flow.
- The `fixed` viewport pinning: the preview uses the `--inline` mirror so the stack sits inside a `gray-50` stage.
- The `before→after%` counter fallback (the planner always supplies credits).
- Hover is shown at rest through `.is-hover`; the real pointer states also work in the preview.

Static rendition hand-translated from `src/components/ui/Toast.tsx` and `src/stores/toastStore.ts`.
