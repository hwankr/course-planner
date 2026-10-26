// Prints the exact CSS Tailwind CSS 4.1.18 generates for the given class names, with the app's globals.css @theme applied.
// Usage: node tools/tw.mjs space-y-2 transition-colors "hover:bg-[#003E7E]" ...
// Needs vendor-pkg/tw/package (npm pack tailwindcss@4.1.18, untarred). Utilities only (no preflight) unless --preflight.
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const PKG = path.join(here, '../vendor-pkg/tw/package');
const { compile } = await import(path.join(PKG, 'dist/lib.mjs'));
const args = process.argv.slice(2);
const pre = args.includes('--preflight');
const classes = args.filter(a => a !== '--preflight');
const css = `@layer theme, base, components, utilities;\n@import "tailwindcss/theme.css" layer(theme);\n${pre ? '@import "tailwindcss/preflight.css" layer(base);\n' : ''}@import "tailwindcss/utilities.css" layer(utilities);\n`;
const files = { 'tailwindcss/theme.css': 'theme.css', 'tailwindcss/preflight.css': 'preflight.css', 'tailwindcss/utilities.css': 'utilities.css' };
const c = await compile(css, {
  base: PKG,
  loadStylesheet: async (id, base) => ({ path: path.join(PKG, files[id] || id), base: PKG, content: fs.readFileSync(path.join(PKG, files[id] || id), 'utf8') }),
});
let out = c.build(classes);
// drop the theme layer (thousands of custom properties) unless asked; keep utilities and @property
out = out.replace(/@layer theme \{[\s\S]*?\n\}\n/, '');
console.log(out);
