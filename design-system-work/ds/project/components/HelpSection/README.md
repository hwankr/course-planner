The in-app help article layout: a slate gradient page with a 1024px column of white section cards, each led by a tinted icon tile and a navy heading, holding prose, comparison boxes, numbered step rows, zoomable screenshots and cyan link cards.

## Use it for / don't use it for

- Use it for explanatory pages a student reads once (사용 가이드, 졸업 정보 가이드) and for any how-to that pairs steps with a screenshot.
- Use the two-pane STEP section when each step has its own screenshot; it stacks below 1024px.
- Don't use it inside the planner or admin pages; those sit on the `gray-50` shell with Cards. The help pages are the slate side of the product and keep slate neutrals throughout.
- Don't use the guide link card for primary actions; it is a quiet navigation tile. The contact block's navy CTA is the page's one primary action.

## What the consumer provides

There is no component; each page writes the markup inline.

- Article: a header (back link, eyebrow, `h1`, optional lead) and an ordered list of sections, each with an icon tile tint (`navy`, `blue`, `cyan`, `purple`), a Lucide icon, an `h2`, paragraphs and optional comparison boxes, step rows, link cards and screenshots.
- Guide sections (graduation guide): `badge` (STEP 1 …), `title`, `description`, `steps: string[]`, `imageSrc`, `imageAlt`, `imageCaption`, image size, `icon`, `iconColorClass`, `iconBgClass` — see `FlowStep` in the types.
- Screenshots go through ZoomableImage on the help page and through a local zoom button plus lightbox on the guide.
- Container: `.cp-help` is the full-height shell; `.cp-help__inner` the `container-5xl` column with `space-4` / `space-6` gutters.

## Anatomy and states

- Shell: `linear-gradient(to bottom in oklab, slate-50, white, slate-100)`; column padding `space-6` top, `space-12` bottom, `space-4` sides, becoming `space-10` top and `space-6` sides from `md`.
- Section card: `white`, 1px `slate-200`, `radius-2xl`, `shadow-sm`, `space-6` padding (`space-7` from `md`, `space-8` for the guide header), `space-8` apart. The guide stacks its sections `space-6` apart instead.
- Back and nav links: `body-sm-medium` in `yu-cyan` (2.8:1 on white — kept, flagged) turning `yu-navy` on hover over `duration-fast`, with a 16px `arrow-left` or `external-link`. The guide header's back link is `body-sm` in `slate-600`, hovering to `yu-cyan`.
- Eyebrow: a `radius-full` pill, `space-1` × `space-3`, 12px at 600, a 14px icon — `slate-700` on `slate-100` (도움말 가이드, STEP n) or `yu-navy` on `yu-navy-a5` (졸업 정보 가이드).
- Title: 30px → 36px (`md`) bold `yu-navy`; the guide adds `tracking-tight`. Lead: `body-sm` in `slate-500`.
- Section heading: a 40px `radius-lg` tile beside the `heading-2` bold `yu-navy` heading, `space-3` apart, `space-5` below. Tiles: `yu-navy` on `yu-navy-a10`, `yu-blue` on `yu-blue-a10`, `yu-cyan` on `yu-cyan-a10`, `purple-600` on `purple-100`; icons 20px.
- Prose: 14px → 16px (`md`) at `leading-relaxed` (1.625) in `slate-600`, `space-4` below.
- Comparison boxes: two columns from `md`, `space-4` gap; each `radius-xl`, `space-4` padding — 비회원 on `slate-50` with a `slate-200` border, 회원 on `yu-cyan-a5` with a `yu-cyan-a30` border; a 16px semibold `yu-navy` title and a `body-sm` `slate-600` list whose bullets are typed "• " characters.
- Numbered rows: `slate-50` blocks, `radius-lg`, `space-3` padding, `space-3` apart; a semibold `yu-navy` "1." then the step at 14px → 16px in `slate-600`. The guide's ordered list instead puts a 20px `yu-navy` circle with a white 12px bold number beside 14px `leading-relaxed` `slate-700` text, rows `space-2` apart.
- Screenshot frame: `radius-xl`, 1px `slate-200`, clipped; the image fills the width.
- Guide link card: `yu-cyan-a5` fill, `yu-cyan-a30` border, `radius-xl`, `space-4` padding, `body-sm-medium` in `yu-navy` with a 16px `yu-cyan` `external-link`; hover deepens to `yu-cyan-a10` fill and `yu-cyan-a50` border.
- Contact block: the same cyan tint at `radius-2xl` and `space-6`, centered — a `slate-600` question over a `yu-navy` CTA (`radius-xl`, `space-2-5` × `space-6`, `body-sm-medium` white, hover `yu-blue-dark`).
- Two-pane STEP section (`lg` and up, mirrored in the preview with `.is-lg`): columns 1.05fr / 1fr; the text pane pads `space-6` → `space-7`; the media pane is `slate-50` with a `slate-200` left rule (top rule when stacked) holding a square (4:3 when stacked) zoom button whose image scales to 1.01 on hover over `duration-base`, and a `slate-900-a75` "클릭하여 확대" pill that fades in at bottom-right; below it a white caption strip with a `slate-200` top rule.
- Audit boxes: two columns from `md`, `space-3` gap, `slate-50` with `slate-200` borders, a 16px semibold `yu-navy` title over 14px relaxed `slate-600` text.

