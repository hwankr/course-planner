// Builds ds/project/tokens.json for the Course Planner design system.
// Values: Tailwind CSS v4.1.18 defaults (theme.css → sRGB hex via tools/oklch2hex.mjs) plus the
// arbitrary hex values hard-coded in the codebase. Usage notes name where each value is used.
import fs from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname);
const tw = JSON.parse(fs.readFileSync(path.join(here, '../vendor/tw-hex.json'), 'utf8'));
const OUT = path.join(here, '../ds/project/tokens.json');

const c = (name, value, usage) => ({ name, value, usage });
const p = (name, usage) => {
  if (!tw[name]) throw new Error('unknown tailwind color ' + name);
  return c(name, tw[name], usage);
};
const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

// ---------------------------------------------------------------- colors
const colors = [
  // ---- Brand (hard-coded hex in the codebase; no Tailwind names exist for these)
  c('yu-navy', '#153974', 'Primary brand blue. Headline accents and links on white (11.2:1) and gray-50 (10.7:1); active nav, selected-option and inactive filter-chip text sit on its own yu-navy-a10 tint (9.4:1); solid fills (bg-[#153974]) carry white text; first stop of the primary Button gradient. 116 text uses (26 of them hover:), 26 solid fills; the other 39 bg-[#153974] matches are the /5, /10, /20 and /90 tints (yu-navy-a5 … yu-navy-a90).'),
  c('yu-blue', '#3069b3', 'Second stop of the primary Button gradient (from yu-navy to yu-blue); info rail on Toast; progress fills; spinner arcs (border-b-2 border-[#3069B3] in the planner, CourseCatalog and OnboardingGuard), the border-2 outline buttons and the hover border of plan-pick cards in statistics and AllPlansModal, and the onboarding card\'s top accent (border-t-4). As text on white 5.5:1.'),
  c('yu-cyan', '#00aaca', 'Accent. Keyboard focus ring on inputs and selects (ring-[#00AACA]), accent borders, deco dots, the decorative underline and ring shapes. 2.8:1 on white — decorative and ring use only, never text at any size for new work (below 3:1 even for large text); the product still uses it for some links and labels (help back links, the 과목 추가 fill under white text) — kept, flagged. The 2px ring misses 3:1 on white: kept exact from source, flagged.'),
  c('yu-navy-hover', '#003e7e', 'Hover fill of solid yu-navy buttons (hover:bg-[#003E7E] on the error / not-found pages, ErrorBoundary and the CourseCatalog add buttons), hover start of the primary Button gradient (hover:from-[#003E7E]) and Toast info action hover text; also the resting start stop of the login/register brand-panel gradient (from-[#003E7E] via-[#153974] to-[#3069B3]). 10.6:1 on white.'),
  c('yu-navy-dark', '#1a2f5a', 'End stop of the landing hero background gradient (from-[#0a1e3d] via-[#153974] to-[#1a2f5a], page.tsx:166); the dark flow section uses landing-navy-stop to yu-navy instead.'),
  c('yu-navy-darker', '#0f2a57', 'Hover fill of the admin patch-notes primary button (bg-[#153974] hover:bg-[#0f2a57]).'),
  c('yu-navy-deepest', '#0a1e3d', 'Start stop of the landing hero background gradient (from-[#0a1e3d], page.tsx:166) and, at /60 and /80, of the hero wash over the screenshot mosaic; the dark flow section starts from landing-navy-stop instead. The darkest brand value, 16.6:1 with white.'),
  c('yu-blue-dark', '#1a4a8f', 'Hover fill of the help and feedback primary buttons (hover:bg-[#1a4a8f]), the feedback mail tile gradient end and the terms back-link hover. 8.7:1 on white.'),
  c('yu-blue-dark-alt', '#1a4a94', 'Hover fill of the admin requirements primary button (hover:bg-[#1a4a94]). Near-duplicate of yu-blue-dark (#1a4a8f) — treat as the same role; prefer yu-blue-dark in new work.'),
  c('yu-theme-color', '#154878', 'PWA theme_color from manifest.ts: browser chrome and status bar in the installed app. Not used in page styles.'),
  c('yu-cyan-light', '#4dd9f0', 'First and last stop of .text-gradient-typing (the landing hero typewriter line, page.tsx:211).'),
  c('yu-tint-sky', '#f0f7ff', 'Landing page light gradient via stop (from-white via-[#f0f7ff] to-[#e8f4fd]) behind the closing CTA section (section#features, 수강 계획을 시작하세요); the feature rows above sit on plain white.'),
  c('yu-tint-ice', '#e8f4fd', 'Landing page light gradient end stop (to-[#e8f4fd]).'),
  c('gradient-typing-blue', '#60a5fa', 'Stop of .text-gradient-typing only (landing hero typewriter headline).'),
  c('gradient-typing-violet', '#a78bfa', 'Stop of .text-gradient-typing only (landing hero typewriter headline). The one violet in the brand palette; do not reuse elsewhere.'),
  c('footer-navy', '#0d2654', 'Footer body background (bg-[#0d2654]) — darker than yu-navy; the landing hero and flow gradients start darker still (yu-navy-deepest, landing-navy-stop). White, gray-400 and gray-500 text sit on it; gray-500 fine print reaches only about 3.1:1 (kept exact, flagged).'),
  c('landing-navy-stop', '#0f2847', 'Landing page diagonal section gradient start (from-[#0f2847] to-[#153974], bg-gradient-to-br, clip-diagonal-both).'),
  c('progress-hatch-dark', '#93c5fd', 'Dark stripe of PLANNED_STRIPES in RequirementsSummary: the hatched 예정 (planned credits) segment of every StackedBar (total, 전공, 핵심 sub-rows, 복수전공, 부전공, 교양) and its legend swatch (repeating-linear-gradient 135deg, 3px stripes repeating every 6px). A Tailwind v3 blue-300 value kept as a literal.'),
  c('progress-hatch-light', '#dbeafe', 'Light stripe of PLANNED_STRIPES, the hatched 예정 (planned) segment of the RequirementsSummary stacked bars and its legend swatch. A Tailwind v3 blue-100 value kept as a literal.'),
  // ---- Brand alpha steps (the /N opacity modifiers used on the brand hex values)
  c('yu-navy-a5', '#1539740d', 'bg-[#153974]/5: planned CourseCard surface, focused SemesterColumn header, subtle brand chips.'),
  c('yu-navy-a10', '#1539741a', 'bg-[#153974]/10: selected option in SearchableSelect, inactive filter chips in CourseCatalog and the planner (the active chip is solid yu-navy with white text), active dashboard nav items, selected AddSemesterDialog options, brand icon wells (27 uses). Pair with yu-navy text.'),
  c('yu-navy-a20', '#15397433', 'border-[#153974]/20: planned CourseCard border; bg-[#153974]/20 hover of brand-tinted chips.'),
  c('yu-navy-a30', '#1539744d', 'shadow-[#153974]/30: tinted shadow-lg under the current onboarding step circle (onboarding/page.tsx:291, 307); via-[#153974]/30: middle stop of the landing hero wash (page.tsx:186). The landing CTA\'s tinted shadow is .shadow-glow (rgba(21,57,116,0.2)), not this.'),
  c('yu-navy-a60', '#15397499', 'text-[#153974]/60: muted brand caption.'),
  c('yu-navy-a90', '#153974e6', 'bg-[#153974]/90: the "클릭하여 확대" hint pill over ZoomableImage thumbnails.'),
  c('yu-cyan-a5', '#00aaca0d', 'bg-[#00AACA]/5: SemesterColumn drop-target wash while a course is dragged over it.'),
  c('yu-cyan-a10', '#00aaca1a', 'bg-[#00AACA]/10: cyan icon wells and hover tints.'),
  c('yu-cyan-a20', '#00aaca33', 'focus:ring-2 focus:ring-[#00AACA]/20 together with focus:border-[#00AACA]: the soft focus ring on admin and form inputs (43 uses) — the most common focus treatment after Input\'s solid ring.'),
  c('yu-cyan-a30', '#00aaca4d', 'border-[#00AACA]/30: outline of the three cyan-washed callout boxes on the help page (with bg-[#00AACA]/5, on white); bg-[#00AACA]/30: the blurred, skewed highlighter bar under the hero typewriter line (page.tsx:214).'),
  c('yu-cyan-a50', '#00aaca80', 'ring-[#00AACA]/50: SemesterColumn drop-target ring (isOver); border-[#00AACA]/50.'),
  c('yu-blue-a10', '#3069b31a', 'bg-[#3069B3]/10: the two yu-blue icon wells on the help page (Calendar and BarChart3 icons in text-[#3069B3]) and the blurred blue orb in the landing hero (w-96 h-96 blur-3xl).'),
  c('yu-blue-a40', '#3069b366', 'bg-[#3069B3]/40: the "after" bar behind the yu-blue "before" bar in the Toast graduation delta.'),
  // ---- Landing-page decorative alphas (globals.css utilities and page.tsx orbs)
  c('yu-navy-a8', '#15397414', '.deco-number: the 1.5px outline stroke of the giant 01–04 numerals on white (rgba(21,57,116,0.08)).'),
  c('yu-navy-a15', '#15397426', '.bg-mesh first radial stop (rgba(21,57,116,0.15)); hero wash via stop at 30% is yu-navy-a30.'),
  c('yu-blue-a8', '#3069b314', '.bg-mesh fourth radial stop (rgba(48,105,179,0.08)).'),
  c('yu-blue-a12', '#3069b31f', '.bg-mesh second radial stop (rgba(48,105,179,0.12)).'),
  c('yu-cyan-a6', '#00aaca0f', '.bg-mesh fifth radial stop (rgba(0,170,202,0.06)).'),
  c('yu-cyan-a8', '#00aaca14', 'bg-[#00AACA]/[0.08]: the blurred cyan orbs behind the hero and the closing CTA.'),
  c('yu-cyan-a15', '#00aaca26', '.deco-ring: the 2px ring stroke of the 400px / 200px decorative circles (rgba(0,170,202,0.15)).'),
  c('yu-cyan-a40', '#00aaca66', '.text-gradient-typing drop-shadow (0 0 20px rgba(0,170,202,0.4)) under the hero typewriter line.'),
  c('yu-navy-deepest-a60', '#0a1e3d99', 'Hero wash gradient start (from-[#0a1e3d]/60) over the screenshot mosaic.'),
  c('yu-navy-deepest-a80', '#0a1e3dcc', 'Hero wash gradient end (to-[#0a1e3d]/80).'),
  c('white-a30', '#ffffff4d', '.glass 1px border; active:bg-white/30 on the lightbox close button.'),
  c('white-a15', '#ffffff26', '.divider-horizontal-gradient mid stop (rgba(255,255,255,0.15)) on the dark flow band.'),
  c('white-a6', '#ffffff0f', '.deco-number-light outline stroke on navy (rgba(255,255,255,0.06)).'),
  c('black-a6', '#0000000f', '.bg-dots: 1px dots on a 24px grid (rgba(0,0,0,0.06)).'),
  c('black-a3', '#00000008', '.bg-grid: 1px lines on a 40px grid (rgba(0,0,0,0.03)).'),
  c('black-a20', '#00000033', 'shadow-black/20: the hero primary CTA shadow color (shadow-lg shadow-black/20).'),
  c('logo-navy', '#0d3f7a', 'Ink of the letterforms inside yu-logo.svg (baked into the file). Differs from yu-navy; never retint the mark to match the UI.'),
  c('logo-cyan', '#00b5d1', 'Ink of the two accent strokes inside yu-logo.svg (baked into the file). Differs from yu-cyan.'),
  // ---- The only CSS custom properties in globals.css
  c('background', '#ffffff', 'globals.css --background: the body background.'),
  c('foreground', '#171717', 'globals.css --foreground: the body text color where no text-* utility is set (the implicit default, slightly warmer than gray-900).'),

  // ---- Neutrals: gray (the dominant neutral) and slate (planner, requirements, admin tables)
  p('white', 'Card, panel, nav bar, modal and input surface (bg-white, 104 uses); text on yu-navy, yu-blue, red-600 fills and on the dark hero.'),
  c('white-a90', alpha(tw.white, 0.9), 'text-white/90: first line of the landing hero headline (영남대학교 생활을); hover:bg-white/90 is the hover fill of the white hero CTA. The hero lead paragraph is white-a60.'),
  c('white-a80', alpha(tw.white, 0.8), 'text-white/80: the hero badge label and its Sparkles icon (YU the Future), and the ZoomableImage hint text (탭하여 확대 pill on bg-black/40, drag hint pill on the black/95 lightbox). The auth brand panel uses text-blue-100, not this.'),
  c('white-a70', alpha(tw.white, 0.7), 'text-white/70: the hero ghost button label (비회원으로 체험하기, hover:text-white), its only text use; also the .glass background (rgba(255,255,255,0.7)) under a 12px backdrop blur — the sticky landing nav.'),
  c('white-a60', alpha(tw.white, 0.6), 'text-white/60: the hero lead paragraph and the flow section\'s subtitle and step descriptions (8 uses, all text-sm or larger; the footer uses gray-400/500, not this). 5.1:1 where the gradients pass through yu-navy (6.7:1 on yu-navy-deepest), so fine for body text.'),
  c('white-a40', alpha(tw.white, 0.4), 'text-white/40: the faintest line on dark surfaces, the hero notice under the CTAs (비회원은 데이터가 저장되지 않습니다, text-sm); the footer copyright is gray-500. Decorative-grade contrast only.'),
  c('white-a20', alpha(tw.white, 0.2), 'bg-white/20: the three blurred floating orbs on the login/register brand panel and the ZoomableImage close-button hover; border-white/20: the hero badge outline and the graduation-guide lightbox image frame. rgba(255,255,255,0.2) is also the mid stop of .divider-vertical-gradient in the dark flow section.'),
  c('white-a10', alpha(tw.white, 0.1), 'bg-white/10, border-white/10: the quietest glass fill and hairline on dark surfaces; the hero badge and the lightbox close button at rest.'),
  p('black', 'Only through alpha: modal overlays (black-a50) and the .bg-dots / .bg-grid patterns.'),
  c('black-a50', alpha(tw.black, 0.5), 'bg-black/50: modal backdrop (8 uses, including the calendar event form).'),
  c('black-a40', alpha(tw.black, 0.4), 'bg-black/40: the lighter backdrop of the admin requirements form and delete-confirm modals; also the mobile 탭하여 확대 hint pill on ZoomableImage thumbnails (the zoom lightbox itself is black-a95).'),
  c('black-a10', alpha(tw.black, 0.1), 'bg-black/10: hover wash over images; bg-black/0 is its resting state.'),
  c('black-a95', alpha(tw.black, 0.95), 'bg-black/95: the ZoomableImage lightbox backdrop.'),
  p('gray-50', 'Page background under the dashboard (the app frame is bg-gray-50), hover fill of outline buttons and list rows, PWA background_color.'),
  p('gray-100', 'Secondary Button fill, ghost Button hover, skeleton bars (with animate-pulse), subtle chips.'),
  p('gray-200', 'Secondary Button hover, Toast outer border, progress-bar tracks, dividers in cards.'),
  p('gray-300', 'Input, select and outline Button border (border-gray-300); disabled fills.'),
  p('gray-400', 'Placeholder text, icon buttons at rest, tertiary meta (82 uses). 2.6:1 on white — placeholders and icons only, never required reading.'),
  p('gray-500', 'Card descriptions, helper text and timestamps on white and gray-50 (4.8:1 / 4.6:1).'),
  p('gray-600', 'Secondary body copy on white and gray-50 (7.6:1 / 7.2:1) — the most used text color (129).'),
  p('gray-700', 'Body copy and form labels on white, gray-50 and gray-100 (103 uses).'),
  p('gray-800', 'Strong body copy and card headings.'),
  p('gray-900', 'Primary text: Card text color, page titles, Toast message, secondary Button label. Because Card sets text-gray-900 and a bare `border`, this is also the color of Card and SemesterColumn hairlines under Tailwind v4 (see border-default).'),
  p('slate-50', 'Inset panel fill on the help, feedback and graduation-guide pages (step boxes, tip cards, empty states) and top stop of their page gradient (from-slate-50 via-white to-slate-100); the feedback textareas at rest (bg-slate-50 focus:bg-white) and admin user sub-panels. Not used in the planner (semester-column headers are bg-gray-50), and admin has no tables.'),
  p('slate-100', 'Chip fills in admin (course badges, default role badge, semester toggles at rest) and the eyebrow pills on the help pages (with slate-700 text); admin-users and feedback skeletons (animate-pulse); bottom stop of the help-page gradients (to-slate-100); hover wash of admin icon and text buttons (hover:bg-slate-100). Not used in the planner.'),
  p('slate-200', 'Hairline border of admin cards, forms and requirement rows and of the help, feedback, graduation-guide and patch-notes panels (border-slate-200, 87 uses); bg-slate-200 is the admin and patch-notes skeleton fill (animate-pulse) and the admin secondary-button fill. Not used in the planner.'),
  p('slate-300', 'Empty-state icons in admin, feedback and patch-notes lists (text-slate-300, h-8 to h-12) and the patch-notes row arrow; hover:bg-slate-300 of the slate-200 secondary buttons in admin. No dashed border or disabled text uses it.'),
  p('slate-400', 'Admin and feedback meta lines, timestamps, character counters, search icons, icon buttons at rest and input placeholders (placeholder:text-slate-400) (2.6:1 on white — meta only); the mono course codes in the admin user plan viewer. Empty-state icons are slate-300; not used in the planner.'),
  p('slate-500', 'Secondary text on white in admin (mostly requirements and users) and on the feedback and patch-notes pages (4.8:1). Not used in the planner.'),
  p('slate-600', 'Body copy on the help and graduation-guide pages and in admin (requirements, courses) on white and slate-50 (7.6:1 / 7.2:1); secondary-button text on slate-100 / slate-200 and the hover color of admin icon buttons. Not used in the planner or the student requirements page.'),
  p('slate-700', 'Admin form labels and input text, admin course and user-plan course names, feedback and patch-note body text and the help eyebrow-pill text, on white (58 uses). Planner headings and course names are gray-800, not this.'),
  p('slate-800', 'Its one use: the bold course code in the admin course list (admin/courses/page.tsx:428).'),
  p('slate-900', 'Input text in the admin patch-note and feedback forms and the feedback textarea (text-slate-900), and department and user names in admin lists; bg-slate-900/75 is the hover 클릭하여 확대 pill on graduation-guide screenshots. Page titles use gray-900 or yu-navy.'),
  c('slate-900-a75', alpha(tw['slate-900'], 0.75), 'bg-slate-900/75: the 클릭하여 확대 hint pill revealed on hover over graduation-guide screenshots (rounded-full, text-xs white text); not a backdrop.'),
  c('slate-950-a85', '#020618d9', 'bg-slate-950/85: the graduation-guide lightbox backdrop.'),
  c('amber-50-a50', alpha(tw['amber-50'], 0.5), 'bg-amber-50/50: selected calendar day on mobile.'),
  c('blue-300-a50', alpha(tw['blue-300'], 0.5), 'ring-blue-300/50: the one-time pulse hint ring on a planned compact status pill.'),
  c('gray-200-a50', alpha(tw['gray-200'], 0.5), 'border-gray-200/50: set on the landing glass nav (with border-b) but never rendered. The unlayered .glass rule in globals.css sets border: 1px solid rgba(255,255,255,0.3), which beats Tailwind\'s layered utilities, so the nav actually shows a white-a30 hairline on all four sides.'),
  c('green-50-a30', alpha(tw['green-50'], 0.3), 'bg-green-50/30: surface of a feedback card that has an admin reply (with a green-400 left rail).'),

  // ---- Status: danger / warning / success / info families
  p('red-50', 'Error banner and failed-course background.'),
  p('red-100', 'Failed-course and error chip fill; destructive hover wash.'),
  p('red-200', 'Error banner border.'),
  p('red-300', 'Border of the red outline buttons (Button variant outline plus border-red-300 text-red-600 hover:bg-red-50): the planner 초기화 action and the profile 계정 초기화 and 회원 탈퇴 buttons.'),
  p('red-400', 'Hover border of the red outline buttons on the profile page (hover:border-red-400), its only use.'),
  p('red-500', 'Validation error text and Input error border (text-red-500, 49 uses; 3.8:1 on white — the source pair, flagged; prefer red-600 for new copy). Required-field asterisks.'),
  p('red-600', 'Destructive Button fill with white text (4.8:1); error text on white (4.8:1).'),
  p('red-700', 'Destructive Button hover; error text on red-50 and red-100 (5.9:1 / 5.3:1).'),
  p('orange-50', 'Inactive fill of the 전공선택 category chip and the 부전공 department chip in CourseCatalog (with orange-600 text, hover:bg-orange-100).'),
  p('orange-100', 'Category chip fill with orange-700 text (전공선택 in CourseCard, CourseCatalog, ReadOnlySemesterColumn and statistics; 전공필수 in admin courses; see planner semantics), the 부전공 badges (planner header, profile, catalog list) and the admin feedback data-error badge; hover fill of the orange-50 catalog chips.'),
  p('orange-400', 'Hover border of the unselected 부전공 toggle in onboarding and profile (hover:border-orange-400), its only use.'),
  p('orange-500', 'Selected fill and border of the 부전공 toggle in onboarding and profile (bg-orange-500 text-white border-orange-500) and the active 전공선택 and 부전공 chips in CourseCatalog; onboarding section icons (text-orange-500). Sits under white text at 2.9:1 — below 3:1 even for large text; kept, flagged.'),
  p('orange-600', 'Admin dashboard stat figure (text-3xl font-bold on white, 3.6:1, passes as large text only); inactive 전공선택 and 부전공 chip text on orange-50 in CourseCatalog (3.4:1, flagged); hover text of the unselected 부전공 toggle.'),
  p('orange-700', 'Category chip text on orange-100 (4.6:1).'),
  p('amber-50', 'Notice banner background: the guest-mode banner in the dashboard layout, the in-app-browser notice on login, the no-department banner and curriculum notes in CourseCatalog, and the onboarding, statistics, CustomCourseForm and RequirementForm notices. No prerequisite warning exists.'),
  p('amber-100', 'Fill of the small action buttons inside amber notices (login 외부 브라우저에서 열기 with amber-900 text; the RequirementForm button with amber-800 text and an amber-300 border), both hover:bg-amber-200; hover wash of the SemesterColumn 학기 초기화 icon button.'),
  p('amber-200', 'Notice banner border (border-amber-200, 6 uses). hover:bg-amber-200 is the hover fill of the amber-100 action buttons inside notices (login 외부 브라우저에서 열기, RequirementForm). Never used as a resting fill.'),
  p('amber-300', 'Notice border accent.'),
  p('amber-400', 'Calendar selected-day cell. A selected day gets md:border-2 border-amber-400. When the selected day is today it gets md:ring-2 ring-amber-400 around the blue-500 today border, plus a 1px border-amber-400 on mobile. Not a row or notice treatment.'),
  p('amber-500', 'Toast warning rail (border-l-amber-500).'),
  p('amber-600', 'Warning copy (text-amber-600, 9 uses): catalog and custom-course notices on amber-50 (3.1:1), the onboarding hint, the guest-mode label and the AnonymousPlanModal error, plus the statistics LogIn icon. Also Toast warning action text, and the bg-amber-600 fill under white text on the statistics 구글로 로그인 CTA. 3.2:1 on white — flagged, keep as source.'),
  p('amber-700', 'Notice text on amber-50 (4.9:1): the login in-app-browser hint and the catalog no-department banner. Hover text of the amber-900 notice links and the Toast warning action; hover fill of the amber-600 statistics CTA.'),
  p('amber-800', 'Notice body text on amber-50 (6.8:1).'),
  p('amber-900', 'Notice headings on amber-50.'),
  p('yellow-100', 'Pending / draft status chip fill (feedback 대기중, patch-note 초안), the Google provider badge and the feedback-new notification chip.'),
  p('yellow-400', 'Unread-count badge fill on the notification bell for admins (students get red-500); pairs with yellow-900 text.'),
  p('yellow-600', 'Icon of feedback-new notifications in the header bell menu (MessageSquareText on a yellow-100 well; 2.7:1, icon only).'),
  p('yellow-700', 'Pending / draft chip text on yellow-100 (4.6:1).'),
  p('yellow-900', 'Text on the admin unread badge (yellow-400).'),
  p('green-50', 'Enrolled (수강중) CourseCard surface (status-enrolled-bg). Also the admin-reply panel in admin feedback (with a green-200 border), the calendar 수강신청 event surface (green-700 text), and the inactive 교양선택 catalog chip and quick-add tile. bg-green-50/30 (green-50-a30) tints a help/feedback card that has an admin reply; it is not a requirement row.'),
  p('green-100', 'Completed / satisfied chip fill.'),
  p('green-200', 'Enrolled CourseCard border (status-enrolled-border). Also the border of the admin-reply panels in admin and help feedback, the calendar 수강신청 chip and the 교양선택 quick-add tile.'),
  p('green-300', 'Toast graduation-delta "after" bar (behind the green-500 "before" bar).'),
  p('green-400', 'Left rail (border-l-4 border-l-green-400) of a help/feedback card that has an admin reply, together with bg-green-50/30. No requirement row uses it.'),
  p('green-500', 'Toast success rail (border-l-green-500) and the \'before\' bar of the Toast graduation delta (drawn over green-300). Also the 교양선택 fills under white text in CourseCatalog: the quick-add buttons and the active category chip (2.2:1 — below 3:1; kept, flagged). Satisfied-requirement progress fills are emerald-500, not this.'),
  p('green-600', 'Fill of the inline admin confirm buttons, with white text (3.2:1 — flagged): feedback 답변 및 해결 처리 / 답변 없이 해결 and patch-note 바로 발행 / 발행. The Button component has no success variant. Also Toast success action text, the 복사됨 confirmation, an admin dashboard stat numeral, the inactive 교양선택 catalog chip text on green-50, and the hover fill of the 교양선택 quick-add buttons.'),
  p('green-700', 'Success text on white and green-100 (4.9:1 / 4.5:1); success Button hover.'),
  p('emerald-50', 'Surface of the onboarding auto-fill message (emerald-600 text, 3.5:1) and of the inactive 학기 semester-filter chip in CourseCatalog. No stat tile uses it.'),
  p('emerald-100', 'Fill of the compact 이수 status pill (CourseCard statusPillColors.completed, i.e. pill-completed-bg) and the 예정↔이수 hint chip in the planner header. Also the hover fill of the inactive 학기 filter chip.'),
  p('emerald-500', 'RequirementsSummary earned-credit fill and its legend swatch once a requirement is met (blue-600 before that). Onboarding 졸업 요건 설정 card top rail (border-t-4) and completed-step circle. CourseCatalog fills under white text: the 커스텀 corner ribbon, the + 추가 custom-course button and the active 학기 filter chip (white on emerald-500 is 2.5:1 — below 3:1; kept, flagged).'),
  p('emerald-600', 'Positive text on white (3.7:1 — flagged). Uses: RequirementsSummary 요건 충족 (11px), met credit counts (11–12px) and the total percentage at 100% (text-lg font-semibold); the 커스텀 list tag (10px); the onboarding auto-fill message on emerald-50 (3.5:1); the onboarding GraduationCap icon; the + 추가 button hover. Most of this is 10–12px text, and 18px semibold is not large text under WCAG (that needs 24px, or 18.66px bold), so 3:1 does not apply.'),
  p('emerald-700', 'Positive text on emerald-100 (4.7:1).'),
  p('teal-50', 'The {year}년 기준 badge fill in RequirementsSummary (with teal-700 text and a teal-200 border).'),
  p('teal-100', 'Teal chip fill.'),
  p('teal-200', 'Teal chip border.'),
  p('teal-700', 'Category chip text on teal-100 (4.8:1).'),
  p('sky-400', 'Enrolled (수강중) segment of the RequirementsSummary progress bars, and its legend swatch. The calendar does not use it.'),
  p('blue-50', 'Info surfaces: the statistics banner (blue-200 border) and the CustomCourseForm and RequirementForm notes. Also the calendar today cell and 학사 event surface, the inactive 교양필수 catalog chip and quick-add tile, the legal-page gradient start (from-blue-50), and the hover wash of a few text buttons. No selected list row uses it.'),
  p('blue-100', 'Category chip fill (see planner semantics); info chip (21 uses). Also text-blue-100 for the feature descriptions on the login/register brand panel (6 uses).'),
  p('blue-200', 'Info banner border.'),
  p('blue-300', 'Used only through blue-300-a50 (ring-blue-300/50): the one-time animate-pulse hint ring on a planned compact status pill. Never used at full strength or for selection.'),
  p('blue-400', 'Calendar: today cell border on mobile (border-blue-400).'),
  p('blue-500', 'ring-blue-500: focus ring on form fields that do not use yu-cyan (8 uses); calendar today cell 2px border from md; active catalog 교양필수 chip.'),
  p('blue-600', 'Info text on white and blue-50 (5.2:1 / 4.8:1): calendar Saturday labels, CustomCourseForm and RequirementForm messages, and the inactive 교양필수 catalog chip text. Also the active 전체 calendar filter-chip fill under white text (5.2:1), the RequirementsSummary earned-credit fill (unmet) and its legend swatch, the notification icon and the checkbox accent. No link uses it.'),
  p('blue-700', 'Category chip text on blue-100 (5.6:1); info text.'),
  p('indigo-50', 'Gradient end stop of the legal-page backgrounds (privacy, terms: from-blue-50 … to-indigo-50), and the inactive 공통 department-filter chip fill in CourseCatalog. Not on the landing page.'),
  p('indigo-100', 'Hover fill of the inactive 공통 department-filter chip. The 공통 tag (bg-indigo-100 text-indigo-700) on catalog items is coded but never renders, because the 공통 tab shows quick-add cards instead of items.'),
  p('indigo-500', 'Active 공통 department-filter chip fill in CourseCatalog, with white text (4.6:1). The 공통 corner ribbon (:191) is coded but never renders (see indigo-100). Statistics bars use the yu-navy → yu-blue → yu-cyan gradient, not this.'),
  p('indigo-600', 'Inactive 공통 department-filter chip text on indigo-50 (5.8:1).'),
  p('indigo-700', 'Text of the 공통 catalog tag on indigo-100 (6.6:1). Coded but never rendered, because the 공통 tab lists no items.'),
  p('violet-50', 'Violet chip surface.'),
  p('violet-100', 'Category chip fill (see planner semantics).'),
  p('violet-200', 'Border of the 교직 quick-add tile (with a violet-50 fill) in CourseCatalog\'s 공통 tab.'),
  p('violet-500', '교직 fills under white text in CourseCatalog: the quick-add 1/2/3학점 buttons and the active 교직 category-filter chip (4.4:1 — just under 4.5:1 for their 12–14px text; kept, flagged). Not a statistics bar.'),
  p('violet-600', 'Inactive 교직 category-filter chip text on violet-50 (5.4:1); hover fill of the 교직 quick-add buttons.'),
  p('violet-700', 'Category chip text on violet-100 (6.1:1).'),
  p('purple-50', 'Purple chip surface; inactive 복수전공 filter chip.'),
  c('purple-50-a30', alpha(tw['purple-50'], 0.3), 'bg-purple-50/30: the dashed preview frame tint in PatchNotePreview (admin).'),
  p('purple-100', '복수전공 department chip fill (dept-double-major-bg) in CourseCard, CourseCatalog, the planner header and profile. Also the patch-note Megaphone icon wells, the graduation-guide STEP 3 icon well, and the admin student-ID and 교직 chips (15 uses). The planner category chips (CourseCard.categoryColors) contain no purple.'),
  p('purple-200', 'Border of the admin patch-notes 미리보기 toggle button and of the dashed PatchNotePreview frame (border-2 border-dashed).'),
  p('purple-400', 'Hover border (hover:border-purple-400) of the unselected 복수전공 major-type option button in onboarding and profile. Never used at rest.'),
  p('purple-500', 'Selected 복수전공 major-type option button in onboarding and profile (fill and border, white text), and the active 복수전공 catalog filter chip (white text 4.1:1 — under 4.5:1 for 12–14px text; kept, flagged). Also the onboarding 복수전공 section icons.'),
  p('purple-600', 'Text and icons on purple-50 and purple-100. On purple-50 (5.2:1): the active admin nav item, the admin patch-notes 미리보기 button, the inactive 복수전공 catalog chip and the help-feedback badge. On purple-100 wells (4.7:1): the patch-note Megaphone icons. Also the PatchNotePreview header, an admin stat numeral on white (5.5:1), and the hover text of the unselected 복수전공 option (16 uses, 3 of them hover). Never category text.'),
  p('purple-700', '복수전공 department chip text on purple-100 (6.0:1), i.e. dept-double-major-text. Also the admin 교직 category chip and the student-ID chip.'),
  p('rose-50', 'Rose chip surface; inactive 전공필수 filter chip.'),
  p('rose-500', 'Active 전공필수 filter chip fill with white text (3.8:1 — flagged, kept).'),
  p('rose-100', 'Category chip fill (see planner semantics).'),
  p('rose-200', 'Rose chip border.'),
  p('rose-600', 'Inactive 전공필수 category-filter chip text on rose-50 (4.1:1 — under 4.5:1 for its 12px text; kept, flagged).'),
  p('rose-700', 'Category chip text on rose-100 (5.0:1).'),
  c('transparent', '#00000000', 'border-transparent on focused inputs (the ring replaces the border); gradient and overlay end stops.'),
];

