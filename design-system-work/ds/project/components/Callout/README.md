The tinted banner the app writes inline wherever a page has to say something beside its content: eleven recipes across seven files — amber for guest mode and warnings, blue for information, red for errors, green for an admin reply — none of which shares a component.

## Use it for / don't use it for

- Use the amber family for anything a visitor can act on but has not: guest mode (layout strip, statistics guest callout), a blocked login path (in-app browser notice), a form that still needs a choice (CustomCourseForm warning strip, RequirementForm cutoff suggestion). Give it one action at most: an amber button, an underlined amber link, or both side by side.
- Use the blue family to explain scope or point to help without asking for anything (statistics data-scope callout, RequirementForm help banner, CustomCourseForm focused-semester strip).
- Use the red boxes only for a failed request, in place of the content that failed: `radius-md` and `p-3` inside a form (login), `radius-2xl` and `p-6` centered where a list would be (admin).
- Use the green reply box only inside a feedback item that has `adminReply`; the pill names the author, the box carries the text.
- Don't use a callout for transient feedback (that is `Toast`), for empty or loading states (`StatusStates`), or for a card's own header copy.

## What the consumer provides

- No props: every recipe is markup written in place and toggled by page state — `isGuest` (layout strip, statistics guest), `error: string` (login), `error` from `useQuery` (admin), `inAppInfo.isInApp` with `isIOS` and `appName: string | null` (login notice), `focusedSemester: { year; term } | null` (CustomCourseForm either/or), `showCutoffSuggestion && suggestedCutoff` (RequirementForm box), `fb.adminReply?: string` and `fb.adminReplyAt?: string` (feedback).
- Handlers: `loginWithGoogle` from `useAuth()` on the two 구글로 로그인 buttons, `openInExternalBrowser()` on 외부 브라우저에서 열기, `setPriorCutoff(\`${year}-${term}\`)` on the suggestion button; links are `next/link` to `/register` and `/help/graduation-guide`.
- Containers: the strip spans the page between the header and `<main>`; the statistics callouts sit in the `max-w-7xl` column above the filter Card; the login pieces sit inside the 448px form panel; the admin banner fills the admin content column; the two strips and the help/suggestion boxes sit inside the `space-y-4` / `space-y-5` form bodies; the reply box sits inside a feedback item on its `green-50-a30` surface.
- Placement margins the pages add (`margin-bottom: space-6` statistics, `margin-top: space-4` login notice, `margin-top: space-3` reply, `margin-bottom: space-3` suggestion) are page rhythm and are not in the block.

## Anatomy and states

