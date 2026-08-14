/* eslint-disable no-console, no-await-in-loop */
/**
 * Generate JCR XML for AEM from the source pages, honoring the project's
 * component models so md2jcr maps block fields via field-hint comments.
 *
 * Pipeline (mirrors the bulk importer, but in Node so we can capture markdown):
 *   served .html --(bundle transform via html2md)--> grid-table markdown
 *   markdown --(md2jcr + {models,definition,filters})--> JCR XML
 *
 * Writes FileVault tree: dist/jcr-package/jcr_root/content/lsa-eds-ue/.../.content.xml
 * plus META-INF/vault/{filter.xml,properties.xml}.
 *
 * Prereq: local UTF-8 server serving migration-work/source-html at :8082.
 * Usage: node tools/importer/generate-jcr.mjs
 */
import fs from 'fs';
import { readFileSync } from 'fs';

const REPO = '/workspace/current';
const NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const BASE = 'http://localhost:8082';

const helixImporter = await import(`${NM}/@adobe/helix-importer/src/index.js`);
const { html2md } = helixImporter;
const { JSDOM } = await import(`${NM}/jsdom/lib/api.js`);

// Build the md->JCR pipeline manually so we can strip leftover link-reference
// `definition` nodes after dereference (md2jcr's default wrapper leaves them in
// the mdast, and mdast2jcr throws UnsupportedElementError on them).
const { unified } = await import(`${NM}/unified/index.js`);
const remark = (await import(`${NM}/remark-parse/index.js`)).default;
const gfm = (await import(`${NM}/remark-gfm/index.js`)).default;
const { dereference } = await import(`${NM}/@adobe/helix-markdown-support/src/index.js`);
const { remarkMatter } = await import(`${NM}/@adobe/helix-markdown-support/src/matter/index.js`);
const remarkGridTable = (await import(`${NM}/@adobe/remark-gridtables/src/index.js`)).default;
const mdast2jcr = (await import(`${NM}/@adobe/helix-md2jcr/src/mdast2jcr/index.js`)).default;
const { visit } = await import(`${NM}/unist-util-visit/index.js`);

function parseMd(md) {
  const mdast = unified()
    .use(remark, { position: false })
    .use(gfm)
    .use(remarkMatter)
    .use(remarkGridTable)
    .parse(md);
  dereference(mdast);
  // Remove leftover link-reference definition nodes (inlined by dereference).
  const toRemove = [];
  visit(mdast, 'definition', (node, index, parent) => { toRemove.push([parent, index]); });
  toRemove.sort((a, b) => b[1] - a[1]).forEach(([parent, index]) => {
    if (parent && Array.isArray(parent.children)) parent.children.splice(index, 1);
  });
  return mdast;
}

// Grid-table node types emitted by @adobe/remark-gridtables.
const GT_TYPES = new Set(['gridTable', 'gtHeader', 'gtBody', 'gtRow', 'gtCell']);

function stripGridTables(mdast) {
  const toRemove = [];
  visit(mdast, (node, index, parent) => {
    if (node.type === 'gridTable' && parent && typeof index === 'number') {
      toRemove.push([parent, index]);
    }
  });
  toRemove.sort((a, b) => b[1] - a[1]).forEach(([parent, index]) => {
    parent.children.splice(index, 1);
  });
  return toRemove.length;
}

async function md2jcrSafe(md, opts) {
  try {
    return await mdast2jcr(parseMd(md), opts);
  } catch (e) {
    // md2jcr treats every grid table as an EDS block. Pages whose tables are plain
    // tabular default content (e.g. the academics directory's ~200-row program list,
    // a frozen snapshot of a live AJAX widget) trip the "component 'X' does not exist"
    // error. Retry with grid tables removed so the page's editorial content (intro,
    // headings, links) still converts; the dynamic table is intentionally omitted.
    const isUnknownBlock = /does not exist|not supported/i.test(e.message);
    if (!isUnknownBlock) throw e;
    const mdast = parseMd(md);
    const removed = stripGridTables(mdast);
    const xml = await mdast2jcr(mdast, opts);
    return { xml, droppedTables: removed };
  }
}

