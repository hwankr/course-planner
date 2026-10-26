// Tailwind v4 wraps every hover: / group-hover: rule in @media (hover: hover). This moves each fragment's real :hover
// selectors into such a block, leaving the .is-hover preview mirrors (and any other selectors) where they were.
// Usage: node tools/hover-media.mjs [--check] [Card ...]   (no names = every fragment)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const here = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(path.join(here, '../vendor-pkg/pc/package.json'));
const postcss = require('postcss');
const FR = process.env.HM_DIR || path.join(here, '../_work/fragments');
const argv = process.argv.slice(2);
const check = argv.includes('--check');
const names = argv.filter(a => a !== '--check');
const list = names.length ? names.map(n => n + '.css') : fs.readdirSync(FR).filter(f => f.endsWith('.css'));
const isHoverMedia = n => n && n.type === 'atrule' && n.name === 'media' && /\(hover:\s*hover\)/.test(n.params);
const insideHover = n => { for (let p = n.parent; p; p = p.parent) if (isHoverMedia(p)) return true; return false; };
const hasHover = s => /:hover\b/.test(s.replace(/:not\([^)]*\)/g, ''));
let total = 0;
for (const f of list) {
  const file = path.join(FR, f);
  const src = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(src, { from: file });
  let moved = 0;
  root.walkRules(rule => {
    if (insideHover(rule) || (rule.parent && rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name))) return;
    const sels = rule.selectors;
    const hov = sels.filter(hasHover);
    if (!hov.length) return;
    const rest = sels.filter(s => !hasHover(s));
    const depth = (() => { let d = 0; for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) d++; return d; })();
    const ind = '  '.repeat(depth);
    const media = postcss.atRule({ name: 'media', params: '(hover: hover)' });
    const copy = rule.clone({ selectors: hov });
    copy.raws.before = '\n' + ind + '  ';
    copy.raws.between = ' ';
    copy.raws.after = '\n' + ind + '  ';
    copy.raws.selector = undefined;
    copy.each(n => { n.raws.before = '\n' + ind + '    '; });
    media.append(copy);
    media.raws.before = rest.length ? '\n' + ind : rule.raws.before;
    media.raws.between = ' ';
    media.raws.afterName = ' ';
    media.raws.after = '\n' + ind;
    if (rest.length) {
      rule.selectors = rest;
      rule.after(media);
    } else {
      rule.replaceWith(media);
    }
    moved += hov.length;
  });
  if (moved) {
    total += moved;
    if (!check) fs.writeFileSync(file, root.toString());
    console.log(`${f}: ${moved} hover selector(s) ${check ? 'would move' : 'moved'}`);
  }
}
console.log(`total: ${total}`);