- Statistics guest (`.cp-callout--stat-guest`): fill `amber-50`, 1px `amber-200` border, `radius-lg`, padding `space-4`; row `flex items-start gap: space-3`; LogIn `icon-lg` in `amber-600` with `margin-top: space-0-5` (3.1:1 on the fill, passes the icon bar); body `flex: 1`; title `body-sm-medium` in `amber-900` (8.7:1), `margin-bottom: space-1`; text `body-sm` in `amber-800` (6.8:1), `margin-bottom: space-3`; actions `flex items-center gap: space-3`. Button: padding `space-2` × `space-4`, fill `amber-600`, `white` label `body-sm-medium`, `radius-lg`, `transition-colors` over `duration-fast`; hover `amber-700`. `white` on `amber-600` is 3.2:1 in the source — kept, flagged; hover reaches 5.0:1. Link: `body-sm-medium` in `amber-900`, underlined, hover `amber-700` (4.9:1), no transition.
- Statistics info (`.cp-callout--stat-info`): fill `blue-50`, 1px `blue-200`, `radius-lg`, padding `space-4`; Info `icon-lg` in `yu-blue` (5.1:1); body `body-sm` in `gray-700` (9.5:1) with `space-1` between paragraphs; first line weight 500 in `gray-900`; `<strong>` 700.
- Login error (`.cp-callout--login-error`): padding `space-3`, fill `red-50`, 1px `red-200`, `radius-md`, text `body-sm` in `red-600` — 4.4:1 in the source, kept, flagged.
- Admin error (`.cp-callout--admin-error`): padding `space-6`, same `red-50` / `red-200` / `red-600` pair (flagged), `radius-2xl`, centered.
- Guest strip (`.cp-callout--guest-strip`): fill `amber-50`, 1px `amber-200` bottom border only; inner `.cp-callout__strip-inner` is Tailwind's `container` (centered, breakpoint max-widths) with padding `space-2` × `space-4`, `flex items-center justify-between flex-wrap gap: space-2`; AlertTriangle `icon-md` in `amber-800`; text `caption` in `amber-800`, `body-sm` from 640px; actions `gap: space-3`, a `<button>` and a `<Link>` both `body-sm-medium` `amber-900` underlined, hover `amber-700`.
- Form strips (`.cp-callout--form-info` / `--form-warning`): the `<p>` itself, padding `space-2` × `space-3`, `radius-md`, `body-sm`, no border. Info `blue-600` on `blue-50` (4.8:1) with the semester in weight 500; warning `amber-600` on `amber-50` — 3.1:1 in the source, kept, flagged.
- Requirement help (`.cp-callout--req-help`): `flex items-center gap: space-2`, padding `space-2` × `space-3`, fill `blue-50`, 1px `blue-100`, `radius-md`, text `caption` in `gray-500` — 4.4:1, flagged; HelpCircle `icon-sm` in `yu-cyan` (2.5:1, misses the icon bar, flagged); link `yu-cyan` underlined (2.5:1, flagged), hover `yu-navy` (10.3:1), no transition.
- Requirement suggestion (`.cp-callout--req-suggest`): padding `space-2` × `space-3`, fill `amber-50`, 1px `amber-200`, `radius-md`, `caption` text in `amber-800`; button `margin-top: space-1-5`, padding `space-1` × `space-2`, `caption-medium` in `amber-800` on `amber-100` (6.4:1), 1px `amber-300`, `radius-sm`, `transition-colors`; hover `amber-200` (5.7:1).
- Reply (`.cp-callout--reply`): padding `space-3`, fill `white`, 1px `green-200`, `radius-lg`; head `flex items-center gap: space-1-5`, `margin-bottom: space-1-5`; pill padding `space-0-5` × `space-2`, `radius-full`, `green-100` fill, `green-700` text at 600 12px (4.5:1); date `caption` in `slate-400` — 2.6:1 on white, kept, flagged; text 14px/1.625 in `slate-700` (10.4:1), `white-space: pre-wrap`.
- In-app notice (`.cp-callout--inapp`): padding `space-4`, fill `amber-50`, 1px `amber-200`, `radius-lg`; title `body-sm-medium` in `amber-800`, `margin-bottom: space-2`; iOS hint `caption` in `amber-700` (4.9:1) with 700-weight runs; Android button full width, `margin-top: space-1`, padding `space-2` × 0 (36px tall), `body-sm-medium` in `amber-900` on `amber-100` (8.1:1), `radius-md`, `transition-colors`, hover `amber-200` (7.3:1).
- Every container hairline (`amber-200`, `blue-200`, `blue-100`, `red-200`, `green-200`, `amber-300`) sits at 1.1–1.5:1 on its fill; the fill carries the tone, the line is decorative.
- No recipe styles `:focus`, `:active` or `:disabled`; no button sets `cursor-pointer`.

## Copy

