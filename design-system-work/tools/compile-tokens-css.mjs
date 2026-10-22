// Local-only compiler: tokens.json → tokens.css laid out like the Design System page compiles it.
// Used ONLY for headless render checks; never published (the page generates its own tokens.css).
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const t = JSON.parse(fs.readFileSync(path.join(here, '../ds/project/tokens.json'), 'utf8'));
const esc = n => n.replace(/\./g, '\\.');
const val = (v, theme) => (typeof v === 'string' ? v : (v[theme] ?? v[t.color.themes[0].id]));
const colorVal = v => { const m = /^\{(.+)\}$/.exec(v); return m ? `var(--${esc(m[1])})` : v; };
let css = `/* ${t.name} — generated from tokens.json (local render-check copy) */\n`;
const first = t.color.themes[0].id;
css += `:root, [data-theme="${first}"] {\n`;
for (const c of t.color.tokens) css += `  --${esc(c.name)}: ${colorVal(val(c.value, first))};\n`;
if (t.shadow) for (const s of t.shadow.tokens) css += `  --${esc(s.name)}: ${val(s.value, first)};\n`;
css += `}\n:root {\n`;
for (const fam of ['spacing', 'radius', 'size', 'duration', 'easing', 'opacity', 'zIndex']) {
  if (!t[fam]) continue;
  for (const x of t[fam].tokens) css += `  --${esc(x.name)}: ${x.value};\n`;
}
for (const [k, stack] of Object.entries(t.type.families)) css += `  --font-${k}: ${stack};\n`;
css += `}\n`;
for (const g of t.type.groups) for (const s of g.styles) {
  const fam = s.family || g.family;
  css += `.${esc(s.name)} { font-family: var(--font-${fam}); font-size: ${s.fontSize};`;
  if (s.lineHeight != null) css += ` line-height: ${s.lineHeight};`;
  if (s.fontWeight != null) css += ` font-weight: ${s.fontWeight};`;
  if (s.letterSpacing) css += ` letter-spacing: ${s.letterSpacing};`;
  if (s.fontStyle) css += ` font-style: ${s.fontStyle};`;
  css += ` }\n`;
}
const out = path.join(here, '../render/tokens.css');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, css);
console.log('wrote', out, css.length, 'bytes');
