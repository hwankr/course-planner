// Assembles components/bundle.css and components/index.d.ts from the per-component fragments.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const DS = path.join(here, '../ds/project');
const FR = path.join(here, '../_work/fragments');
const DT = path.join(here, '../_work/dts');
const ORDER = [
  'Button', 'Card', 'Input', 'Toast', 'SearchableSelect', 'Footer', 'ZoomableImage', 'ErrorBoundary',
  'CourseCard', 'SemesterColumn', 'ReadOnlySemesterColumn', 'RequirementsSummary', 'RequirementForm',
  'CustomCourseForm', 'AddSemesterDialog', 'CourseCatalog', 'AllPlansModal', 'AnonymousPlanModal', 'PatchNotePreview',
  'AppHeader', 'AuthLayout', 'PageHeader', 'FilterChips', 'Badge', 'Callout', 'StatusStates', 'Statistics', 'Onboarding',
  'CalendarGrid', 'HelpSection', 'AdminList', 'FeedbackCard', 'ProfileCard', 'PatchNotes', 'ModalShell',
];
const present = (dir, ext) => fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(ext)).map(f => f.slice(0, -ext.length)) : [];
const sortByOrder = names => [...names].sort((a, b) => {
  const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
  return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
});

let css = `/* Course Planner — components/bundle.css\n   Static renditions hand-translated from src/components and src/app (Tailwind v4.1.18 utility classes → CSS).\n   Every value is var(--token, literal); token names and literals come from tokens.json. Blocks are .cp-<component>. */\n\n`;
const complete = n => fs.existsSync(path.join(DS, 'components', n, 'preview.html')) && fs.existsSync(path.join(DS, 'components', n, 'README.md'));
const skipped = present(FR, '.css').filter(n => !complete(n));
if (skipped.length) console.log('skipping incomplete cards (no preview/README):', skipped.join(', '));
const cssNames = sortByOrder(present(FR, '.css').filter(complete));
for (const n of cssNames) {
  let frag = fs.readFileSync(path.join(FR, n + '.css'), 'utf8').trim();
  if (/<\/style/i.test(frag)) throw new Error(`fragment ${n} contains </style`);
  css += `/* ===== ${n} ===== */\n${frag}\n\n`;
}
fs.mkdirSync(path.join(DS, 'components'), { recursive: true });
fs.writeFileSync(path.join(DS, 'components/bundle.css'), css);

let dts = `// Course Planner — components/index.d.ts\n// Props of the app's React components (src/components), copied from their TypeScript sources.\n// Documentation only: the design system ships static renditions, not the React code.\n\n`;
const dtsNames = sortByOrder(present(DT, '.d.ts').filter(complete));
for (const n of dtsNames) {
  const frag = fs.readFileSync(path.join(DT, n + '.d.ts'), 'utf8').trim();
  dts += `// ----- ${n} -----\n${frag}\n\n`;
}
fs.writeFileSync(path.join(DS, 'components/index.d.ts'), dts);

// report var() names that are not tokens
const tokens = JSON.parse(fs.readFileSync(path.join(DS, 'tokens.json'), 'utf8'));
const names = new Set();
for (const fam of ['color', 'spacing', 'radius', 'shadow', 'size', 'duration', 'easing', 'opacity', 'zIndex']) for (const t of tokens[fam].tokens) names.add(t.name);
for (const k of Object.keys(tokens.type.families)) names.add('font-' + k);
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const used = new Set([...cssNoComments.matchAll(/var\(--([A-Za-z0-9_.-]+)/g)].map(m => m[1]));
const unknown = [...used].filter(u => !names.has(u));
console.log(`bundle.css: ${cssNames.length} fragments, ${css.length} bytes; index.d.ts: ${dtsNames.length} blocks, ${dts.length} bytes`);
console.log('fragments:', cssNames.join(', '));
if (unknown.length) console.log('UNKNOWN TOKENS referenced:', unknown.join(', ')); else console.log('all var() names are tokens');
// fallback literal check: var(--name, literal) literal should equal the token value (colors only, exact string compare after lowercasing)
const byName = {}; for (const fam of ['color', 'spacing', 'radius', 'shadow', 'size', 'duration', 'easing', 'opacity', 'zIndex']) for (const t of tokens[fam].tokens) byName[t.name] = typeof t.value === 'string' ? t.value : t.value.light;
const resolve = (v, depth = 0) => { const m = /^\{(.+)\}$/.exec(v); return m && depth < 16 ? resolve(byName[m[1]], depth + 1) : v; };
const bad = [];
for (const m of cssNoComments.matchAll(/var\(--([A-Za-z0-9_.-]+)\s*,\s*([^()]*?(?:\([^()]*\))?[^()]*?)\)/g)) {
  const n = m[1], lit = m[2].trim().toLowerCase().replace(/\s+/g, ' ');
  if (!byName[n]) continue;
  const want = resolve(byName[n]).toLowerCase().replace(/\s+/g, ' ');
  const norm = v => (v === 'transparent' ? '#00000000' : v);
  if (norm(lit) !== norm(want)) bad.push(`${n}: fallback "${lit}" ≠ token "${want}"`);
}
if (bad.length) { console.log(`FALLBACK MISMATCHES (${bad.length}):`); for (const b of [...new Set(bad)]) console.log('  ' + b); } else console.log('all fallbacks match token values');
