// Sets each preview's marker height to the headless-measured document height when they differ by more than 8px.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const report = JSON.parse(fs.readFileSync(path.join(here, '../render/report.json'), 'utf8'));
let changed = 0;
for (const r of report) {
  if (r.comp === 'Cover') continue;
  if (Math.abs(r.docH - r.height) <= 8) continue;
  const p = path.join(here, '../ds/project/components', r.comp, 'preview.html');
  const lines = fs.readFileSync(p, 'utf8').split('\n');
  const next = Math.min(4000, Math.max(40, r.docH));
  const m = lines[0].replace(/height=\d+/, `height=${next}`);
  if (m !== lines[0]) { lines[0] = m; fs.writeFileSync(p, lines.join('\n')); changed++; console.log(`${r.comp}: ${r.height} → ${next}`); }
}
console.log('markers changed:', changed);