// semantic aliases are appended by build after the sweep (see SEMANTIC below)
const SEMANTIC = [
  c('surface', '{white}', 'Alias. Cards, panels, nav, modals, inputs.'),
  c('surface-muted', '{gray-50}', 'Alias. The app frame behind cards; hover fill of outline buttons and rows.'),
  c('surface-sunken', '{gray-100}', 'Alias. Secondary Button, ghost hover, skeletons.'),
  c('ink', '{gray-900}', 'Alias. Primary text on surface and surface-muted.'),
  c('ink-secondary', '{gray-700}', 'Alias. Body copy and labels on surface and surface-muted.'),
  c('ink-muted', '{gray-600}', 'Alias. Secondary copy on surface and surface-muted (7.6:1 / 7.2:1).'),
  c('ink-subtle', '{gray-500}', 'Alias. Helper text and timestamps (4.8:1 on surface).'),
  c('ink-placeholder', '{gray-400}', 'Alias. Placeholders and resting icons only.'),
  c('line', '{slate-200}', 'Alias. Hairlines (border-slate-200, 87 uses) on admin tables, cards and inputs, the help and help/feedback pages, and the patch-notes pages. The planner uses no slate at all; its hairlines are gray-200 / gray-100 or Card\'s bare border.'),
  c('line-neutral', '{gray-200}', 'Alias. Hairlines on Toast, the CourseCatalog panel and its header rule, the completed CourseCard, the dashed SemesterColumn empty state, calendar cells and modal headers (border-gray-200, 21 uses). It is the student-facing app\'s light line, planner included.'),
  c('line-input', '{gray-300}', 'Alias. Input, select and outline Button border.'),
  c('focus-ring', '{yu-cyan}', 'Alias. 2px focus ring on Input and SearchableSelect (focus:ring-2 focus:ring-[#00AACA] with the border turned transparent).'),
  c('focus-ring-form', '{blue-500}', 'Alias. Focus ring on plain form controls that use Tailwind blue instead of yu-cyan: focus:ring-2 on the admin calendar event form (6 uses) and focus:ring-1 on two RequirementForm selects.'),
  c('danger', '{red-600}', 'Alias. Destructive fills (white text) and error text.'),
  c('danger-soft', '{red-50}', 'Alias. Error banner surface with a red-200 border. Most source banners put red-600 text on it (login/register errors and the admin load-error panels; 4.4:1, below 4.5:1). AddSemesterDialog and calendar 시험 events use red-700 (5.9:1), the pairing to use in new work.'),
  c('warning', '{amber-500}', 'Alias. Warning rails and icons.'),
  c('warning-soft', '{amber-50}', 'Alias. Notice surface; pair with amber-800 text.'),
  c('success', '{green-500}', 'Alias. Toast success rail and the Toast graduation-delta bar. Satisfied-requirement progress fills in RequirementsSummary are emerald-500, not this token.'),
  c('success-soft', '{green-100}', 'Alias. Completed / resolved / published chip fill: the admin users completed status, feedback 해결됨 and 관리자 답변, and patch-note 발행됨. Also the 교양선택 category chip and the 수강중 compact pill. Pair with green-700 text (4.5:1). The planner\'s 이수 pill is emerald-100 instead, and no \'satisfied\' chip exists.'),
  c('info', '{yu-blue}', 'Alias. Info rail and progress fill.'),
  c('info-soft', '{blue-50}', 'Alias. Info banner surface. The statistics banner has a blue-200 border, gray-700 / gray-900 copy and a yu-blue Info icon. CustomCourseForm puts blue-600 text on it (4.8:1) and calendar 학사 events use blue-700 (6.3:1).'),
  c('border-default', '{gray-900}', 'Alias. What a bare Tailwind `border` renders as under v4: 1px solid currentColor, which on Card (text-gray-900) is this dark line. Semester columns, Card and the default status pill really do draw this near-black hairline; planner rows that want a light line say border-gray-100 (ReadOnlySemesterColumn rows) or border-gray-200 explicitly, and CourseCard swaps in its status border.'),
  // ---- Planner semantics: RequirementCategory chips (CourseCard.categoryColors, duplicated in ReadOnlySemesterColumn)
  c('category-major-required-bg', '{red-100}', 'Alias. 전공핵심 (major_required) chip fill.'),
  c('category-major-required-text', '{red-700}', 'Alias. 전공핵심 chip text on category-major-required-bg (5.3:1).'),
  c('category-major-compulsory-bg', '{rose-100}', 'Alias. 전공필수 (major_compulsory) chip fill — note how close it sits to red-100.'),
  c('category-major-compulsory-text', '{rose-700}', 'Alias. 전공필수 chip text (5.0:1).'),
  c('category-major-elective-bg', '{orange-100}', 'Alias. 전공선택 (major_elective) chip fill; also the 부전공 department chip.'),
  c('category-major-elective-text', '{orange-700}', 'Alias. 전공선택 chip text (4.6:1).'),
  c('category-general-required-bg', '{blue-100}', 'Alias. 교양필수 (general_required) chip fill; also the compact 예정 status pill.'),
  c('category-general-required-text', '{blue-700}', 'Alias. 교양필수 chip text (5.6:1).'),
  c('category-general-elective-bg', '{green-100}', 'Alias. 교양선택 (general_elective) chip fill; also the 수강중 status pill.'),
  c('category-general-elective-text', '{green-700}', 'Alias. 교양선택 chip text (4.5:1).'),
  c('category-teaching-bg', '{violet-100}', 'Alias. 교직 (teaching) chip fill.'),
  c('category-teaching-text', '{violet-700}', 'Alias. 교직 chip text (6.1:1).'),
  c('category-free-elective-bg', '{gray-100}', 'Alias. 자유선택 (free_elective) chip fill and the fallback for unknown categories.'),
  c('category-free-elective-text', '{gray-600}', 'Alias. 자유선택 chip text (6.9:1).'),
  // ---- Planner semantics: course status (CourseCard.statusColors surface + statusPillColors compact pill)
  c('status-planned-bg', '{yu-navy-a5}', 'Alias. CourseCard surface when status is planned (계획).'),
  c('status-planned-border', '{yu-navy-a20}', 'Alias. CourseCard border when planned.'),
  c('status-enrolled-bg', '{green-50}', 'Alias. CourseCard surface when enrolled (수강중).'),
  c('status-enrolled-border', '{green-200}', 'Alias. CourseCard border when enrolled.'),
  c('status-completed-bg', '{gray-50}', 'Alias. CourseCard surface when completed (완료).'),
  c('status-completed-border', '{gray-200}', 'Alias. CourseCard border when completed.'),
  c('status-failed-bg', '{red-50}', 'Alias. CourseCard surface when failed (재수강).'),
  c('status-failed-border', '{red-200}', 'Alias. CourseCard border when failed.'),
  c('pill-planned-bg', '{blue-100}', 'Alias. Compact status pill 예정 fill.'),
  c('pill-planned-text', '{blue-700}', 'Alias. Compact status pill 예정 text.'),
  c('pill-enrolled-bg', '{green-100}', 'Alias. Compact status pill 수강중 fill.'),
  c('pill-enrolled-text', '{green-700}', 'Alias. Compact status pill 수강중 text.'),
  c('pill-completed-bg', '{emerald-100}', 'Alias. Compact status pill 이수 fill — emerald, one hue off the enrolled green.'),
  c('pill-completed-text', '{emerald-700}', 'Alias. Compact status pill 이수 text (4.7:1).'),
  c('pill-failed-bg', '{red-100}', 'Alias. Compact status pill 재수강 fill.'),
  c('pill-failed-text', '{red-700}', 'Alias. Compact status pill 재수강 text.'),
  c('dept-double-major-bg', '{purple-100}', 'Alias. 복수전공 department chip fill.'),
  c('dept-double-major-text', '{purple-700}', 'Alias. 복수전공 chip text (6.0:1).'),
  c('dept-minor-bg', '{orange-100}', 'Alias. 부전공 department chip fill (same as 전공선택).'),
  c('dept-minor-text', '{orange-700}', 'Alias. 부전공 chip text.'),
];

