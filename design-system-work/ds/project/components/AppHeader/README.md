The dashboard shell header: a 4px yu-navy → yu-blue → yu-cyan accent bar over a 64px white bar holding the colour YU logo with the gradient wordmark, icon-and-label nav pills with a 더보기 dropdown, the notification bell with its unread badge and panel, and the gradient-initial user menu (or two small Buttons for guests), plus the amber warning banner that follows the header in guest mode and the collapsible mobile menu below md.

## Use it for / don't use it for

- Use it once, as the top of every `(dashboard)` route: `DashboardLayout` renders the shell root (`bg-gray-50 bg-grid`), the accent bar, the header, the guest banner, then `<main class="container mx-auto px-3 py-4 sm:px-4 sm:py-8">` and the Toast portal.
- Reuse the pill recipe only for top-level routes; secondary routes (도움말, 문의 및 건의, 업데이트 소식) live in the 더보기 dropdown, and 관리자 appears only when `!isGuest && isAdmin`.
- Don't make it sticky or fixed (the app scrolls it away), don't add a second bell, and don't put the guest banner anywhere but directly under the header.

## What the consumer provides

- `DashboardLayout({ children }: { children: React.ReactNode })` is the only prop. Everything else comes from hooks: `usePathname()` for the current route and `useAuth()` for `user`, `isAuthenticated`, `isAdmin`, `isGuest`, `logout`, `loginWithGoogle`.
- Nav data is three module constants of `{ name: string; href: string; icon: LucideIcon }`: `primaryNavigation` (수강 계획 `/planner`, 학사 일정 `/calendar`, 학과 통계 `/statistics`), `secondaryNavigation` (도움말 `/help`, 문의 및 건의 `/help/feedback`, 업데이트 소식 `/patch-notes`), `adminNavigation` (관리자 `/admin`).
- Notifications: TanStack `useQuery` on `/api/notifications/unread-count` (`refetchInterval` 30000, `staleTime` 10000) and on `/api/notifications` while the panel is open; rows are `NotificationItem { id; type; message; href; createdAt }`; `useMutation` POSTs `/api/notifications/mark-read`. Both run only when `isAuthenticated && !isGuest`.
- Container: the page body. The shell spans the viewport; its content sits in a Tailwind `container mx-auto px-4` (100% wide, capped at 640 / 768 / 1024 / 1280 / 1536px at sm / md / lg / xl / 2xl).

## Anatomy and states

