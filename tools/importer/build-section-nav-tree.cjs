/* eslint-disable */
// Usage: node tools/importer/build-section-nav-tree.cjs
// Rebuilds tools/importer/section-nav/prospective-students.json from the saved
// source pages (tools/importer/bd-snapshots) left section-nav menus.
// Build the Prospective Students section-nav tree from the saved pages:
// - parent of a page = the nearest ancestor URL in the set (URL hierarchy);
// - order of a node's children = the order shown in that node's own sidenav
//   (fallback: first-seen order).
const { JSDOM } = require(`${process.env.NM || '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules'}/jsdom`);
const fs = require('fs');
const path = require('path');

const root = 'tools/importer/bd-snapshots/lsa.umich.edu';
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith('.html.html')) files.push(p);
});
walk(path.join(root, 'lsa/prospective-students'));

const key = (href) => href.replace(/\.html$/, '').replace(/-+(?=\/|$)/g, '');
const text = new Map();
const seenOrder = [];
const ownOrder = new Map(); // key -> [child keys] as shown on its own page
files.forEach((f) => {
  const pageKey = key(`/${path.relative(root, f).replace(/\.html\.html$/, '')}`);
  const d = new JSDOM(fs.readFileSync(f, 'utf8')).window.document;
  const links = [...d.querySelectorAll('.sidenav-wrap ol.sidenav a[href]')];
  links.forEach((a) => {
    const k = key(a.getAttribute('href'));
    if (!text.has(k)) { text.set(k, a.textContent.replace(/\s+/g, ' ').trim()); seenOrder.push(k); }
  });
  const kids = links.map((a) => key(a.getAttribute('href')))
    .filter((k) => k.startsWith(`${pageKey}/`) && !k.slice(pageKey.length + 1).includes('/'));
  if (kids.length) ownOrder.set(pageKey, kids);
});

const all = new Set(seenOrder);
const parentOf = (k) => {
  let p = k;
  while (p.includes('/')) {
    p = p.slice(0, p.lastIndexOf('/'));
    if (all.has(p)) return p;
  }
  return null;
};
const children = new Map();
seenOrder.forEach((k) => {
  const p = parentOf(k);
  if (!p) return;
  if (!children.has(p)) children.set(p, []);
  children.get(p).push(k);
});
children.forEach((list, p) => {
  const own = ownOrder.get(p) || [];
  list.sort((a, b) => {
    const ia = own.indexOf(a); const ib = own.indexOf(b);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || seenOrder.indexOf(a) - seenOrder.indexOf(b);
  });
});
const build = (k) => ({ path: k, text: text.get(k), children: (children.get(k) || []).map(build) });
const tree = build('/lsa/prospective-students');
const print = (n, depth) => { console.log(`${'  '.repeat(depth)}${n.text} -> ${n.path}`); n.children.forEach((c) => print(c, depth + 1)); };
print(tree, 0);
fs.writeFileSync('tools/importer/section-nav/prospective-students.json', JSON.stringify(tree, null, 1));
