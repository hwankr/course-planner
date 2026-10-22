// Replaces {{icon:<lucide-name>|<class>}} in a template with the inline Lucide 0.563.0 SVG
// (aria-hidden, no width/height, class set) and writes the result.
// Usage: node tools/expand-icons.mjs <template> <out>
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const [src, out] = process.argv.slice(2);
let html = fs.readFileSync(src, 'utf8');
html = html.replace(/\{\{icon:([a-z0-9-]+)\|([^}]*)\}\}/g, (m, name, cls) => {
  let svg = fs.readFileSync(path.join(here, '../vendor/lucide', name + '.svg'), 'utf8');
  svg = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  svg = svg.replace(/ class="[^"]*"/, '').replace(/ width="24"/, '').replace(/ height="24"/, '');
  return svg.replace('<svg', `<svg class="${cls}" aria-hidden="true"`).replace(/> </g, '><');
});
if (/\{\{icon:/.test(html)) throw new Error('unexpanded icon placeholder');
fs.writeFileSync(out, html);
console.log('wrote', out, html.length, 'bytes');