- Shell root: fill `gray-50` with `.bg-grid`, two 1px `black-a3` hairlines on a 40px cell; type `body` (16px / 1.5 `font-body`) in `foreground`.
- Accent bar: height `space-1`, `linear-gradient(to right in oklab, yu-navy, yu-blue, yu-cyan)`.
- Header bar: fill `white`, `shadow-sm`, 1px bottom hairline in `foreground` (the bare `border-b` takes currentColor and nothing above it sets a text colour). Row: flex, `space-16` (64px) tall, `gap: space-2`, space-between.
- Left cluster: `gap: space-3`, `space-8` from md; `flex: 1 1 0%` with `min-width: 0`. Only the brand link may shrink (`shrink min-w-0`), so the wordmark truncates first: the nav is fixed at about 422px (student) or 516px (admin). At a 960px viewport the container is 768px and the student row needs about 890px, so between md and lg the wordmark collapses to nothing and only the logo shows; from lg (1024px) both rows fit. Kept exact; the preview lifts the cap.
- Logo: `yu-logo.svg` (next/image 60×24, `width: auto`) at `space-5` (20px), `space-6` from md, about 125px wide; alt `영남대학교`.
- Wordmark: weight 700 at 14/20px, 16/24 from sm, 20/28 from md (the `heading-3` size in bold); `.text-gradient` = `linear-gradient(135deg, yu-navy, yu-blue, yu-cyan)` clipped to text, `truncate`. The `yu-cyan` end is 2.8:1 on white, under the 3:1 large-text floor — kept, flagged.
- Nav (md+ only): flex, `gap: space-1`, `flex-shrink: 0`. Pill: flex, `gap: space-2`, padding `space-2` × `space-3`, `radius-md`, `body-sm-medium`, `whitespace-nowrap`, `transition-colors` (`duration-fast`, `ease-standard`); Lucide icon at `icon-md`. At rest `gray-600` (7.6:1); hover fill `gray-50`, text `gray-900` (`.is-hover`). Current route (`pathname === href`): fill `yu-navy-a10`, text `yu-navy` (9.4:1), weight 600, no hover change (`.is-current`).
- 관리자 pill (`--admin`, current when `pathname.startsWith('/admin')`): fill `purple-50`, text `purple-600` (5.2:1), weight stays 500.
- 더보기 button (`--more`): the same pill with `gap: space-1-5` and a `chevron-down` at `icon-sm` that turns 180° (`transition-transform`) while open (`.is-open`); current when any secondary route matches (`===` or `startsWith(href + '/')`).
- Dropdowns (`role="menu"`, rendered only while open): `position: absolute; right: 0; margin-top: space-1`, fill `white`, `radius-lg`, `shadow-lg`, 1px `foreground` border, padding `space-1` × 0, `z-modal`. Widths 176px (더보기, `w-44`), 192px (user, `w-48`), `container-xs` 320px (알림, `sm:w-80`); below sm the 알림 panel is `fixed` with `space-2` insets. Items: flex, `gap: space-2`, padding `space-2-5` × `space-4`, `body-sm` in `gray-600`; hover fill `gray-50` only; current fill `yu-navy-a10`, `yu-navy`, weight 600.
- Bell (signed in, not guest): inline `<button>`, padding `space-1-5`, `radius-full`, hover fill `gray-100` (`.is-hover`), `cursor: pointer`; it is the one inline-level control in the row and sits half a pixel above the row's centre. Icon `icon-lg`: `gray-400` at zero unread (2.6:1, misses 3:1 — kept, flagged), `gray-700` once unread (`--unread`).
- Badge (unread > 0, `99+` past 99): absolute at −`space-1` top and right, min-width and height 18px, padding 0 `space-1`, `radius-full`, `micro-10` at weight 700. Student `red-500` / `white` (3.8:1 — kept, flagged); admin (`--admin`) `yellow-400` / `yellow-900` (5.5:1).
- 알림 panel: head flex space-between, padding `space-2-5` × `space-4`, 1px `foreground` bottom hairline; title `body-sm-semibold` in `gray-900`; 모두 읽음 (only while unread > 0) `caption-medium` in `yu-cyan` (2.8:1 — kept, flagged), `yu-navy` on hover, `check-check` at `icon-sm`, `cursor: pointer`. List `max-height: container-xs`, scrolls. Row: flex start, `gap: space-3`, padding `space-3` × `space-4`, hover `gray-50`, 1px `gray-50` separator (invisible on white — kept) except on the last. Chip `icon-2xl` round with `margin-top: space-0-5`: `patch-note` `purple-100` with `megaphone` in `purple-600` (4.7:1), `feedback-new` `yellow-100` with `message-square-text` in `yellow-600` (2.7:1 — kept, flagged), any other type `blue-100` with `message-square-text` in `blue-600` (4.3:1). Message `body-sm` in `gray-700`; time `caption` in `gray-400` with `margin-top: space-0-5` (2.6:1 — kept, flagged). Empty: padding `space-8` × `space-4`, centred `bell` at `icon-2xl` in `gray-300`, 알림이 없습니다. in `body-sm` `gray-500` with `margin-top: space-2`.
- User button (signed in with `user.name`): flex, `gap: space-2`, padding `space-1`, `radius-full`, hover fill `gray-50` (`.is-hover`). Avatar `icon-2xl` round, `linear-gradient(to bottom right in oklab, yu-navy, yu-blue)`, `caption-medium` in `white` holding `name.charAt(0)`; name `body-sm` in `gray-600`, max-width 100px, truncate, sm+ only; `chevron-down` at `icon-sm` in `gray-400`, sm+ only, rotates while open. Menu head: padding `space-2` × `space-4`, 1px `foreground` hairline, the name in `body-sm-medium` `gray-900`, truncate; items 프로필 (`user`, current on `/profile`) and 로그아웃 (`log-out`, a full-width left-aligned `<button>`).
- Guest actions: `Button variant="ghost" size="sm"` 구글 로그인 and `Button variant="default" size="sm"` 회원가입 inside a bare `Link`, both with `className="text-xs sm:text-sm whitespace-nowrap"` (12/16px below sm). Signed in without a name: a ghost sm 로그아웃.
- Guest banner (`isGuest`): fill `amber-50`, 1px `amber-200` bottom hairline; inner container with `space-2` vertical padding, flex-wrap, space-between, `gap: space-2`. `alert-triangle` at `icon-md` and the text in `amber-800` (6.8:1), `caption` size, `body-sm` from sm; links 구글로 로그인 (`<button>`) and 회원가입하기 (`Link`) in `body-sm-medium` `amber-900` (8.7:1), underlined, hover `amber-700` (4.9:1), no transition, `gap: space-3`.
- Mobile toggle (below md): padding `space-2`, `radius-md`, `gray-600`, hover `gray-100`, `menu` / `x` at `icon-xl`. Mobile menu: 1px `foreground` top hairline, `fadeInDown` (`duration-enter`, from −20px, none under reduced motion), a column with `gap: space-1` inside the container with `space-2` vertical padding. Items keep the pill colours with padding `space-3` all round; the 고객 지원 accordion (`help-circle`, `chevron-down` at `icon-md`, space-between, `aria-expanded`) opens a list indented `space-4` whose items are weight 400 in `gray-500` with padding `space-2-5` × `space-3`; `foreground` separators with `space-1` margins; then 프로필 and a 로그아웃 `<button>` without transition.