- Layout strip: `비회원 모드입니다. 데이터가 이 브라우저에만 저장됩니다.` · `구글로 로그인` · `회원가입하기`.
- Statistics guest: `회원가입하고 다른 학생들도 통계를 볼 수 있도록 도와주세요!` · `로그인하면 나의 수강 계획이 통계에 반영되어, 같은 학과 학생들이 더 정확한 데이터를 참고할 수 있습니다.` · `구글로 로그인` · `회원가입하기`.
- Statistics info: `이 페이지는 어떤 데이터를 보여주나요?` · `{departmentName} 소속 학생들이 작성한 수강 계획을 분석한 결과입니다. 직접 추가한 과목(커스텀 과목)은 통계에서 제외되며, 공식 교과목만 집계됩니다.`
- Login error: `LOGIN_FAILURE_MESSAGE` = `이메일 또는 비밀번호가 올바르지 않습니다. 잠시 후 다시 시도해주세요.`
- Login notice: `{appName || '앱'} 내 브라우저에서는 Google 로그인이 지원되지 않습니다.` (appName: 카카오톡, 에브리타임, 인스타그램, Facebook, 네이버, LINE, 다음, 삼성 인터넷, Twitter, TikTok, 밴드) · iOS `하단의 ꞏꞏꞏ 또는 공유 버튼을 눌러 "Safari로 열기"를 선택해주세요.` · Android `외부 브라우저에서 열기`.
- Admin: `과목 목록을 불러오는데 실패했습니다.`
- CustomCourseForm: `{year}학년 {1학기|2학기}에 바로 추가됩니다.` · `학기를 먼저 클릭하여 포커스하면 해당 학기에 바로 추가됩니다.`
- RequirementForm: `졸업 기준과 취득 학점을 잘 모르시나요? 확인 방법 보기` · `계획에 ‘이수’ 과목이 있습니다. 해당 학기가 기이수(성적표)에 이미 반영되어 있다면, 기준 학기를 설정해야 중복 합산되지 않습니다.` or `기이수 학점을 수정했습니다. 성적표에 새로 반영된 학기가 있다면 기준 학기도 함께 올려주세요.` · `{suggestedCutoff.label}까지로 설정`.
- Feedback: `관리자 답변` · date via `toLocaleDateString('ko-KR', { year, month: 'short', day, hour, minute })`.

## Accessibility

- Every recipe is a plain `<div>` or `<p>`: none carries `role="alert"`, `role="status"` or `aria-live`, so the login and admin errors, the in-app notice and the suggestion box appear without announcement.
- Icons are lucide-react SVGs passed only a `className`; the pages add no `aria-hidden`, `title` or `aria-label`, so the icons' exposure is whatever the library renders.
- Actions are native `<button>`s (the two 구글로 로그인 buttons set no `type`; the suggestion and Android buttons set `type="button"` inside their forms) and `next/link` anchors; all are Tab-reachable with Enter/Space, with only the browser's default focus outline and the default cursor.
- Emphasis: the department name is a real `<strong>`; the `font-medium` semester and the `font-bold` iOS runs are `<span>`s with no semantics.
- Contrast misses listed above: `white` on `amber-600`, `red-600` on `red-50` (twice), `amber-600` on `amber-50`, `gray-500` and `yu-cyan` on `blue-50`, `slate-400` on `white`.

## Not reproduced

- The conditions that show each banner: `isGuest`, a failed `login()`, `useQuery` errors, `detectInAppBrowser()` on `navigator.userAgent` plus the Android auto-redirect on mount, the `focusedSemester` ternary, `showCutoffSuggestion` (edited earned credits versus `suggestedCutoff`), and the presence of `adminReply`.
- Click behavior: Google sign-in, the `intent://` redirect, `setPriorCutoff`, and client-side navigation of the links.
- Data: `departmentName`, `appName`, `suggestedCutoff.label`, `adminReply` and the `ko-KR` date are sample values; the strip's 12px → 14px step cannot be seen at 960px.
- Hover is shown at rest through `.is-hover` on the strip's 회원가입하기 link and the Android button; the real `:hover` also works in the preview.

Pattern extracted from inline markup in `src/app/(dashboard)/statistics/page.tsx`, `src/app/(dashboard)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(dashboard)/admin/courses/page.tsx`, `src/app/(dashboard)/help/feedback/page.tsx`, `src/components/features/CustomCourseForm.tsx`, `src/components/features/RequirementForm.tsx`; no component exists in the source
