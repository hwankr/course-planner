// Writes ds/project/design-system.json (the index) from asset-ids.json.
// Usage: node tools/build-index.mjs "<by>" "<note>" [existing-index.json]
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const DS = path.join(here, '../ds/project');
const ids = JSON.parse(fs.readFileSync(path.join(here, '../asset-ids.json'), 'utf8'));
const [by = 'Claude', note = 'Built from hwankr/course-planner', existingPath] = process.argv.slice(2);
const now = new Date().toISOString();
const existing = existingPath && fs.existsSync(existingPath) ? JSON.parse(fs.readFileSync(existingPath, 'utf8')) : null;

const groups = ['Logos', 'Icons', 'App Icons', 'Screenshots'];
const tile = { Logos: 'l', Icons: 'xs', 'App Icons': 'm', Screenshots: 'l' };
const keyOf = name => name.replace(/[^A-Za-z0-9_./-]/g, ch => '~' + ch.charCodeAt(0).toString(16).padStart(2, '0'));
const assetGroups = {};
for (const g of groups) {
  const files = {};
  const order = Object.keys(ids[g]);
  for (const name of order) {
    const r = ids[g][name];
    files[keyOf(name)] = { name, blob: r.blob, size: r.size, type: r.type };
  }
  assetGroups[g] = { name: g, tile: tile[g], order, files };
}

const index = {
  v: 3,
  layout: 'files',
  ...(existing && existing.createdOnFiles ? { createdOnFiles: existing.createdOnFiles } : { createdOnFiles: { v: 1, at: now } }),
  title: 'Course Planner Design System',
  namespace: 'CoursePlanner',
  libraries: [],
  sections: existing ? (existing.sections || {}) : {},
  groups,
  assetGroups,
  blobs: existing ? (existing.blobs || {}) : {},
  docs: existing ? (existing.docs || { readme: 'project/README.md', sections: [] }) : { readme: 'project/README.md', sections: [] },
  lastChange: { by, at: now, via: 'Claude Code · GitHub hwankr/course-planner@b3e587f', note },
};
fs.writeFileSync(path.join(DS, 'design-system.json'), JSON.stringify(index, null, 2) + '\n');
console.log('wrote design-system.json:', groups.map(g => `${g}=${assetGroups[g].order.length}`).join(' '));