// ---------------------------------------------------------------- type
const type = {
  fonts: [],
  families: {
    body: 'Arial, Helvetica, sans-serif',
    sans: '"Geist", Arial, Helvetica, sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  groups: [
    {
      name: 'Display',
      family: 'body',
      styles: [
        { name: 'display-xl', fontSize: '72px', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.025em', sample: '졸업까지, 한눈에', usage: 'Landing hero headline at lg (text-7xl font-bold leading-tight tracking-tight; leading-tight overrides text-7xl\'s own line-height of 1).' },
        { name: 'display-lg', fontSize: '60px', lineHeight: 1.25, fontWeight: 700, letterSpacing: '-0.025em', usage: 'Landing hero headline from sm (sm:text-6xl with leading-tight tracking-tight).' },
        { name: 'display-md', fontSize: '48px', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.025em', usage: 'Landing closing-CTA heading at md (md:text-5xl font-bold tracking-tight) and the login/register brand-panel headline at lg (lg:text-5xl, with leading-tight). The hero headline on mobile is text-4xl, and the 404/error pages show an icon and a text-xl title, not numerals.' },
        { name: 'display-sm', fontSize: '36px', lineHeight: '40px', fontWeight: 700, usage: 'Landing section titles at md (md:text-4xl font-bold tracking-tight); the landing hero headline and the login/register brand-panel headline below their breakpoints (text-4xl, leading-tight); help, feedback, graduation-guide and terms page titles at md. No stat value uses it (the admin stat values are text-3xl).' },
      ],
    },
    {
      name: 'Headings',
      family: 'body',
      styles: [
        { name: 'heading-1', fontSize: '30px', lineHeight: '36px', fontWeight: 700, usage: 'Landing section titles on mobile (text-3xl); admin dashboard stat values (text-3xl font-bold, 4 uses); help, graduation-guide, legal, statistics and onboarding page titles (text-3xl, some stepping up to md:text-4xl). The auth panel headline is larger (text-4xl lg:text-5xl).' },
        { name: 'heading-2', fontSize: '24px', lineHeight: '32px', fontWeight: 700, usage: 'Dashboard page titles (text-2xl font-bold text-gray-900); CardTitle at 600 weight with leading-none tracking-tight.' },
        { name: 'heading-3', fontSize: '20px', lineHeight: '28px', fontWeight: 600, usage: 'Error, 404 and ErrorBoundary titles, privacy-policy section headings, the login/register brand-panel feature titles and the calendar event modal title (text-xl font-semibold). Most other modal titles are text-lg; CardTitle is text-2xl.' },
        { name: 'heading-4', fontSize: '18px', lineHeight: '28px', fontWeight: 600, usage: 'Section headings inside cards (text-lg font-semibold).' },
      ],
    },
    {
      name: 'Body',
      family: 'body',
      styles: [
        { name: 'body', fontSize: '16px', lineHeight: '24px', fontWeight: 400, usage: 'The 16px body default: most 16px prose sets no size class and inherits it from body (legal pages, landing feature copy). The explicit text-base class appears only 6 times, mostly on font-semibold sub-headings plus the landing hero subcopy; md:text-base (18) and sm:text-base (3) step text-sm copy up on help pages. Landing copy adds leading-relaxed (1.625).' },
        { name: 'body-relaxed', fontSize: '16px', lineHeight: 1.625, fontWeight: 400, usage: '16px with leading-relaxed: the terms and privacy body copy, the landing feature-row and closing-CTA paragraphs and the hero subcopy (9 uses, all but the hero inheriting 16px instead of setting text-base). Help, graduation-guide and feedback paragraphs reach it from md or sm (text-sm leading-relaxed md:text-base / sm:text-base, 13 uses). leading-relaxed appears 42 times in all; the other 20 sit on text-sm or text-xs copy (landing flow steps, Footer, patch notes, feedback).' },
        { name: 'body-sm', fontSize: '14px', lineHeight: '20px', fontWeight: 400, usage: 'The default UI size: inputs, select options, list rows, Card descriptions (text-sm, 393 uses).' },
        { name: 'body-sm-medium', fontSize: '14px', lineHeight: '20px', fontWeight: 500, usage: 'Button labels, form labels, nav links, Toast message, course names on CourseCard (text-sm font-medium, on about 129 elements; font-medium is the most common weight, 266 uses across all sizes).' },
        { name: 'body-sm-semibold', fontSize: '14px', lineHeight: '20px', fontWeight: 600, usage: 'Column headers and emphasized values (text-sm font-semibold).' },
        { name: 'caption', fontSize: '12px', lineHeight: '16px', fontWeight: 400, usage: 'Meta text, helper text, Toast description, admin form labels (block text-xs ... mb-1) (text-xs, 247 uses).' },
        { name: 'caption-medium', fontSize: '12px', lineHeight: '16px', fontWeight: 500, usage: 'Chips and badges (text-xs font-medium), Toast action label, tab labels.' },
      ],
    },
    {
      name: 'Micro',
      family: 'body',
      styles: [
        { name: 'micro-11', fontSize: '11px', lineHeight: '16.5px', fontWeight: 500, usage: 'Dense planner labels and credit counts (text-[11px], 13 uses). Arbitrary sizes set only font-size, so line-height is inherited: 1.5 (16.5px) under the body default, tighter inside a text-xs or text-sm parent (their unitless 1.333 / 1.43 ratios inherit).' },
        { name: 'micro-10', fontSize: '10px', lineHeight: '15px', fontWeight: 500, usage: 'Category chips inside CourseCard, Toast delta counters (text-[10px], 22 uses).' },
        { name: 'micro-9', fontSize: '9px', lineHeight: '13.5px', fontWeight: 500, usage: 'The smallest label, on compact planner chips (text-[9px]).' },
        { name: 'overline', fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.1em', usage: 'Footer column headings (Service, Support, Legal: text-xs font-semibold tracking-widest uppercase, white on footer-navy). The landing section eyebrows are larger: text-sm uppercase font-semibold tracking-[0.2em] (overview, flow) and text-sm uppercase tracking-widest font-medium (closing CTA).' },
      ],
    },
    {
      name: 'Code',
      family: 'mono',
      styles: [
        { name: 'mono-xs', fontSize: '12px', lineHeight: '16px', fontWeight: 400, usage: 'Course codes in the admin users plan rows (font-mono text-slate-400 inside a text-xs row) and the error pages\' stack <pre> (preflight gives pre the mono stack; text-xs). The only uses of Geist Mono.' },
      ],
    },
  ],
};

// ---------------------------------------------------------------- spacing (Tailwind steps actually used; 1 step = 4px)
const spacing = { note: 'Tailwind v4 spacing scale (--spacing: 0.25rem). Only the steps the app uses are listed; the name is the Tailwind step with "." written "-".', tokens: [
  c('space-0-5', '2px', 'py-0.5 on chips and badges; mt-0.5 under a label.'),
  c('space-1', '4px', 'gap-1 between icon and text in chips; mb-1 label-to-field; px-1 on micro chips.'),
  c('space-1-5', '6px', 'gap-1.5 in badge rows and Toast delta rows; py-1.5 compact buttons.'),
  c('space-2', '8px', 'gap-2 — the default gap between inline items (159 uses); py-2 input and button vertical padding; p-2 icon buttons.'),
  c('space-2-5', '10px', 'px-2.5 chip horizontal padding; py-2.5 taller rows.'),
  c('space-3', '12px', 'px-3 input and small-button horizontal padding (111 uses); p-3 Toast and compact cards; gap-3 between cards in a row.'),
  c('space-4', '16px', 'px-4 default Button padding; p-4 compact card padding; mb-4 / mt-4 block rhythm; gap-4 grid gaps.'),
  c('space-5', '20px', 'p-5 medium card padding; mb-5.'),
  c('space-6', '24px', 'p-6 Card header/content/footer padding; space-y-6 between page sections; px-6 modal padding.'),
  c('space-7', '28px', 'md:p-7 on the help and graduation-guide article cards (8 uses); never used bare, and the landing page has no cards at this padding.'),
  c('space-8', '32px', 'p-8 on the auth form panel, the error/404 pages, statistics empty-state and login-prompt cards and the legal page cards (modal panels use p-6); px-8 large Button; mb-8 page header to content.'),
  c('space-10', '40px', 'One use each: p-10 on the patch-notes empty state, mt-10 above the landing hero CTA row, gap-10 between the Footer columns.'),
  c('space-12', '48px', 'p-12 on the login/register brand-panel content and the admin empty states; md:p-12 on the help-feedback and terms cards; py-12 on statistics and AllPlansModal loading/empty states.'),
  c('space-16', '64px', 'py-16 on the privacy and terms page wrappers and the AnonymousPlanModal loading/error states; mb-16 under the landing flow heading and the profile cover banner; space-y-16 between the landing feature rows.'),
  c('space-20', '80px', 'py-20 landing hero padding; mb-20.'),
  c('space-24', '96px', 'py-24 tall landing sections.'),
  c('space-32', '128px', 'py-32 the hero at lg.'),
] };

// ---------------------------------------------------------------- radius
const radius = { note: 'Tailwind v4 radii. rounded (4px) is the Tailwind "sm" step; the app never uses 3xl or larger.', tokens: [
  c('radius-xs', '2px', 'rounded-[2px]: the 8px legend swatches (w-2 h-2) in the RequirementsSummary credit legend (4 uses); chips use rounded and the progress bars rounded-full.'),
  c('radius-sm', '4px', 'rounded: badges, small chips, calendar day-cell event bars, skeleton placeholders and error-detail <pre> blocks (35 uses).'),
  c('radius-md', '6px', 'rounded-md: Button, Input, SearchableSelect, Toast action button (46 uses).'),
  c('radius-lg', '8px', 'rounded-lg: Card, Toast, CourseCard, list rows, banners — the default container radius (188 uses).'),
  c('radius-xl', '12px', 'rounded-xl: help-page callouts and screenshot frames, the feedback textarea and mail tile, the AllPlansModal and AnonymousPlanModal panels, the profile cover banner, PatchNotePreview and the blurred landing-hero screenshot mosaic (29 uses). No stat tile or landing card uses it.'),
  c('radius-2xl', '16px', 'rounded-2xl: admin page panels, empty states and dialogs; help, graduation-guide, patch-notes and terms article cards (49 uses). The landing page, the auth form panel and the hero chip (rounded-full) do not use it.'),
  c('radius-full', '9999px', 'rounded-full: pills, avatars, progress bars, deco dots, icon buttons (107 uses). Tailwind 4.1.18 emits calc(infinity * 1px); 9999px renders the same.'),
] };

// ---------------------------------------------------------------- shadow
const shadow = { note: 'Tailwind v4 shadows plus two custom ones from globals.css. In v4 the bare "shadow" utility equals shadow-sm.', tokens: [
  c('shadow-sm', '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', 'Card and primary Button at rest (shadow-sm; the bare shadow utility renders the same).'),
  c('shadow-md', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 'Card and primary Button on hover (hover:shadow-md).'),
  c('shadow-lg', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 'Toast, dropdown menus (SearchableSelect list), floating panels, and the planner\'s CourseCard drag overlay (DragOverlay wrapper).'),
  c('shadow-xl', '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', 'Modal panels (CustomCourseForm and the admin dialogs).'),
  c('shadow-2xl', '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'The AllPlansModal and AnonymousPlanModal panels (its only 2 uses); the landing screenshots and the auth form panel carry no shadow-2xl.'),
  c('shadow-glow', '0 4px 24px rgba(21, 57, 116, 0.2), 0 0 48px rgba(0, 170, 202, 0.08)', '.shadow-glow: the closing-section 바로 시작하기 Button (size lg) on the landing page, its only use (the hero CTA uses shadow-lg shadow-black/20) — a navy glow with a faint cyan halo.'),
] };

// ---------------------------------------------------------------- size (control and icon sizes)
const size = { note: 'Fixed sizes from h-*/w-* utilities and max-w-* containers.', tokens: [
  c('control-sm', '36px', 'Button size="sm" height (h-9).'),
  c('control-md', '40px', 'Button default and icon size, Input height (h-10).'),
  c('control-lg', '44px', 'Button size="lg" height (h-11).'),
  c('icon-xs', '12px', 'h-3 w-3 micro icons in chips.'),
  c('icon-sm', '14px', 'h-3.5 w-3.5 icons in small text-xs buttons (admin patch-notes actions, feedback copy/send), the help-page eyebrow pills, nav dropdown chevrons, info notes and the catalog view toggles (25 uses).'),
  c('icon-md', '16px', 'h-4 w-4 — the default Lucide icon size in buttons and rows (about 122 uses as h-4 w-4 or w-4 h-4); the Button spinner.'),
  c('icon-lg', '20px', 'h-5 w-5 card and section header icons (profile CardHeaders, statistics, help sections) and CTA arrows (about 47 uses); the nav links use h-4 w-4.'),
  c('icon-xl', '24px', 'h-6 w-6: the landing flow-step icons, the login/register brand-panel check icons, the mobile menu toggle, the lightbox close icon and the catalog add button (16 uses). Empty-state glyphs are h-8 w-8 or h-12 w-12.'),
  c('icon-2xl', '32px', 'h-8 w-8: error, 404 and ErrorBoundary icons, loading spinners, empty-state glyphs (patch notes, notifications), the nav user avatar and other 32px avatar and notification-type circles (25 uses). The admin stat tiles have no icons and no icon button is sized h-8 w-8.'),
  c('avatar', '48px', 'h-12 w-12: empty-state glyphs on the admin pages and the statistics login prompt, and the planner loading spinner (7 uses), plus sm:h-12 sm:w-12 on the help-feedback mail tile. No avatar uses it (the nav avatar is h-8 w-8, the profile avatar w-20 h-20) and the landing page has no icon tiles.'),
  c('progress-track', '6px', 'h-1.5 progress bars in Toast and requirement rows.'),
  c('progress-track-sm', '4px', 'h-1 the thinnest progress rail.'),
  c('container-xs', '320px', 'max-w-xs: the onboarding progress stepper and its step labels, and the landing flow-step paragraphs on mobile (5 uses). No dialog uses it; toasts use sm:max-w-sm (384px).'),
  c('container-sm', '384px', 'max-w-sm: Toast stack width on sm+.'),
  c('container-md', '448px', 'max-w-md: auth form panel, small modals, AddSemesterDialog and CustomCourseForm panels.'),
  c('container-lg', '512px', 'max-w-lg: the calendar event modal and admin form modals.'),
  c('container-xl', '576px', 'max-w-xl.'),
  c('container-2xl', '672px', 'max-w-2xl: patch notes, profile, onboarding, the statistics empty states and the landing closing CTA (13 uses). Help articles use max-w-5xl (feedback: max-w-3xl).'),
  c('container-3xl', '768px', 'max-w-3xl: legal pages, the help-feedback page, the landing hero column and the overview section header. No modal uses it (the wide modals are max-w-4xl).'),
  c('container-4xl', '896px', 'max-w-4xl: the AllPlansModal and AnonymousPlanModal panels (its only 2 uses); the statistics page is max-w-7xl.'),
  c('container-5xl', '1024px', 'max-w-5xl: the help and graduation-guide page column, and the landing flow band\'s desktop three-step row (3 uses).'),
  c('container-6xl', '1152px', 'max-w-6xl: the landing overview feature rows (01–04) and the graduation-guide image lightbox frame (2 uses). The dashboard content column is the Tailwind container (container mx-auto), not a max-w step.'),
  c('container-7xl', '1280px', 'max-w-7xl: the calendar and statistics page columns (2 uses). The nav bar uses container mx-auto and the planner sets no max-w.'),
] };

// ---------------------------------------------------------------- motion-adjacent plain values
const duration = { note: 'Durations from transition/animation utilities and globals.css keyframes.', tokens: [
  c('duration-fast', '150ms', 'Tailwind default transition (transition-colors without a duration: 151 of 153 uses; the 2 onboarding step labels add duration-300).'),
  c('duration-base', '200ms', 'Button and Input transition-all duration-200; .drag-scroll-active fade.'),
  c('duration-slow', '300ms', 'Card shadow transition; animate-scale-in, slide-up, slide-down.'),
  c('duration-enter', '500ms', 'fadeInDown, slideInLeft, slideInRight entrances.'),
  c('duration-enter-long', '600ms', 'fadeIn and fadeInUp entrances (animate-fade-in-up, 17 uses); bounceSoft.'),
  c('duration-scroll', '700ms', '.animate-on-scroll reveal (opacity and transform).'),
  c('duration-ambient', '3s', 'float loop; pulseSoft is 2s, gradientShift 8s, shimmer 2s, cursorBlink 1s.'),
] };
const easing = { note: 'Timing functions used by the app.', tokens: [
  c('ease-standard', 'cubic-bezier(0.4, 0, 0.2, 1)', 'Tailwind default and the .animate-on-scroll curve.'),
  c('ease-out', 'cubic-bezier(0, 0, 0.58, 1)', 'The CSS ease-out keyword, used by every entrance keyframe class in globals.css (fadeIn, fadeInUp, fadeInDown, slideIn*, scaleIn, slideUp/Down: ease-out both). Not Tailwind\'s ease-out utility (cubic-bezier(0, 0, 0.2, 1)), which no element uses.'),
  c('ease-in-out', 'cubic-bezier(0.42, 0, 0.58, 1)', 'The CSS ease-in-out keyword, used by the float and pulseSoft loops in globals.css. Not Tailwind\'s ease-in-out utility (cubic-bezier(0.4, 0, 0.2, 1) = ease-standard).'),
] };
const opacity = { note: 'Opacity steps used by utilities and globals.css.', tokens: [
  c('opacity-disabled', '0.5', 'disabled:opacity-50 on Button, Input, SearchableSelect and the admin, calendar and help-feedback form buttons (16 uses); plain opacity-50 also dims dragged and already-added catalog cards and the loading AddSemesterDialog options (8 uses).'),
  c('opacity-drag-scroll', '0.3', '.drag-scroll-active: the course catalog panel fades to 0.3 while the planner page auto-scrolls to the semester grid on a touch drag from the catalog.'),
  c('opacity-spinner-track', '0.25', 'The Button spinner circle.'),
  c('opacity-spinner-head', '0.75', 'The Button spinner arc.'),
  c('opacity-hover-wash', '0.9', 'hover:opacity-90 (with transition-opacity) on the gradient link-buttons of the statistics page: the two empty-state CTAs and the anonymous-plans login CTA (3 uses); plain opacity-90 on the planner DragOverlay wrapper.'),
] };
const zIndex = { note: 'Layer order.', tokens: [
  c('z-base', '0', '-z-0 on the blurred cyan underline beneath the landing hero typewriter line (its only use; z-0 itself is never used). The hero background layers carry no z class.'),
  c('z-raised', '5', 'z-[5] on the profile page\'s 전공 설정 Card (relative z-[5], in both the guest and signed-in layouts); in the signed-in layout it sits one layer below the z-10 기본 정보 Card. The hero deco rings have no z class.'),
  c('z-sticky', '10', 'z-10: landing and auth-panel content above their decorative backgrounds, the sticky group headers and the add button in the planner\'s CourseCatalog, the profile 기본 정보 Card and the lightbox close button (11 uses). Nav dropdowns are z-50.'),
  c('z-overlay', '40', 'The AllPlansModal backdrop on the statistics page (z-40, its only use). The mobile nav menu is an inline panel with no backdrop or z-index.'),
  c('z-modal', '50', 'Modals and the image lightboxes, the Toast stack, dropdown menus (nav menus, SearchableSelect list, planner export menu) and the sticky landing nav (z-50, 18 uses). The dashboard header is not fixed and has no z-index.'),
] };

const tokens = {
  name: 'Course Planner',
  version: 1,
  meta: {
    source: 'github',
    repo: 'hwankr/course-planner',
    ref: 'claude/design-system-extraction-t0lw70@013d3bc',
    package: '.',
    tailwind: '4.1.18 (no tailwind.config; defaults + arbitrary values)',
    paths: {
      tokens: ['src/app/globals.css', 'src/app/manifest.ts'],
      fonts: ['src/app/layout.tsx (next/font/google Geist, Geist_Mono — hosted, no files)'],
      assets: ['public/yu-logo.svg', 'public/yu-logo-white.svg', 'public/icon-*.png', 'src/app/apple-icon.png', 'src/app/opengraph-image.png', 'public/help/*.png'],
      docs: ['CLAUDE.md', 'README.md'],
    },
    synced: '2026-10-26',
  },
  color: {
    themes: [{ id: 'light', name: 'Light' }],
    tokens: [...colors, ...SEMANTIC],
  },
  type,
  spacing,
  radius,
  shadow,
  size,
  duration,
  easing,
  opacity,
  zIndex,
};

// validation: unique names across non-type families, alias targets exist
const names = new Set();
const all = [tokens.color, tokens.spacing, tokens.radius, tokens.shadow, tokens.size, tokens.duration, tokens.easing, tokens.opacity, tokens.zIndex].flatMap(f => f.tokens);
for (const t of all) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(t.name)) throw new Error('bad name ' + t.name);
  if (names.has(t.name)) throw new Error('duplicate ' + t.name);
  names.add(t.name);
}
const colorNames = new Set(tokens.color.tokens.map(t => t.name));
for (const t of tokens.color.tokens) {
  const v = typeof t.value === 'string' ? t.value : t.value.light;
  const m = /^\{(.+)\}$/.exec(v);
  if (m && !colorNames.has(m[1])) throw new Error('alias to missing ' + m[1]);
  if (!m && !/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(v)) throw new Error('bad color ' + t.name + ' ' + v);
  if (!t.usage) throw new Error('no usage ' + t.name);
}
fs.writeFileSync(OUT, JSON.stringify(tokens, null, 2) + '\n');
console.log('wrote', OUT, 'colors:', tokens.color.tokens.length, 'styles:', type.groups.reduce((n, g) => n + g.styles.length, 0), 'bytes:', fs.statSync(OUT).size);
