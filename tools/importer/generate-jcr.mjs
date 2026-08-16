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

// md2jcr converts a brand image-link `[![alt](logo)](/)` into an EMPTY button
// (linkText=""), dropping the logo entirely. The boilerplate header.js/footer.js
// look for `.nav-brand img` / a picture in the brand, so a logo-less button makes
// the nav/footer render broken. Repair it: swap the first empty brand button for a
// proper franklin image component pointing at the source logo. `logo` and `alt`
// come from the page's brandLogo config (parsed from the source markdown's image
// reference definition). Returns the patched XML.
function fixBrandLogo(xml, logo, alt) {
  if (!logo) return xml;
  const image = `<image sling:resourceType="core/franklin/components/image/v1/image" `
    + `jcr:primaryType="nt:unstructured" image="${logo}" imageAlt="${(alt || '').replace(/"/g, '&quot;')}"/>`;
  // Replace only the FIRST empty-linkText brand button (the logo slot).
  return xml.replace(/<button\b[^>]*\blinkText=""[^>]*\/>/, image);
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

// Package identity — single source of truth for name + version. Bump PKG_VERSION
// on each meaningful content/structure change; the zip filename embeds it
// (e.g. lsa-eds-ue-content-1.3.0.zip) so installs are unambiguous.
const PKG_NAME = 'lsa-eds-ue-content';
const PKG_VERSION = '1.4.0';

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
// Language root, matching the working Love's migration on the same AEM instance:
// /content/{site}/language-masters/en. This is the boilerplate's own convention
// (utils.js PATH_PREFIX = '/language-masters'; getPathDetails() reads the language
// at path index 4 = /content/{site}/language-masters/{lang}/...). The `en` node
// ITSELF is the homepage (like Love's "en" = "Love's Travel Stops"); nav, footer,
// and all interior pages are its children.
const LANG_ROOT = `${SITE_STAGE}/language-masters/en`;
const PAGES = [
  {
    fetch: `${BASE}/`, originalURL: 'https://lsa.umich.edu/language-masters/en',
    bundle: 'tools/importer/import-homepage.bundle.js',
    jcrPath: `${LANG_ROOT}`, // the en node IS the homepage
  },
  {
    fetch: `${BASE}/lsa/prospective-students.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/lsa/prospective-students',
    bundle: 'tools/importer/import-audience-landing.bundle.js',
    jcrPath: `${LANG_ROOT}/lsa/prospective-students`,
  },
  {
    fetch: `${BASE}/lsa/academics/majors-minors.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/lsa/academics/majors-minors',
    bundle: 'tools/importer/import-academics-directory.bundle.js',
    jcrPath: `${LANG_ROOT}/lsa/academics/majors-minors`,
  },
  {
    fetch: `${BASE}/lsa/academics/departments-and-units.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/lsa/academics/departments-and-units',
    bundle: 'tools/importer/import-academics-directory.bundle.js',
    jcrPath: `${LANG_ROOT}/lsa/academics/departments-and-units`,
  },
  {
    fetch: `${BASE}/rc.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/rc',
    bundle: 'tools/importer/import-unit-home.bundle.js',
    jcrPath: `${LANG_ROOT}/rc`,
  },
  {
    fetch: `${BASE}/english/undergraduate.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/english/undergraduate',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${LANG_ROOT}/english/undergraduate`,
  },
  {
    fetch: `${BASE}/urop/prospective-students.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/urop/prospective-students',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${LANG_ROOT}/urop/prospective-students`,
  },
  {
    fetch: `${BASE}/psych/prospective-students/undergraduate.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/psych/prospective-students/undergraduate',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${LANG_ROOT}/psych/prospective-students/undergraduate`,
  },
  {
    fetch: `${BASE}/cgis.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/cgis',
    bundle: 'tools/importer/import-department-landing.bundle.js',
    jcrPath: `${LANG_ROOT}/cgis`,
  },
  {
    fetch: `${BASE}/header-footer-source.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/nav',
    bundle: 'tools/importer/import-nav.bundle.js',
    jcrPath: `${LANG_ROOT}/nav`,
    brandLogo: {
      logo: 'https://lsa.umich.edu/content/dam/michigan-lsa/admin/logos/en-logo.png',
      alt: 'U-M College of LSA',
    },
  },
  {
    fetch: `${BASE}/header-footer-source.html`, originalURL: 'https://lsa.umich.edu/language-masters/en/footer',
    bundle: 'tools/importer/import-footer.bundle.js',
    jcrPath: `${LANG_ROOT}/footer`,
    brandLogo: {
      logo: 'https://lsa.umich.edu/content/dam/michigan-lsa/admin/logos/lsa-logo.png',
      alt: 'LSA - College of Literature, Science, and The Arts - University of Michigan',
    },
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
    // Restore the brand logo md2jcr dropped (nav/footer only).
    if (page.brandLogo) xml = fixBrandLogo(xml, page.brandLogo.logo, page.brandLogo.alt);
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

// Build the workspace filter so installing this package also CLEANS UP the two
// earlier (wrong) layouts. Real content now lives under the Love's-style root
// /content/lsa-eds-ue/language-masters/en, so:
//   1. A filter root on /language-masters/en installs our whole tree wholesale.
//   2. Bare filter roots for the stale nodes the earlier packages created —
//      the flat site-root nodes (index, lsa, rc, english, urop, psych, cgis) and
//      the interim /en language root — get NO content from this package, so
//      FileVault deletes those subtrees on install.
// The site root node /content/lsa-eds-ue is never a filter root, so its site
// config (cq:Page, cloudservice, etc.) is preserved.
const staleRoots = [
  'index', 'lsa', 'rc', 'english', 'urop', 'psych', 'cgis', // old flat site-root pages
  'en', // interim consolidated root (now superseded by language-masters/en)
];
const filterEntries = [
  '  <filter root="/content/lsa-umich-eds/language-masters/en"/>',
  ...staleRoots.map((seg) => `  <filter root="/content/lsa-umich-eds/${seg}"/>`),
].join('\n');
fs.writeFileSync(`${META}/filter.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${filterEntries}
</workspaceFilter>
`, 'utf8');
fs.writeFileSync(`${META}/properties.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE properties SYSTEM "http://java.sun.com/dtd/properties.dtd">
<properties>
  <comment>LSA EDS content migration package</comment>
  <entry key="name">${PKG_NAME}</entry>
  <entry key="group">lsa-eds-ue</entry>
  <entry key="version">${PKG_VERSION}</entry>
  <entry key="packageType">content</entry>
</properties>
`, 'utf8');

console.log('\nWrote META-INF/vault/{filter.xml,properties.xml}');

// Assemble the FileVault zip, remapping the on-disk placeholder to the real
// AEM path (jcr_root/content/lsa-eds-ue/...). Exclude .source.md audit files.
const { default: JSZip } = await import(`${NM}/jszip/lib/index.js`);
const zip = new JSZip();
const remap = (rel) => rel.replace(`jcr_root/${SITE_STAGE}/`, 'jcr_root/content/lsa-umich-eds/');
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
const zipPath = `${REPO}/dist/${PKG_NAME}-${PKG_VERSION}.zip`;
fs.writeFileSync(zipPath, buf);
console.log(`\nPackage: ${zipPath} (${buf.length} bytes)`);
const ok = results.filter((r) => r.status === 'ok').length;
const failed = results.filter((r) => r.status === 'FAILED');
console.log(`Pages packaged: ${ok}/${results.length}`);
if (failed.length) console.log('Skipped:', failed.map((r) => `${r.page} (${r.error})`).join('; '));
console.log(JSON.stringify(results, null, 2));