## Copy

도움말 가이드 · YU 수강 플래너 사용 가이드 · 수강 플래너의 주요 기능을 빠르게 알아보세요 · 플래너로 돌아가기 · 시작하기 · 수강 계획 세우기 · 졸업요건 추적 · 학과 통계 · 프로필 관리 · 비회원 / 회원 (• 바로 사용 가능 · • 브라우저 저장 · • 통계 공유 불가 / • Google 로그인 · • 데이터 동기화 · • 통계 공유 가능) · 영남대학교 포털에서 졸업요건 조회하는 방법 → · 궁금한 점이나 오류를 발견하셨나요? · 문의 및 피드백 보내기 · 플래너로 이동 · 졸업요건 조회 가이드 · 졸업 정보 가이드 · 영남대학교 졸업기준·취득학점 확인 방법 · STEP 1 · 홈페이지 로그인 후 포털 이동 · STEP 2 · 종합정보시스템에서 졸업모의사정 이동 · STEP 3. 졸업모의사정에서 확인할 항목 · 클릭하여 확대 · 페이지 내 이동 (nav label).

Help prose is 합니다체 with periods; step rows are "Label: sentence" without a final period. The help page writes 졸업요건 without a space and 입학년도; elsewhere the product writes 졸업 요건 and 입학연도 (see Voice and copy).

## Accessibility

- One `h1` per page, `h2` per section, `h3` in the boxes; the guide wraps its bottom links in `<nav aria-label="페이지 내 이동">`.
- The guide's zoom buttons carry `aria-label="{title} 이미지 확대 보기"`; its lightbox closes on Escape and locks body scroll. The help page's screenshots go through ZoomableImage, whose thumbnail is a clickable `<div>` with no keyboard access.
- The 비회원 / 회원 lists use typed "• " characters inside list items, so screen readers announce "bullet" before each item.
- Lucide icons render with `aria-hidden="true"`.

## Not reproduced

- The ZoomableImage lightbox on the help page and the guide's own lightbox (`slate-950-a85` backdrop, `white` 15% close chip, framed image); only the thumbnails and the guide's hover hint are shown.
- Sections 학과 통계 and 프로필 관리, the remaining screenshots, STEP 2 and two of the four audit boxes; they repeat the shown recipes.
- The guide's empty `description` and `imageCaption` strings are rendered as in the source (an empty paragraph and a 45px empty white strip), not filled in.

Pattern extracted from inline markup in `src/app/(dashboard)/help/page.tsx`, `src/app/(dashboard)/help/graduation-guide/page.tsx`; no component exists in the source