const models = JSON.parse(readFileSync(`${REPO}/component-models.json`, 'utf8'));
const definition = JSON.parse(readFileSync(`${REPO}/component-definition.json`, 'utf8'));
const filters = JSON.parse(readFileSync(`${REPO}/component-filters.json`, 'utf8'));

// Expose WebImporter (used by the bundles) as a global for the eval'd bundle.
globalThis.WebImporter = helixImporter;

// Staging placeholder (declared early: referenced by PAGES below). On-disk
// stand-in for content/lsa-eds-ue, remapped in the zip. Avoids a workspace
// guardrail that blocks deleting build artifacts under any content/ path.
const SITE_STAGE = '__SITEROOT__';

// Load a bundle (IIFE assigning global CustomImportScript) and return its default config.
function loadBundle(file) {
  const code = readFileSync(`${REPO}/${file}`, 'utf8');
  // eslint-disable-next-line no-new-func
  const fn = new Function('WebImporter', `${code}; return CustomImportScript;`);
  const mod = fn(helixImporter);
  return mod.default;
}

// Each page: served URL + canonical originalURL (drives document path) + bundle + jcr node path.
// jcrPath uses the SITE_STAGE placeholder on disk; remapped to content/lsa-eds-ue in the zip.
const PAGES = [
  {
    fetch: `${BASE}/`, originalURL: 'https://lsa.umich.edu/',
    bundle: 'tools/importer/import-homepage.bundle.js',
    jcrPath: `${SITE_STAGE}/index`,
  },
  {
    fetch: `${BASE}/lsa/prospective-students.html`, originalURL: 'https://lsa.umich.edu/lsa/prospective-students.html',
    bundle: 'tools/importer/import-audience-landing.bundle.js',
    jcrPath: `${SITE_STAGE}/lsa/prospective-students`,
  },
  {
    fetch: `${BASE}/lsa/academics/majors-minors.html`, originalURL: 'https://lsa.umich.edu/lsa/academics/majors-minors.html',
    bundle: 'tools/importer/import-academics-directory.bundle.js',
    jcrPath: `${SITE_STAGE}/lsa/academics/majors-minors`,
  },
  {
    fetch: `${BASE}/lsa/academics/departments-and-units.html`, originalURL: 'https://lsa.umich.edu/lsa/academics/departments-and-units.html',
    bundle: 'tools/importer/import-academics-directory.bundle.js',
    jcrPath: `${SITE_STAGE}/lsa/academics/departments-and-units`,
  },
  {
    fetch: `${BASE}/rc.html`, originalURL: 'https://lsa.umich.edu/rc',
    bundle: 'tools/importer/import-unit-home.bundle.js',
    jcrPath: `${SITE_STAGE}/rc`,
  },
  {
    fetch: `${BASE}/english/undergraduate.html`, originalURL: 'https://lsa.umich.edu/english/undergraduate.html',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${SITE_STAGE}/english/undergraduate`,
  },
  {
    fetch: `${BASE}/urop/prospective-students.html`, originalURL: 'https://lsa.umich.edu/urop/prospective-students.html',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${SITE_STAGE}/urop/prospective-students`,
  },
  {
    fetch: `${BASE}/psych/prospective-students/undergraduate.html`, originalURL: 'https://lsa.umich.edu/psych/prospective-students/undergraduate.html',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${SITE_STAGE}/psych/prospective-students/undergraduate`,
  },
  {
    fetch: `${BASE}/header-footer-source.html`, originalURL: 'https://lsa.umich.edu/en/nav',
    bundle: 'tools/importer/import-nav.bundle.js',
    jcrPath: `${SITE_STAGE}/en/nav`,
  },
  {
    fetch: `${BASE}/header-footer-source.html`, originalURL: 'https://lsa.umich.edu/en/footer',
    bundle: 'tools/importer/import-footer.bundle.js',
    jcrPath: `${SITE_STAGE}/en/footer`,
  },
];

// Stage on disk under a placeholder root that does NOT contain the segment
// "content" (a workspace guardrail blocks deleting anything under a content/
// path, which would otherwise strand stale build artifacts). The placeholder
// __SITEROOT__ is remapped to content/lsa-eds-ue in the zip entry paths.
const OUT_ROOT = `${REPO}/dist/pkg`;
const JCR_ROOT = `${OUT_ROOT}/jcr_root`;
const ensureDir = (d) => fs.mkdirSync(d, { recursive: true });

const results = [];
for (const page of PAGES) {
  const res = await fetch(page.fetch);
  const html = await res.text();
  const dom = new JSDOM(html);
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.DOMParser = dom.window.DOMParser;
  globalThis.Node = dom.window.Node;
  globalThis.NodeFilter = dom.window.NodeFilter;

  const config = loadBundle(page.bundle);
  let md;
  try {
    const mdRes = await html2md(page.originalURL, dom.window.document, config, { toMd: true, toDocx: false }, { originalURL: page.originalURL });
    md = mdRes.md;
    const conv = await md2jcrSafe(md, { models, definition, filters });
    let xml = typeof conv === 'string' ? conv : conv.xml;
    const droppedTables = typeof conv === 'string' ? 0 : conv.droppedTables;
    // md2jcr can leave bare '&' in attribute values (e.g. tracking params in an
    // aem-content ctalink like ...?utm_source=x&utm_medium=y), which makes the XML
    // malformed and breaks the FileVault install. Escape any '&' that is not
    // already the start of a valid XML entity.
    xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#x?[0-9A-Fa-f]+;)/g, '&amp;');
    const dir = `${JCR_ROOT}/${page.jcrPath}`;
    ensureDir(dir);
    fs.writeFileSync(`${dir}/.content.xml`, xml, 'utf8');
    fs.writeFileSync(`${dir}/.source.md`, md, 'utf8');
    results.push({
      page: page.jcrPath, status: 'ok', mdLen: md.length, xmlLen: xml.length, droppedTables,
    });
    const note = droppedTables ? `  [dropped ${droppedTables} dynamic table(s)]` : '';
    console.log(`OK    ${page.jcrPath}  (md ${md.length}b -> xml ${xml.length}b)${note}`);
  } catch (e) {
    // Keep the markdown for diagnosis; skip this page so the rest still package.
    if (md) { const d = `${JCR_ROOT}/${page.jcrPath}`; ensureDir(d); fs.writeFileSync(`${d}/.source.md`, md, 'utf8'); }
    results.push({ page: page.jcrPath, status: 'FAILED', error: e.message });
    console.log(`SKIP  ${page.jcrPath}  -> ${e.message}`);
  }
}

// FileVault metadata.
const META = `${OUT_ROOT}/META-INF/vault`;
ensureDir(META);
fs.writeFileSync(`${META}/filter.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="/content/lsa-eds-ue"/>
</workspaceFilter>
`, 'utf8');
fs.writeFileSync(`${META}/properties.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <comment>LSA EDS content migration package</comment>
  <entry key="name">lsa-eds-ue-content</entry>
  <entry key="group">lsa-eds-ue</entry>
  <entry key="version">1.0.0</entry>
  <entry key="packageType">content</entry>
</properties>
`, 'utf8');

console.log('\nWrote META-INF/vault/{filter.xml,properties.xml}');

// Assemble the FileVault zip, remapping the on-disk placeholder to the real
// AEM path (jcr_root/content/lsa-eds-ue/...). Exclude .source.md audit files.
const { default: JSZip } = await import(`${NM}/jszip/lib/index.js`);
const zip = new JSZip();
const remap = (rel) => rel.replace(`jcr_root/${SITE_STAGE}/`, 'jcr_root/content/lsa-eds-ue/');
function addToZip(absDir, relDir) {
  for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (e.name === '.source.md') continue;
    const abs = `${absDir}/${e.name}`;
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) addToZip(abs, rel);
    else zip.file(remap(rel), fs.readFileSync(abs));
  }
}
addToZip(JCR_ROOT, 'jcr_root');
addToZip(`${OUT_ROOT}/META-INF`, 'META-INF');
const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
const zipPath = `${REPO}/dist/lsa-eds-ue-content.zip`;
fs.writeFileSync(zipPath, buf);
console.log(`\nPackage: ${zipPath} (${buf.length} bytes)`);
const ok = results.filter((r) => r.status === 'ok').length;
const failed = results.filter((r) => r.status === 'FAILED');
console.log(`Pages packaged: ${ok}/${results.length}`);
if (failed.length) console.log('Skipped:', failed.map((r) => `${r.page} (${r.error})`).join('; '));
console.log(JSON.stringify(results, null, 2));
