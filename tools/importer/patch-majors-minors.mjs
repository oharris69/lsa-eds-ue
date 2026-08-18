/* eslint-disable no-console */
/**
 * Re-migrate the majors-minors page.
 *
 * The page's core content is a 221-row program table. md2jcr treats every
 * grid table as an EDS block, errors on it, and the generator's md2jcrSafe
 * fallback strips ALL grid tables — which also drops the page's Metadata
 * block (hence the bare "majors-minors" title) and the entire program list.
 *
 * This rebuilds the page's .content.xml straight from the captured .source.md:
 *   - intro paragraphs (rich text)
 *   - the full program list as an HTML <table> in a text component
 *     (default content renders external/table HTML fine, unlike a block)
 *   - jcr:title / jcr:description from the Metadata block
 * then re-zips the package. Idempotent; safe to re-run.
 */
import fs from 'fs';

const REPO = '/workspace/current';
const NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const SITE_STAGE = '__SITEROOT__';
const PKG_NAME = 'lsa-eds-ue-content';
const PKG_VERSION = '1.7.0';
const PAGE_DIR = `${REPO}/dist/pkg/jcr_root/${SITE_STAGE}/language-masters/en/lsa/academics/majors-minors`;

const xmlEsc = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Convert inline markdown links [text](href) -> <a href>text</a>; strip on-page
// (#anchor) links to plain text (their detail sections aren't in this migration).
function mdInline(s) {
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, text, href) => {
    if (href.startsWith('#')) return text;
    return `<a href="${href}">${text}</a>`;
  });
}

const md = fs.readFileSync(`${PAGE_DIR}/.source.md`, 'utf8');
const lines = md.split('\n');

// --- Parse intro paragraphs (before the first grid-table line) ---
const intro = [];
for (const line of lines) {
  if (line.startsWith('+') || line.startsWith('|')) break;
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  intro.push(`<p>${mdInline(t)}</p>`);
}

// --- Parse the program table rows: | Program | Type | Division | ---
const rows = [];
let header = null;
for (const line of lines) {
  if (!line.startsWith('| ')) continue;
  const cells = line.split('|').slice(1, -1).map((c) => c.trim());
  if (cells.length !== 3) continue;
  if (cells[0] === 'Program Name') { header = cells; continue; }
  if (cells[0].startsWith('Metadata') || cells[0] === 'Title' || cells[0] === 'Description' || cells[0] === 'Image') continue;
  rows.push(cells);
}

// --- Parse Metadata (Title / Description) from the trailing metadata table ---
let title = 'Majors and Minors | U-M LSA';
let description = '';
const mdBlock = md.slice(md.indexOf('| Metadata'));
// Title value may contain escaped pipes (\|); match up to the first UNescaped
// trailing pipe, then unescape.
const tMatch = mdBlock.match(/\|\s*Title\s*\|\s*((?:\\\||[^|])+?)\s*\|/);
if (tMatch) title = tMatch[1].replace(/\\\|/g, '|').trim();
const dMatch = mdBlock.match(/\|\s*Description\s*\|([\s\S]*?)\+---/);
if (dMatch) {
  description = dMatch[1]
    .split('\n')
    .map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').replace(/\|/g, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ');
}

const RT = (t, extra = '') => `sling:resourceType="core/franklin/components/${t}" jcr:primaryType="nt:unstructured"${extra}`;
const introText = intro.join('');

// --- Build the program list as an EDS Table BLOCK (block > row items > cells) ---
// Raw HTML <table> is stripped by the EDS pipeline; a block survives and is
// decorated into a real <table> by blocks/table/table.js. Row 0 = header.
const allRows = header ? [header, ...rows] : rows;
const rowItems = allRows.map((cells, idx) => {
  const [c1 = '', c2 = '', c3 = ''] = cells.map((c) => `<p>${mdInline(xmlEsc(c))}</p>`);
  return `        <item_${idx} ${RT('block/v1/block/item', ' name="Row" model="table-row"'
    + ' modelFields="[col1,col2,col3]"'
    + ` col1="${xmlEsc(c1)}" col2="${xmlEsc(c2)}" col3="${xmlEsc(c3)}"`)}/>`;
}).join('\n');

const tableBlock = `      <block ${RT('block/v1/block', ' filter="table" name="Table"')}>
${rowItems}
      </block>`;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jcr:root xmlns:jcr="http://www.jcp.org/jcr/1.0" xmlns:nt="http://www.jcp.org/jcr/nt/1.0" xmlns:cq="http://www.day.com/jcr/cq/1.0" xmlns:sling="http://sling.apache.org/jcr/sling/1.0" jcr:primaryType="cq:Page">
  <jcr:content cq:template="/libs/core/franklin/templates/page" sling:resourceType="core/franklin/components/page/v1/page" jcr:primaryType="cq:PageContent" jcr:title="${xmlEsc(title)}" jcr:description="${xmlEsc(description)}">
    <root ${RT('root/v1/root')}>
      <section ${RT('section/v1/section', ' model="section" modelFields="[name,style]"')}>
        <title ${RT('title/v1/title', ' title="Majors and Minors" titleType="h1"')}/>
        <text ${RT('text/v1/text', ` text="${xmlEsc(introText)}"`)}/>
      </section>
      <section_1 ${RT('section/v1/section', ' model="section" modelFields="[name,style]"')}>
${tableBlock}
      </section_1>
    </root>
  </jcr:content>
</jcr:root>
`;

fs.writeFileSync(`${PAGE_DIR}/.content.xml`, xml, 'utf8');
console.log(`Wrote majors-minors: ${rows.length} program rows, title="${title}"`);

// --- Re-zip the package (same logic as generate-jcr.mjs) ---
const OUT_ROOT = `${REPO}/dist/pkg`;
const JCR_ROOT = `${OUT_ROOT}/jcr_root`;
const META = `${OUT_ROOT}/META-INF/vault`;
// bump properties.xml version
const propPath = `${META}/properties.xml`;
let props = fs.readFileSync(propPath, 'utf8');
props = props.replace(/<entry key="version">[^<]*<\/entry>/, `<entry key="version">${PKG_VERSION}</entry>`);
fs.writeFileSync(propPath, props, 'utf8');

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
console.log(`Package: ${zipPath} (${buf.length} bytes)`);
