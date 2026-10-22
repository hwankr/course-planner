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
  c('yu-navy', '#153974', 'Primary brand blue. Headline accents, links and active nav text on white and gray-50 (11.2:1); solid fills (bg-[#153974]) carry white text; first stop of the primary Button gradient. 116 text uses, 65 fill uses.'),
  c('yu-blue', '#3069b3', 'Second stop of the primary Button gradient (from yu-navy to yu-blue); info rail on Toast; progress fills; selected-state borders. As text on white 5.5:1.'),
  c('yu-cyan', '#00aaca', 'Accent. Keyboard focus ring on inputs and selects (ring-[#00AACA]), accent borders, deco dots, the decorative underline and ring shapes. 2.8:1 on white — decorative and ring use only, never text under 24px. The 2px ring misses 3:1 on white: kept exact from source, flagged.'),
  c('yu-navy-hover', '#003e7e', 'Hover state of yu-navy fills and gradient starts (hover:from-[#003E7E]), link and Toast action hover text. 10.6:1 on white.'),
  c('yu-navy-dark', '#1a2f5a', 'Landing page dark-section gradient end stop (to-[#1a2f5a]).'),
  c('yu-navy-darker', '#0f2a57', 'Hover fill of the admin patch-notes primary button (bg-[#153974] hover:bg-[#0f2a57]).'),
  c('yu-navy-deepest', '#0a1e3d', 'Landing page hero and dark-section gradient start stop (from-[#0a1e3d]). The darkest brand value, 16.6:1 with white.'),
  c('yu-blue-dark', '#1a4a8f', 'Hover fill of the help and feedback primary buttons (hover:bg-[#1a4a8f]), the feedback mail tile gradient end and the terms back-link hover. 8.7:1 on white.'),
  c('yu-blue-dark-alt', '#1a4a94', 'Hover fill of the admin requirements primary button (hover:bg-[#1a4a94]). Near-duplicate of yu-blue-dark (#1a4a8f) — treat as the same role; prefer yu-blue-dark in new work.'),
  c('yu-theme-color', '#154878', 'PWA theme_color from manifest.ts: browser chrome and status bar in the installed app. Not used in page styles.'),
  c('yu-cyan-light', '#4dd9f0', 'Stop of the text-gradient-light and text-gradient-typing utilities on dark hero sections.'),
  c('yu-cyan-lighter', '#80e8ff', 'Final stop of text-gradient-light (yu-cyan → yu-cyan-light → yu-cyan-lighter) on dark hero sections.'),
  c('yu-tint-sky', '#f0f7ff', 'Landing page light gradient via stop (via-[#f0f7ff]) behind feature sections.'),
  c('yu-tint-ice', '#e8f4fd', 'Landing page light gradient end stop (to-[#e8f4fd]).'),
  c('gradient-typing-blue', '#60a5fa', 'Stop of .text-gradient-typing only (landing hero typewriter headline).'),
  c('gradient-typing-violet', '#a78bfa', 'Stop of .text-gradient-typing only (landing hero typewriter headline). The one violet in the brand palette; do not reuse elsewhere.'),
  c('gradient-warm-amber', '#f59e0b', 'Stop of .text-gradient-warm, defined in globals.css but not used by any page. Kept for completeness.'),
  c('gradient-warm-red', '#ef4444', 'Stop of .text-gradient-warm (unused in pages).'),
  c('gradient-warm-pink', '#ec4899', 'Stop of .text-gradient-warm (unused in pages).'),
  c('footer-navy', '#0d2654', 'Footer body background (bg-[#0d2654]) — the one surface darker than yu-navy. White, gray-400 and gray-500 text sit on it; gray-500 fine print reaches only about 3.5:1 (kept exact, flagged).'),
  c('landing-navy-stop', '#0f2847', 'Landing page diagonal section gradient start (from-[#0f2847] to-[#153974], bg-gradient-to-br, clip-diagonal-both).'),
  c('progress-hatch-dark', '#93c5fd', 'Dark stripe of the hatched "전공핵심" sub-row in RequirementsSummary (repeating-linear-gradient 135deg, 3px pitch). A Tailwind v3 blue-300 value kept as a literal.'),
  c('progress-hatch-light', '#dbeafe', 'Light stripe of the hatched progress row in RequirementsSummary. A Tailwind v3 blue-100 value kept as a literal.'),
  // ---- Brand alpha steps (the /N opacity modifiers used on the brand hex values)
  c('yu-navy-a5', '#1539740d', 'bg-[#153974]/5: planned CourseCard surface, focused SemesterColumn header, subtle brand chips.'),
  c('yu-navy-a10', '#1539741a', 'bg-[#153974]/10: selected option in SearchableSelect, active filter chips, brand icon wells (27 uses). Pair with yu-navy text.'),
  c('yu-navy-a20', '#15397433', 'border-[#153974]/20: planned CourseCard border; bg-[#153974]/20 hover of brand-tinted chips.'),
  c('yu-navy-a30', '#1539744d', 'shadow-[#153974]/30: tinted shadow under the landing CTA.'),
  c('yu-navy-a60', '#15397499', 'text-[#153974]/60: muted brand caption.'),
  c('yu-navy-a90', '#153974e6', 'bg-[#153974]/90: the "클릭하여 확대" hint pill over ZoomableImage thumbnails.'),
  c('yu-cyan-a5', '#00aaca0d', 'bg-[#00AACA]/5: SemesterColumn drop-target wash while a course is dragged over it.'),
  c('yu-cyan-a10', '#00aaca1a', 'bg-[#00AACA]/10: cyan icon wells and hover tints.'),
  c('yu-cyan-a20', '#00aaca33', 'focus:ring-2 focus:ring-[#00AACA]/20 together with focus:border-[#00AACA]: the soft focus ring on admin and form inputs (43 uses) — the most common focus treatment after Input\'s solid ring.'),
  c('yu-cyan-a30', '#00aaca4d', 'border-[#00AACA]/30 and bg-[#00AACA]/30: cyan outlines and fills on dark hero chips.'),
  c('yu-cyan-a50', '#00aaca80', 'ring-[#00AACA]/50: SemesterColumn drop-target ring (isOver); border-[#00AACA]/50.'),
  c('yu-blue-a10', '#3069b31a', 'bg-[#3069B3]/10: info chip fill.'),
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
  c('white-a85', '#ffffffd9', '.glass-strong background (rgba(255,255,255,0.85)) with a 20px backdrop blur.'),
  c('white-a50', '#ffffff80', '.glass-strong 1px border.'),
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
  c('white-a90', alpha(tw.white, 0.9), 'text-white/90: lead paragraph on the dark hero.'),
  c('white-a80', alpha(tw.white, 0.8), 'text-white/80: secondary copy on dark hero and auth brand panel.'),
  c('white-a70', alpha(tw.white, 0.7), 'text-white/70: tertiary copy on dark surfaces; also the .glass background (rgba(255,255,255,0.7)) under a 12px backdrop blur — the sticky landing nav.'),
  c('white-a60', alpha(tw.white, 0.6), 'text-white/60: captions and footer meta on dark surfaces (8 uses). 7.5:1-equivalent on yu-navy-deepest; fine for 12px text.'),
  c('white-a40', alpha(tw.white, 0.4), 'text-white/40: the faintest copyright line on dark surfaces. Decorative-grade contrast only.'),
  c('white-a20', alpha(tw.white, 0.2), 'bg-white/20 and border-white/20: glass chips and dividers on dark hero and auth panel.'),
  c('white-a10', alpha(tw.white, 0.1), 'bg-white/10, border-white/10: the quietest glass fill and hairline on dark surfaces; the hero badge and the lightbox close button at rest.'),
  p('black', 'Only through alpha: overlays and the .bg-dots / .bg-grid patterns.'),
  c('black-a50', alpha(tw.black, 0.5), 'bg-black/50: modal backdrop (7 uses).'),
  c('black-a40', alpha(tw.black, 0.4), 'bg-black/40: lighter modal / image-zoom backdrop.'),
  c('black-a10', alpha(tw.black, 0.1), 'bg-black/10: hover wash over images; bg-black/0 is its resting state.'),
  c('black-a95', alpha(tw.black, 0.95), 'bg-black/95: the ZoomableImage lightbox backdrop.'),
  p('gray-50', 'Page background under the dashboard (the app frame is bg-gray-50), hover fill of outline buttons and list rows, PWA background_color.'),
  p('gray-100', 'Secondary Button fill, ghost Button hover, skeleton bars (with animate-pulse), subtle chips.'),
  p('gray-200', 'Secondary Button hover, Toast outer border, progress-bar tracks, dividers in cards.'),
  p('gray-300', 'Input, select and outline Button border (border-gray-300); disabled fills.'),
  p('gray-400', 'Placeholder text, icon buttons at rest, tertiary meta (82 uses). 2.6:1 on white — placeholders and icons only, never required reading.'),
  p('gray-500', 'Card descriptions, helper text and timestamps on white and gray-50 (4.8:1 / 4.6:1).'),
  p('gray-600', 'Secondary body copy on white and gray-50 (7.6:1) — the most used text color (129).'),
  p('gray-700', 'Body copy and form labels on white, gray-50 and gray-100 (103 uses).'),
  p('gray-800', 'Strong body copy and card headings.'),
  p('gray-900', 'Primary text: Card text color, page titles, Toast message, secondary Button label. Because Card sets text-gray-900 and a bare `border`, this is also the color of Card and SemesterColumn hairlines under Tailwind v4 (see border-default).'),
  p('slate-50', 'Planner semester-column and admin table header background.'),
  p('slate-100', 'Planner card hover, row hover and chip fills.'),
  p('slate-200', 'Hairline border of planner cards, semester columns, requirement rows and admin tables (border-slate-200, 87 uses); progress-bar tracks in the planner.'),
  p('slate-300', 'Planner drop-zone dashed border and disabled text on slate surfaces.'),
  p('slate-400', 'Planner meta text and empty-state icons (2.6:1 on white — meta only). Admin mono IDs.'),
  p('slate-500', 'Planner secondary text on white (4.8:1).'),
  p('slate-600', 'Planner and requirements body copy on white and slate-50 (7.5:1).'),
  p('slate-700', 'Planner headings and course names on white (58 uses).'),
  p('slate-800', 'Planner strong text.'),
  p('slate-900', 'Planner page titles; bg-slate-900/75 is the image-zoom overlay.'),
  c('slate-900-a75', alpha(tw['slate-900'], 0.75), 'bg-slate-900/75: a dark image backdrop.'),
  c('slate-950-a85', '#020618d9', 'bg-slate-950/85: the graduation-guide lightbox backdrop.'),
  c('amber-50-a50', alpha(tw['amber-50'], 0.5), 'bg-amber-50/50: selected calendar day on mobile.'),
  c('blue-300-a50', alpha(tw['blue-300'], 0.5), 'ring-blue-300/50: the one-time pulse hint ring on a planned compact status pill.'),
  c('gray-200-a50', alpha(tw['gray-200'], 0.5), 'border-gray-200/50: the landing glass nav hairline.'),
  c('green-50-a30', alpha(tw['green-50'], 0.3), 'bg-green-50/30: surface of a feedback card that has an admin reply (with a green-400 left rail).'),

  // ---- Status: danger / warning / success / info families
  p('red-50', 'Error banner and failed-course background.'),
  p('red-100', 'Failed-course and error chip fill; destructive hover wash.'),
  p('red-200', 'Error banner border.'),
  p('red-300', 'Error field border on tinted surfaces.'),
  p('red-400', 'Error icon tint.'),
  p('red-500', 'Validation error text and Input error border (text-red-500, 49 uses; 3.8:1 on white — the source pair, flagged; prefer red-600 for new copy). Required-field asterisks.'),
  p('red-600', 'Destructive Button fill with white text (4.8:1); error text on white (4.8:1).'),
  p('red-700', 'Destructive Button hover; error text on red-50 and red-100 (5.3:1).'),
  p('orange-50', 'Warning-lite surface.'),
  p('orange-100', 'Category chip fill (see planner semantics) and warning chips.'),
  p('orange-400', 'Warning border accent.'),
  p('orange-500', 'Warning fill and border (border-orange-500); sits under white text at 3:1 — large text only.'),
  p('orange-600', 'Warning icon and text on white (3.9:1 — flagged).'),
  p('orange-700', 'Category chip text on orange-100 (4.6:1).'),
  p('amber-50', 'Notice and prerequisite-warning banner background.'),
  p('amber-100', 'Notice chip fill.'),
  p('amber-200', 'Notice banner border; bg-amber-200 for the strongest notice fill.'),
  p('amber-300', 'Notice border accent.'),
  p('amber-400', 'ring-amber-400: highlighted-row ring; notice border.'),
  p('amber-500', 'Toast warning rail (border-l-amber-500).'),
  p('amber-600', 'Toast warning action text and notice icons (3.2:1 on white — flagged, keep as source).'),
  p('amber-700', 'Notice text on amber-100 (4.5:1); Toast warning action hover.'),
  p('amber-800', 'Notice body text on amber-50 (6.8:1).'),
  p('amber-900', 'Notice headings on amber-50.'),
  p('yellow-100', 'Pending / draft status chip fill (feedback 대기중, patch-note 초안), the Google provider badge and the feedback-new notification chip.'),
  p('yellow-400', 'Unread-count badge fill on the notification bell for admins (students get red-500); pairs with yellow-900 text.'),
  p('yellow-600', 'Rating / highlight icon.'),
  p('yellow-700', 'Pending / draft chip text on yellow-100 (4.6:1).'),
  p('yellow-900', 'Text on the admin unread badge (yellow-400).'),
  p('green-50', 'Success banner background; completed-course surface (bg-green-50/30 for the satisfied requirement row).'),
  p('green-100', 'Completed / satisfied chip fill.'),
  p('green-200', 'Success banner border.'),
  p('green-300', 'Toast graduation-delta "after" bar (behind the green-500 "before" bar).'),
  p('green-400', 'Satisfied requirement row left rail (border-l-green-400).'),
  p('green-500', 'Toast success rail (border-l-green-500); progress bar fill for satisfied requirements.'),
  p('green-600', 'Success Button fill (bg-green-600) with white text (3.2:1 — flagged); Toast success action text.'),
  p('green-700', 'Success text on white and green-100 (5.0:1 / 4.5:1); success Button hover.'),
  p('emerald-50', 'Positive stat tile surface.'),
  p('emerald-100', 'Positive stat chip fill.'),
  p('emerald-500', 'Patch-note "new" rail (border-t-4 border-emerald-500) and positive indicator dots.'),
  p('emerald-600', 'Positive delta text on white (3.5:1 — flagged; 3:1 is enough for the bold 18px+ stat it labels).'),
  p('emerald-700', 'Positive text on emerald-100 (4.7:1).'),
  p('teal-50', 'The {year}년 기준 badge fill in RequirementsSummary (with teal-700 text and a teal-200 border).'),
  p('teal-100', 'Teal chip fill.'),
  p('teal-200', 'Teal chip border.'),
  p('teal-700', 'Category chip text on teal-100 (4.8:1).'),
  p('sky-400', 'Calendar event dot / accent.'),
  p('blue-50', 'Info banner background; selected list row.'),
  p('blue-100', 'Category chip fill (see planner semantics); info chip (21 uses).'),
  p('blue-200', 'Info banner border.'),
  p('blue-300', 'ring-blue-300/50: soft selection ring.'),
  p('blue-400', 'Calendar: today cell border on mobile (border-blue-400).'),
  p('blue-500', 'ring-blue-500: focus ring on form fields that do not use yu-cyan (8 uses); calendar today cell 2px border from md; active catalog 교양필수 chip.'),
  p('blue-600', 'Info text and link-blue on white (4.6:1+); info Button fill.'),
  p('blue-700', 'Category chip text on blue-100 (5.6:1); info text.'),
  p('indigo-50', 'Landing gradient end stop (to-indigo-50).'),
  p('indigo-100', 'Chip fill.'),
  p('indigo-500', 'Statistics bar fill.'),
  p('indigo-600', 'Indigo text on white.'),
  p('indigo-700', 'Indigo chip text on indigo-100 (6.6:1).'),
  p('violet-50', 'Violet chip surface.'),
  p('violet-100', 'Category chip fill (see planner semantics).'),
  p('violet-200', 'Violet chip border.'),
  p('violet-500', 'Statistics bar fill.'),
  p('violet-600', 'Violet text on white.'),
  p('violet-700', 'Category chip text on violet-100 (6.2:1).'),
  p('purple-50', 'Purple chip surface; inactive 복수전공 filter chip.'),
  c('purple-50-a30', alpha(tw['purple-50'], 0.3), 'bg-purple-50/30: the dashed preview frame tint in PatchNotePreview (admin).'),
  p('purple-100', 'Category chip fill (see planner semantics), 16 uses.'),
  p('purple-200', 'Purple chip border.'),
  p('purple-400', 'Purple border accent.'),
  p('purple-500', 'Purple border / fill accent.'),
  p('purple-600', 'Category text on white (16 uses) and on purple-100 (4.7:1).'),
  p('purple-700', 'Category chip text on purple-100 (6.0:1).'),
  p('rose-50', 'Rose chip surface; inactive 전공필수 filter chip.'),
  p('rose-500', 'Active 전공필수 filter chip fill with white text (4.1:1 — flagged, kept).'),
  p('rose-100', 'Category chip fill (see planner semantics).'),
  p('rose-200', 'Rose chip border.'),
  p('rose-600', 'Rose text on white.'),
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
  c('ink-muted', '{gray-600}', 'Alias. Secondary copy on surface and surface-muted (7.6:1).'),
  c('ink-subtle', '{gray-500}', 'Alias. Helper text and timestamps (4.8:1 on surface).'),
  c('ink-placeholder', '{gray-400}', 'Alias. Placeholders and resting icons only.'),
  c('line', '{slate-200}', 'Alias. Hairlines on planner cards, columns and tables.'),
  c('line-neutral', '{gray-200}', 'Alias. Hairlines on Toast, cards and dividers outside the planner.'),
  c('line-input', '{gray-300}', 'Alias. Input, select and outline Button border.'),
  c('focus-ring', '{yu-cyan}', 'Alias. 2px focus ring on Input and SearchableSelect (focus:ring-2 focus:ring-[#00AACA] with the border turned transparent).'),
  c('focus-ring-form', '{blue-500}', 'Alias. 2px focus ring on plain form controls that use Tailwind blue instead of yu-cyan.'),
  c('danger', '{red-600}', 'Alias. Destructive fills (white text) and error text.'),
  c('danger-soft', '{red-50}', 'Alias. Error banner surface; pair with red-700 text.'),
  c('warning', '{amber-500}', 'Alias. Warning rails and icons.'),
  c('warning-soft', '{amber-50}', 'Alias. Notice surface; pair with amber-800 text.'),
  c('success', '{green-500}', 'Alias. Success rails and satisfied progress fills.'),
  c('success-soft', '{green-100}', 'Alias. Completed and satisfied chip fill; pair with green-700 text.'),
  c('info', '{yu-blue}', 'Alias. Info rail and progress fill.'),
  c('info-soft', '{blue-50}', 'Alias. Info banner surface; pair with blue-700 text.'),
  c('border-default', '{gray-900}', 'Alias. What a bare Tailwind `border` renders as under v4: 1px solid currentColor, which on Card (text-gray-900) is this dark line. Semester columns, Card and the default status pill really do draw this near-black hairline; planner rows that want a light line say border-slate-200 or border-gray-100 explicitly.'),
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
  c('category-teaching-text', '{violet-700}', 'Alias. 교직 chip text (6.2:1).'),
  c('category-free-elective-bg', '{gray-100}', 'Alias. 자유선택 (free_elective) chip fill and the fallback for unknown categories.'),
  c('category-free-elective-text', '{gray-600}', 'Alias. 자유선택 chip text (7.2:1).'),
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
        { name: 'display-xl', fontSize: '72px', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.025em', sample: '졸업까지, 한눈에', usage: 'Landing hero headline at lg (text-7xl font-bold tracking-tight).' },
        { name: 'display-lg', fontSize: '60px', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.025em', usage: 'Landing hero headline at md (text-6xl).' },
        { name: 'display-md', fontSize: '48px', lineHeight: 1, fontWeight: 700, letterSpacing: '-0.025em', usage: 'Landing hero headline on mobile (text-5xl); 404 and error page numerals.' },
        { name: 'display-sm', fontSize: '36px', lineHeight: '40px', fontWeight: 700, usage: 'Landing section titles at md (text-4xl font-bold); large stat values.' },
      ],
    },
    {
      name: 'Headings',
      family: 'body',
      styles: [
        { name: 'heading-1', fontSize: '30px', lineHeight: '36px', fontWeight: 700, usage: 'Landing section titles on mobile (text-3xl); auth panel headline.' },
        { name: 'heading-2', fontSize: '24px', lineHeight: '32px', fontWeight: 700, usage: 'Dashboard page titles (text-2xl font-bold text-gray-900); CardTitle at 600 weight with leading-none tracking-tight.' },
        { name: 'heading-3', fontSize: '20px', lineHeight: '28px', fontWeight: 600, usage: 'Card and modal titles (text-xl font-semibold).' },
        { name: 'heading-4', fontSize: '18px', lineHeight: '28px', fontWeight: 600, usage: 'Section headings inside cards (text-lg font-semibold).' },
      ],
    },
    {
      name: 'Body',
      family: 'body',
      styles: [
        { name: 'body', fontSize: '16px', lineHeight: '24px', fontWeight: 400, usage: 'Lead paragraphs and prose (text-base); landing copy adds leading-relaxed (1.625).' },
        { name: 'body-relaxed', fontSize: '16px', lineHeight: 1.625, fontWeight: 400, usage: 'Help articles, legal pages and landing descriptions (text-base leading-relaxed, 42 uses).' },
        { name: 'body-sm', fontSize: '14px', lineHeight: '20px', fontWeight: 400, usage: 'The default UI size: inputs, table cells, list rows, Card descriptions (text-sm, 393 uses).' },
        { name: 'body-sm-medium', fontSize: '14px', lineHeight: '20px', fontWeight: 500, usage: 'Button labels, form labels, nav links, Toast message, course names on CourseCard (text-sm font-medium, the most common weight at 266 uses).' },
        { name: 'body-sm-semibold', fontSize: '14px', lineHeight: '20px', fontWeight: 600, usage: 'Column headers and emphasized values (text-sm font-semibold).' },
        { name: 'caption', fontSize: '12px', lineHeight: '16px', fontWeight: 400, usage: 'Meta text, helper text, Toast description, table captions (text-xs, 247 uses).' },
        { name: 'caption-medium', fontSize: '12px', lineHeight: '16px', fontWeight: 500, usage: 'Chips and badges (text-xs font-medium), Toast action label, tab labels.' },
      ],
    },
    {
      name: 'Micro',
      family: 'body',
      styles: [
        { name: 'micro-11', fontSize: '11px', lineHeight: '16px', fontWeight: 500, usage: 'Dense planner labels and credit counts (text-[11px], 13 uses). Arbitrary sizes inherit the 1.5 line-height.' },
        { name: 'micro-10', fontSize: '10px', lineHeight: '15px', fontWeight: 500, usage: 'Category chips inside CourseCard, Toast delta counters (text-[10px], 22 uses).' },
        { name: 'micro-9', fontSize: '9px', lineHeight: '13.5px', fontWeight: 500, usage: 'The smallest label, on compact planner chips (text-[9px]).' },
        { name: 'overline', fontSize: '12px', lineHeight: '16px', fontWeight: 600, letterSpacing: '0.1em', usage: 'Uppercase section eyebrows on the landing page (text-xs font-semibold tracking-widest uppercase).' },
      ],
    },
    {
      name: 'Code',
      family: 'mono',
      styles: [
        { name: 'mono-sm', fontSize: '14px', lineHeight: '20px', fontWeight: 400, usage: 'Identifiers in the admin users table (font-mono text-slate-400). The only use of Geist Mono.' },
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
  c('space-7', '28px', 'p-7 landing feature cards.'),
  c('space-8', '32px', 'p-8 auth form panel and modal body; px-8 large Button; mb-8 page header to content.'),
  c('space-10', '40px', 'p-10, mt-10, gap-10 on landing sections.'),
  c('space-12', '48px', 'p-12 landing cards at md; py-12 section padding on mobile.'),
  c('space-16', '64px', 'py-16 landing section padding; mb-16 between landing blocks.'),
  c('space-20', '80px', 'py-20 landing hero padding; mb-20.'),
  c('space-24', '96px', 'py-24 tall landing sections.'),
  c('space-32', '128px', 'py-32 the hero at lg.'),
] };

