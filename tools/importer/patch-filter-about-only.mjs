/* eslint-disable no-console */
/**
 * Scope the v1.9.0 package to install ONLY the newly-migrated About page.
 *
 * The full generate-jcr run stages all 11 pages and writes a filter covering
 * every interior root. For this install we want a surgical package: a single
 * filter root on the About node so nothing else (homepage, other pages) is
 * touched. Rewrites filter.xml to that one root and re-zips the already-staged
 * tree (no re-generate needed). Keeps PKG_VERSION 1.9.0.
 */
import fs from 'fs';

const REPO = '/workspace/current';
const NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const SITE_STAGE = '__SITEROOT__';
const PKG_NAME = 'lsa-eds-ue-content';
const PKG_VERSION = '1.9.0';
const OUT_ROOT = `${REPO}/dist/pkg`;
const JCR_ROOT = `${OUT_ROOT}/jcr_root`;
const META = `${OUT_ROOT}/META-INF/vault`;

const ABOUT_ROOT = '/content/lsa-umich-eds/language-masters/en/lsa/about';

fs.writeFileSync(`${META}/filter.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
  <filter root="${ABOUT_ROOT}"/>
</workspaceFilter>
`, 'utf8');

let props = fs.readFileSync(`${META}/properties.xml`, 'utf8');
props = props.replace(/<entry key="version">[^<]*<\/entry>/, `<entry key="version">${PKG_VERSION}</entry>`);
fs.writeFileSync(`${META}/properties.xml`, props, 'utf8');

// Re-zip only what the About-only filter covers: the about node + META-INF.
const { default: JSZip } = await import(`${NM}/jszip/lib/index.js`);
const zip = new JSZip();
const remap = (rel) => rel.replace(`jcr_root/${SITE_STAGE}/`, 'jcr_root/content/lsa-umich-eds/');
const ABOUT_STAGE_DIR = `${JCR_ROOT}/${SITE_STAGE}/language-masters/en/lsa/about`;

function addDir(absDir, relDir) {
  for (const e of fs.readdirSync(absDir, { withFileTypes: true })) {
    if (e.name === '.source.md') continue;
    const abs = `${absDir}/${e.name}`;
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) addDir(abs, rel);
    else zip.file(remap(rel), fs.readFileSync(abs));
  }
}
// Only the about subtree (its .content.xml + any children) and the vault meta.
addDir(ABOUT_STAGE_DIR, `jcr_root/${SITE_STAGE}/language-masters/en/lsa/about`);
addDir(`${OUT_ROOT}/META-INF`, 'META-INF');

const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
const zipPath = `${REPO}/dist/${PKG_NAME}-${PKG_VERSION}.zip`;
fs.writeFileSync(zipPath, buf);
console.log(`Package: ${zipPath} (${buf.length} bytes)`);
console.log(`filter.xml scoped to a SINGLE root: ${ABOUT_ROOT}`);
console.log('Install touches ONLY the About page — homepage and other pages untouched.');
