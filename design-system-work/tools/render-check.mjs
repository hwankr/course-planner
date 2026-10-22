// Headless render check for component previews.
// Usage: node tools/render-check.mjs [CompName ...]   (no args = every components/*/preview.html)
// Writes render/<Comp>.png and render/report.json; prints console errors and blank-page warnings.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('/opt/node-tools/node_modules/playwright/index.js');

const here = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.join(here, '../ds/project');
const RENDER = path.join(here, '../render');
fs.mkdirSync(path.join(RENDER, '_pages'), { recursive: true });

const tokensCss = fs.readFileSync(path.join(RENDER, 'tokens.css'), 'utf8');
const bundleCssPath = path.join(ROOT, 'components/bundle.css');
const bundleCss = fs.existsSync(bundleCssPath) ? fs.readFileSync(bundleCssPath, 'utf8') : '';

const want = process.argv.slice(2);
const comps = fs.readdirSync(path.join(ROOT, 'components'))
  .filter(d => fs.existsSync(path.join(ROOT, 'components', d, 'preview.html')))
  .filter(d => !want.length || want.includes(d));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const report = [];
for (const comp of comps) {
  const src = fs.readFileSync(path.join(ROOT, 'components', comp, 'preview.html'), 'utf8');
  const lines = src.split('\n');
  const marker = lines[0];
  const m = /height=(\d+)/.exec(marker);
  const height = m ? +m[1] : 120;
  const w = /width=(\d+)/.exec(marker);
  const width = w ? +w[1] : 960;
  let html = lines.slice(1).join('\n');
  // emulate the frame: tokens.css then bundle.css preloaded, data-theme on <html>, assets served from the system root
  const inject = `<style id="tokens">${tokensCss}</style><style id="bundle">${bundleCss}</style>`;
  html = html.replace(/<html([^>]*)>/i, (s, a) => (/data-theme/.test(a) ? s : `<html${a} data-theme="light">`));
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${inject}`) : html.replace(/<html[^>]*>/i, s => `${s}<head>${inject}</head>`);
  // map uploaded assets (/_blob/<id>) to their local files so images render offline
  if (!globalThis.__blobMap) {
    const ids = JSON.parse(fs.readFileSync(path.join(here, '../asset-ids.json'), 'utf8'));
    globalThis.__blobMap = {};
    for (const [group, files] of Object.entries(ids)) for (const [name, r] of Object.entries(files)) globalThis.__blobMap[r.blob] = 'file://' + path.join(ROOT, 'assets', group, name);
  }
  html = html.replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => globalThis.__blobMap[id] || m);
  const pagePath = path.join(RENDER, '_pages', `${comp}.html`);
  fs.writeFileSync(pagePath, html);

  const page = await browser.newPage({ viewport: { width, height: Math.max(height, 40) }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => errors.push('request failed: ' + r.url()));
  // relative ../../assets/.. resolve against the components/<Comp>/ folder: serve from file://
  await page.goto('file://' + path.join(ROOT, 'components', comp, '__render__.html').replace('__render__.html', '') + '../../../../render/_pages/' + comp + '.html').catch(async () => {
    await page.goto('file://' + pagePath);
  });
  await page.waitForTimeout(250);
  const docH = await page.evaluate(() => document.documentElement.scrollHeight);
  const nonWhite = await page.evaluate(() => {
    const els = [...document.body.querySelectorAll('*')];
    return els.length;
  });
  const png = path.join(RENDER, `${comp}.png`);
  await page.screenshot({ path: png, fullPage: true });
  report.push({ comp, height, docH, elements: nonWhite, errors });
  console.log(`${comp.padEnd(24)} marker=${height}px rendered=${docH}px els=${nonWhite} ${errors.length ? 'ERRORS: ' + errors.join(' | ') : 'ok'}`);
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(RENDER, 'report.json'), JSON.stringify(report, null, 1));
