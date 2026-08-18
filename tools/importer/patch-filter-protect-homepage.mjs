/* eslint-disable no-console */
/**
 * Protect the authored homepage from package re-installs.
 *
 * The homepage IS the `en` node, now authored directly in AEM (hero from DAM,
 * UE edits). A blanket filter root on /language-masters/en would overwrite it on
 * every install. This rewrites filter.xml so the root EXCLUDES the en node's own
 * jcr:content — child pages still install, the homepage is left untouched — and
 * re-zips the existing staged content (no generator run needed; source is down
 * and the staged tree already has the majors-minors table fix). Bumps to 1.8.0.
 */
import fs from 'fs';

const REPO = '/workspace/current';
const NM = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const SITE_STAGE = '__SITEROOT__';
const PKG_NAME = 'lsa-eds-ue-content';
const PKG_VERSION = '1.8.0';
const OUT_ROOT = `${REPO}/dist/pkg`;
const JCR_ROOT = `${OUT_ROOT}/jcr_root`;
const META = `${OUT_ROOT}/META-INF/vault`;

const staleRoots = ['index', 'lsa', 'rc', 'english', 'urop', 'psych', 'cgis', 'en'];
const filterEntries = [
  '  <filter root="/content/lsa-umich-eds/language-masters/en">',
  '    <exclude pattern="/content/lsa-umich-eds/language-masters/en/jcr:content(/.*)?"/>',
  '  </filter>',
  ...staleRoots.map((seg) => `  <filter root="/content/lsa-umich-eds/${seg}"/>`),
].join('\n');
fs.writeFileSync(`${META}/filter.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<workspaceFilter version="1.0">
${filterEntries}
</workspaceFilter>
`, 'utf8');

let props = fs.readFileSync(`${META}/properties.xml`, 'utf8');
props = props.replace(/<entry key="version">[^<]*<\/entry>/, `<entry key="version">${PKG_VERSION}</entry>`);
fs.writeFileSync(`${META}/properties.xml`, props, 'utf8');

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
console.log('filter.xml now EXCLUDES the homepage jcr:content (authored hero protected).');
