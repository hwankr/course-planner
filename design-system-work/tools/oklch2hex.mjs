// Convert Tailwind v4 oklch() theme colors to sRGB hex (exact, gamut-clipped like browsers do).
import fs from 'node:fs';
const css = fs.readFileSync(process.argv[2], 'utf8');
const re = /--color-([a-z]+-\d+):\s*oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/g;
function oklchToHex(L, C, h) {
  L /= 100; const hr = h * Math.PI / 180;
  const a = C * Math.cos(hr), b = C * Math.sin(hr);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gam = x => { x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055; };
  const hx = x => Math.round(gam(x) * 255).toString(16).padStart(2, '0');
  return '#' + hx(r) + hx(g) + hx(bb);
}
const out = {}; let m;
while ((m = re.exec(css))) out[m[1]] = oklchToHex(+m[2], +m[3], +m[4]);
out['white'] = '#ffffff'; out['black'] = '#000000';
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(Object.keys(out).length, 'colors');
for (const k of ['gray-50','gray-100','gray-200','gray-300','gray-400','gray-500','gray-600','gray-700','gray-800','gray-900','slate-200','slate-600','red-500','red-600','green-500','amber-500','blue-100','blue-700','purple-100','purple-600','orange-100','orange-700']) console.log(k, out[k]);
