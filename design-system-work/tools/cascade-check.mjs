// Finds declarations a card meant for an element (a rule whose last compound names one of the element's own
// classes) that lose to a rule which does not name the element's classes (a type/attribute/universal reset).
// Usage: node tools/cascade-check.mjs [Card ...]   — reads ds/project/components/<Card>/preview.html + bundle.css
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');
const here = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(here, '../ds/project');
const tokens = fs.readFileSync(path.join(here, '../render/tokens.css'), 'utf8');
const bundle = fs.readFileSync(path.join(ROOT, 'components/bundle.css'), 'utf8');
const want = process.argv.slice(2);
const comps = fs.readdirSync(path.join(ROOT, 'components')).filter(d => fs.existsSync(path.join(ROOT, 'components', d, 'preview.html'))).filter(d => !want.length || want.includes(d));
const browser = await chromium.launch();
let total = 0;
for (const comp of comps) {
  let html = fs.readFileSync(path.join(ROOT, 'components', comp, 'preview.html'), 'utf8').split('\n').slice(1).join('\n');
  html = html.replace(/<head([^>]*)>/i, `<head$1><style id="tokens">${tokens}</style><style id="bundle">${bundle}</style>`);
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  const found = await page.evaluate(() => {
    const spec = sel => {
      // specificity of one complex selector: [ids, classes, types]; :where = 0, :is/:not/:has = max of args
      let a = 0, b = 0, c = 0;
      let s = sel;
      const fn = /:(where|is|not|has)\(/;
      let m;
      while ((m = fn.exec(s))) {
        let i = m.index + m[0].length, depth = 1;
        while (i < s.length && depth) { if (s[i] === '(') depth++; else if (s[i] === ')') depth--; i++; }
        const inner = s.slice(m.index + m[0].length, i - 1);
        if (m[1] !== 'where') {
          const best = inner.split(',').map(x => spec(x.trim())).sort((x, y) => (y[0] - x[0]) || (y[1] - x[1]) || (y[2] - x[2]))[0] || [0, 0, 0];
          a += best[0]; b += best[1]; c += best[2];
        }
        s = s.slice(0, m.index) + ' ' + s.slice(i);
      }
      s = s.replace(/\[[^\]]*\]/g, () => { b++; return ' '; });
      s = s.replace(/::[a-z-]+(\([^)]*\))?/g, () => { c++; return ' '; });
      s = s.replace(/:[a-z-]+(\([^)]*\))?/g, () => { b++; return ' '; });
      s = s.replace(/#[\w-]+/g, () => { a++; return ' '; });
      s = s.replace(/\.[\w-]+/g, () => { b++; return ' '; });
      (s.match(/(^|[\s>+~])[a-z][a-z0-9-]*/gi) || []).forEach(() => c++);
      return [a, b, c];
    };
    const splitList = t => { const out = []; let d = 0, cur = ''; for (const ch of t) { if (ch === '(' ) d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
    const lastCompound = sel => { const parts = sel.split(/\s*[>+~]\s*|\s+(?![^(]*\))/).filter(Boolean); return parts[parts.length - 1] || ''; };
    const rules = [];
    let order = 0;
    const sheet = document.getElementById('bundle').sheet;
    const walk = (list, media) => { for (const r of list) {
      if (r.type === 1) rules.push({ sel: r.selectorText, style: r.style, order: order++, media });
      else if (r.cssRules && (r.type !== 4 || matchMedia(r.media.mediaText).matches)) walk(r.cssRules, r.media ? r.media.mediaText : media);
    } };
    walk(sheet.cssRules, '');
    const out = [];
    for (const el of document.body.querySelectorAll('*')) {
      const own = [...el.classList].filter(c => c.startsWith('cp-'));
      if (!own.length) continue;
      const decls = {}; // prop -> list of {spec, order, sel, value, ownRule}
      for (const r of rules) {
        let best = null;
        for (const s of splitList(r.sel)) { let ok = false; try { ok = el.matches(s); } catch {} if (ok) { const sp = spec(s); if (!best || (sp[0] - best.sp[0] || sp[1] - best.sp[1] || sp[2] - best.sp[2]) > 0) best = { s, sp }; } }
        if (!best) continue;
        const lc = lastCompound(best.s);
        const ownRule = own.some(c => new RegExp('\\.' + c.replace(/[-]/g, '\\-') + '(?![\\w-])').test(lc));
        for (let i = 0; i < r.style.length; i++) {
          const p = r.style[i];
          if (!/^(margin|padding)/.test(p)) continue;
          (decls[p] = decls[p] || []).push({ sp: best.sp, order: r.order, sel: best.s, value: r.style.getPropertyValue(p), imp: r.style.getPropertyPriority(p), ownRule });
        }
      }
      for (const [p, list] of Object.entries(decls)) {
        list.sort((x, y) => ((y.imp ? 1 : 0) - (x.imp ? 1 : 0)) || (y.sp[0] - x.sp[0]) || (y.sp[1] - x.sp[1]) || (y.sp[2] - x.sp[2]) || (y.order - x.order));
        const win = list[0];
        if (win.ownRule) continue;
        // a space-y/space-x parent rule beating a child's own margin: 0 reset is the intended v4 result
        if (/>\s*:not\(:last-child\)\s*$/.test(win.sel)) { if (!list.some(d => d.ownRule && !/^0(px)?$/.test(d.value.trim()) && d.value !== win.value)) continue; }
        const loser = list.find(d => d.ownRule && d.value !== win.value);
        if (loser) out.push({ el: el.tagName.toLowerCase() + '.' + own.join('.'), prop: p, winner: `${win.sel} → ${win.value}`, lost: `${loser.sel} → ${loser.value}` });
      }
    }
    return out;
  });
  // collapse duplicates
  const seen = new Set();
  const uniq = found.filter(f => { const k = f.prop + f.winner + f.lost; if (seen.has(k)) return false; seen.add(k); return true; });
  if (uniq.length) { console.log(`== ${comp}`); for (const f of uniq) console.log(`  ${f.el} ${f.prop}: wins ${f.winner} | loses ${f.lost}`); }
  total += uniq.length;
  await page.close();
}
await browser.close();
console.log('total:', total);
