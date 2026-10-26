// WCAG 2.x contrast. Colors are token names from ds/project/tokens.json or hex (#rgb, #rrggbb, #rrggbbaa).
// Usage: node tools/contrast.mjs <fg> <bg> [<under-bg> ...]
//   Backgrounds stack top to bottom: a translucent bg is composited over the next one; the last must be opaque
//   (white is assumed under a translucent last layer). A translucent fg is composited over the result.
//   Example: node tools/contrast.mjs yu-cyan yu-cyan-a10 white
// Prints the exact ratio (3 decimals), the 1-decimal figure to write (rounded half up, except that a figure is
// never rounded up onto a threshold it misses: 4.47 reads 4.4, 2.96 reads 2.9, 6.97 reads 6.9), and AA results
// for normal (4.5) and large/UI (3.0) text.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const T = JSON.parse(fs.readFileSync(path.join(here, '../ds/project/tokens.json'), 'utf8'));
const map = {};
for (const t of T.color.tokens) map[t.name] = t.value;
const parse = s => {
  let v = map[s] || s;
  if (/^var\(/.test(v)) v = map[v.replace(/^var\(--|\)$/g, '')] || v;
  if (!/^#[0-9a-f]+$/i.test(v)) throw new Error(`not a color: ${s} → ${v}`);
  let h = v.slice(1);
  if (h.length === 3 || h.length === 4) h = [...h].map(c => c + c).join('');
  const n = i => parseInt(h.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
};
const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
const lum = c => { const f = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
const [fgS, ...bgs] = process.argv.slice(2);
if (!fgS || !bgs.length) { console.error('usage: node tools/contrast.mjs <fg> <bg> [<under-bg> ...]'); process.exit(1); }
let bg = { r: 1, g: 1, b: 1, a: 1 };
for (const s of [...bgs].reverse()) bg = over(parse(s), bg);
const fg = over(parse(fgS), bg);
const L1 = lum(fg), L2 = lum(bg);
const r = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
let one = Math.round(r * 10 + 1e-9) / 10;
for (const th of [3, 4.5, 7]) if (r < th && one >= th) one = Math.floor(r * 10) / 10;
const hex = c => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
console.log(`${fgS} on ${bgs.join(' over ')}: ${r.toFixed(3)}:1 → write ${one.toFixed(1)}:1 · AA normal ${r >= 4.5 ? 'pass' : 'FAIL'} · AA large/UI ${r >= 3 ? 'pass' : 'FAIL'} · (fg ${hex(fg)} on bg ${hex(bg)})`);