// ---------------------------------------------------------------- radius
const radius = { note: 'Tailwind v4 radii. rounded (4px) is the Tailwind "sm" step; the app never uses 3xl or larger.', tokens: [
  c('radius-xs', '2px', 'rounded-[2px]: planner micro chips and progress bar ends.'),
  c('radius-sm', '4px', 'rounded: badges, small chips, table cell highlights (39 uses).'),
  c('radius-md', '6px', 'rounded-md: Button, Input, SearchableSelect, Toast action button (46 uses).'),
  c('radius-lg', '8px', 'rounded-lg: Card, Toast, CourseCard, list rows, banners — the default container radius (188 uses).'),
  c('radius-xl', '12px', 'rounded-xl: modal panels, stat tiles, landing feature cards (29 uses).'),
  c('radius-2xl', '16px', 'rounded-2xl: large landing cards, auth form panel, hero chips (49 uses).'),
  c('radius-full', '9999px', 'rounded-full: pills, avatars, progress bars, deco dots, icon buttons (107 uses).'),
] };

// ---------------------------------------------------------------- shadow
const shadow = { note: 'Tailwind v4 shadows plus two custom ones from globals.css. In v4 the bare "shadow" utility equals shadow-sm.', tokens: [
  c('shadow-sm', '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', 'Card and primary Button at rest (shadow-sm; the bare shadow utility renders the same).'),
  c('shadow-md', '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', 'Card and primary Button on hover (hover:shadow-md).'),
  c('shadow-lg', '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 'Toast, dropdown menus (SearchableSelect list), floating panels, and the planner\'s CourseCard drag overlay (DragOverlay wrapper).'),
  c('shadow-xl', '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', 'Modal panels (CustomCourseForm and the admin dialogs).'),
  c('shadow-2xl', '0 25px 50px -12px rgb(0 0 0 / 0.25)', 'Landing hero screenshot frame and the auth form panel.'),
  c('shadow-glow', '0 4px 24px rgba(21, 57, 116, 0.2), 0 0 48px rgba(0, 170, 202, 0.08)', '.shadow-glow: the landing primary CTA — a navy glow with a faint cyan halo.'),
  c('shadow-card-hover', '0 12px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)', '.card-hover:hover: landing feature cards lift 4px and take this shadow.'),
] };

