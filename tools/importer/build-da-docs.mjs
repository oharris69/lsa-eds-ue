/* eslint-disable no-console */
/**
 * Convert imported content (content/**\/*.plain.html) into Document Authoring (DA)
 * source documents and list the media each one references.
 *
 * For every page:
 *   - wraps the section <div>s as <body><header></header><main>…</main><footer></footer></body>
 *   - strips HTML comments (the importer's xwalk `<!-- field:… -->` hints)
 *   - rewrites local /media-da/<file> images to the DA content URL
 *     https://content.da.live/{org}/{repo}/media-da/<file> (the source site
 *     blocks hot-linking, so images are uploaded to DA alongside the pages)
 *   - drops the Metadata "Image" row when it points at the blocked source origin
 *   - strips the trailing .html from internal page links (EDS URLs are extensionless)
 *
 * Output: {out}/<path>.html for each page, plus {out}/manifest.json
 *   { pages: [{ path, file }], media: [file] }
 *
 * Usage:
 *   node tools/importer/build-da-docs.mjs [--org oharris69] [--repo lsa-eds-ue] [--out /tmp/da-out]
 * Upload: see tools/importer/upload-to-da.sh
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};
const ORG = arg('org', 'oharris69');
const REPO = arg('repo', 'lsa-eds-ue');
const OUT = arg('out', '/tmp/da-out');
const CONTENT = fs.realpathSync(arg('content', 'content'));
const DA_MEDIA_BASE = `https://content.da.live/${ORG}/${REPO}/media-da/`;
const BLOCKED_ORIGIN = 'https://lsa.umich.edu/';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.isDirectory()) return e.name === 'media-da' ? [] : walk(path.join(dir, e.name));
  return e.name.endsWith('.plain.html') ? [path.join(dir, e.name)] : [];
});

const media = new Set();
const pages = [];

walk(CONTENT).sort().forEach((file) => {
  const docPath = path.relative(CONTENT, file).replace(/\.plain\.html$/, '');
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // Metadata "Image" row pointing at the blocked source origin (og:image servlet).
  html = html.replace(
    /<div><div>Image<\/div><div>(?:(?!<\/div><\/div>)[\s\S])*?<img src="([^"]+)"[\s\S]*?<\/div><\/div>/g,
    (row, src) => (src.startsWith(BLOCKED_ORIGIN) ? '' : row),
  );

  // Internal page links: Edge Delivery URLs are extensionless (/lsa/about, not
  // /lsa/about.html). Only a trailing .html is stripped (before ?/#), so
  // servlet-style paths like /events.detail.html/123.html keep their inner segment.
  html = html.replace(/href="(\/(?!media-da\/)[^"?#]*?)\.html([?#][^"]*)?"/g, (m, p, rest) => `href="${p}${rest || ''}"`);

  html = html.replace(/(src|href)="\/media-da\/([^"]+)"/g, (m, attr, name) => {
    media.add(name);
    return `${attr}="${DA_MEDIA_BASE}${name}"`;
  });

  const doc = `<body>\n<header></header>\n<main>\n${html.trim()}\n</main>\n<footer></footer>\n</body>\n`;
  const outFile = path.join(OUT, `${docPath}.html`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, doc);
  pages.push({ path: docPath, file: outFile });
});

const mediaList = [...media].sort();
const missing = mediaList.filter((m) => !fs.existsSync(path.join(CONTENT, 'media-da', m)));
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({
  org: ORG, repo: REPO, contentDir: CONTENT, pages, media: mediaList,
}, null, 2));

console.log(`Built ${pages.length} DA documents in ${OUT}; ${mediaList.length} media files referenced.`);
if (missing.length) {
  console.error(`Missing local media: ${missing.join(', ')}`);
  process.exitCode = 1;
}
