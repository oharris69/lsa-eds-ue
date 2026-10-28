/* eslint-disable no-console */
/**
 * Build tools/importer/fastlab-profiles.json — staff member name → profile slug —
 * from the FAST Lab snapshots (tools/importer/bd-snapshots/sites.lsa.umich.edu/
 * fastlab/staff-members/<slug>/index.html). import-fastlab.js uses it to link the
 * names on the Members page to the migrated profile pages (the source listing
 * doesn't link them).
 *
 * Usage: node tools/importer/fastlab-profiles.mjs
 */
import fs from 'fs';
import path from 'path';

const DIR = path.resolve('tools/importer/bd-snapshots/sites.lsa.umich.edu/fastlab/staff-members');
const OUT = path.resolve('tools/importer/fastlab-profiles.json');
const norm = (s) => s.toLowerCase().replace(/&amp;/g, '&').replace(/[^a-z0-9]+/g, ' ').trim();

const map = {};
fs.readdirSync(DIR).forEach((slug) => {
  const file = path.join(DIR, slug, 'index.html');
  if (!fs.existsSync(file)) return;
  const h1 = /<h1[^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h1>/.exec(fs.readFileSync(file, 'utf8'));
  if (h1) map[norm(h1[1].replace(/<[^>]+>/g, ''))] = slug;
});
fs.writeFileSync(OUT, `${JSON.stringify(map, null, 2)}\n`);
console.log(`${Object.keys(map).length} profiles → ${path.relative(process.cwd(), OUT)}`);