// ---------------------------------------------------------------- size (control and icon sizes)
const size = { note: 'Fixed sizes from h-*/w-* utilities and max-w-* containers.', tokens: [
  c('control-sm', '36px', 'Button size="sm" height (h-9).'),
  c('control-md', '40px', 'Button default and icon size, Input height (h-10).'),
  c('control-lg', '44px', 'Button size="lg" height (h-11).'),
  c('icon-xs', '12px', 'h-3 w-3 micro icons in chips.'),
  c('icon-sm', '14px', 'h-3.5 w-3.5 icons in dense planner rows.'),
  c('icon-md', '16px', 'h-4 w-4 — the default Lucide icon size in buttons and rows (53 uses); the Button spinner.'),
  c('icon-lg', '20px', 'h-5 w-5 nav and card header icons.'),
  c('icon-xl', '24px', 'h-6 w-6 feature icons and empty-state glyphs.'),
  c('icon-2xl', '32px', 'h-8 w-8 stat tile icons and icon-button hit areas.'),
  c('avatar', '48px', 'h-12 w-12 avatar and landing feature icon tiles.'),
  c('progress-track', '6px', 'h-1.5 progress bars in Toast and requirement rows.'),
  c('progress-track-sm', '4px', 'h-1 the thinnest progress rail.'),
  c('container-xs', '320px', 'max-w-xs: narrow dialogs and toasts (sm:max-w-sm is 384px).'),
  c('container-sm', '384px', 'max-w-sm: Toast stack width on sm+.'),
  c('container-md', '448px', 'max-w-md: auth form panel, small modals, AddSemesterDialog and CustomCourseForm panels.'),
  c('container-lg', '512px', 'max-w-lg: the calendar event modal and admin form modals.'),
  c('container-xl', '576px', 'max-w-xl.'),
  c('container-2xl', '672px', 'max-w-2xl: help articles, patch notes, profile forms (13 uses).'),
  c('container-3xl', '768px', 'max-w-3xl: wide modals and legal pages.'),
  c('container-4xl', '896px', 'max-w-4xl: statistics.'),
  c('container-5xl', '1024px', 'max-w-5xl: landing content column.'),
  c('container-6xl', '1152px', 'max-w-6xl: dashboard content column.'),
  c('container-7xl', '1280px', 'max-w-7xl: the nav bar and planner frame.'),
] };