## Copy

- Wordmark `YU 수강 플래너`; logo alt `영남대학교`; bell `title="알림"`; mobile toggle `aria-label="Toggle menu"`.
- Nav: `수강 계획` · `학사 일정` · `학과 통계` · `관리자` · `더보기` → `도움말` · `문의 및 건의` · `업데이트 소식`; mobile group `고객 지원`.
- Panel: `알림`, `모두 읽음`, `알림이 없습니다.`; times `방금 전`, `N분 전`, `N시간 전`, `N일 전`, then `M월 D일` (`toLocaleDateString('ko-KR')`). Messages come from the API: `새로운 업데이트: {title}`, `문의에 답변이 달렸습니다.`, `새로운 피드백이 등록되었습니다.` / `새로운 문의이 등록되었습니다.`.
- User menu: the name, `프로필`, `로그아웃`. Guest: `구글 로그인`, `회원가입`; banner `비회원 모드입니다. 데이터가 이 브라우저에만 저장됩니다.`, `구글로 로그인`, `회원가입하기`.

## Accessibility

- `<header>` and `<nav>` landmarks; the three menu triggers carry `aria-expanded` and `aria-haspopup="true"`, their panels `role="menu"` and items `role="menuitem"`; a document `mousedown` outside a menu or Escape closes all three. Focus is neither moved into nor trapped in a panel, and arrow keys do nothing.
- No `aria-current` on the current pill: the state is colour and weight only. The bell's only name is its `title`; the badge count is plain text. Lucide icons are not `aria-hidden`.
- The mobile toggle has an English `aria-label` and no `aria-expanded`; the 고객 지원 accordion has `aria-expanded`.
- No focus styles anywhere; buttons and links rely on the browser's default ring. Only the bell and 모두 읽음 set `cursor: pointer`.

## Not reproduced

- Route matching, the three `useState` menus, the outside-click and Escape handling; the preview shows each panel open at rest with `.is-open` on its trigger.
- The unread-count poll, the notification fetch and `markAllRead`; counts, rows and the user are static samples.
- `next/image` loading and `Link` prefetching; the mobile toggle, the mobile menu and its `fadeInDown` entrance (documented above, not rendered); the `fixed` full-width 알림 panel below sm.
- The 768px container cap at this viewport (see Anatomy); the preview lifts it so the row shows untruncated.

Pattern extracted from inline markup in `src/app/(dashboard)/layout.tsx`; no component exists in the source