// ---------------------------------------------------------------- motion-adjacent plain values
const duration = { note: 'Durations from transition/animation utilities and globals.css keyframes.', tokens: [
  c('duration-fast', '150ms', 'Tailwind default transition (transition-colors without a duration, 153 uses).'),
  c('duration-base', '200ms', 'Button and Input transition-all duration-200; .drag-scroll-active fade.'),
  c('duration-slow', '300ms', 'Card shadow transition; animate-scale-in, slide-up, slide-down; .card-hover.'),
  c('duration-enter', '500ms', 'fadeInDown, slideInLeft, slideInRight entrances.'),
  c('duration-enter-long', '600ms', 'fadeIn and fadeInUp entrances (animate-fade-in-up, 17 uses); bounceSoft.'),
  c('duration-scroll', '700ms', '.animate-on-scroll reveal (opacity and transform).'),
  c('duration-ambient', '3s', 'float loop; pulseSoft is 2s, gradientShift 8s, shimmer 2s, cursorBlink 1s.'),
] };
const easing = { note: 'Timing functions used by the app.', tokens: [
  c('ease-standard', 'cubic-bezier(0.4, 0, 0.2, 1)', 'Tailwind default and the .card-hover / .animate-on-scroll curve.'),
  c('ease-out', 'cubic-bezier(0, 0, 0.2, 1)', 'Tailwind ease-out used by every entrance keyframe utility (ease-out both).'),
  c('ease-in-out', 'cubic-bezier(0.4, 0, 0.2, 1)', 'float and pulseSoft loops (ease-in-out).'),
] };
const opacity = { note: 'Opacity steps used by utilities and globals.css.', tokens: [
  c('opacity-disabled', '0.5', 'disabled:opacity-50 on Button and Input (25 uses).'),
  c('opacity-drag-scroll', '0.3', '.drag-scroll-active: the planner fades while auto-scrolling a drag.'),
  c('opacity-spinner-track', '0.25', 'The Button spinner circle.'),
  c('opacity-spinner-head', '0.75', 'The Button spinner arc.'),
  c('opacity-hover-wash', '0.9', 'opacity-90 hover on image CTAs.'),
] };
const zIndex = { note: 'Layer order.', tokens: [
  c('z-base', '0', 'Hero background layers (z-0).'),
  c('z-raised', '5', 'z-[5] decorative rings above the hero background.'),
  c('z-sticky', '10', 'Sticky planner headers and nav dropdown (z-10).'),
  c('z-overlay', '40', 'Mobile nav drawer backdrop (z-40).'),
  c('z-modal', '50', 'Modals, Toast stack, the fixed nav bar (z-50, 19 uses).'),
] };

const tokens = {
  name: 'Course Planner',
  version: 1,
  meta: {
    source: 'github',
    repo: 'hwankr/course-planner',
    ref: 'claude/design-system-extraction-t0lw70@b3e587f',
    package: '.',
    tailwind: '4.1.18 (no tailwind.config; defaults + arbitrary values)',
    paths: {
      tokens: ['src/app/globals.css', 'src/app/manifest.ts'],
      fonts: ['src/app/layout.tsx (next/font/google Geist, Geist_Mono — hosted, no files)'],
      assets: ['public/yu-logo.svg', 'public/yu-logo-white.svg', 'public/icon-*.png', 'src/app/apple-icon.png', 'src/app/opengraph-image.png', 'public/help/*.png'],
      docs: ['CLAUDE.md', 'README.md'],
    },
    synced: '2026-10-22',
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
