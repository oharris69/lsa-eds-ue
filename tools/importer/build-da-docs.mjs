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
 *   - resolves internal links to migrated pages (normalized like the importer's
 *     document paths); in the nav/footer fragments, links to pages that are not
 *     migrated become placeholders to the homepage (report: {out}/nav-links.txt)
 *
 * Output: {out}/<path>.html for each page, plus {out}/manifest.json
 *   { pages: [{ path, file }], media: [file] }
 *
 * Usage:
 *   node tools/importer/build-da-docs.mjs [--org oharris69] [--repo lsa-eds-ue] [--out /tmp/da-out]
 *     [--exclude en]   (comma-separated retired folders to skip; default "en")
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
// Retired content folders that must not be re-uploaded. `en/` was the old
// language root for nav/footer (now /nav and /footer at the site root).
const EXCLUDE = arg('exclude', 'en').split(',').filter(Boolean).map((p) => `${p.replace(/\/$/, '')}/`);
const BLOCKED_ORIGIN = 'https://lsa.umich.edu/';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  if (e.isDirectory()) return e.name === 'media-da' ? [] : walk(path.join(dir, e.name));
  return e.name.endsWith('.plain.html') ? [path.join(dir, e.name)] : [];
});

const media = new Set();
const pages = [];

const files = walk(CONTENT).sort()
  .map((file) => ({ file, docPath: path.relative(CONTENT, file).replace(/\.plain\.html$/, '') }))
  .filter(({ docPath }) => !EXCLUDE.some((prefix) => `${docPath}/`.startsWith(prefix)));

// Web paths of every migrated page (index → /), for link resolution.
const FRAGMENTS = new Set(['nav', 'footer']);
const migrated = new Set(files
  .filter(({ docPath }) => !FRAGMENTS.has(docPath))
  .map(({ docPath }) => (docPath === 'index' ? '/' : `/${docPath}`)));

// Normalize a source page path the way the importer names documents
// (WebImporter.FileUtils.sanitizePath): lowercase, no .html, no trailing slash,
// no leading/trailing dashes per segment ("what-are-the-liberal-arts-" → "…-arts").
const normalizePath = (p) => {
  const clean = p.replace(/\.html?$/, '').replace(/\/+$/, '').toLowerCase()
    .split('/')
    .map((seg) => seg.replace(/^-+|-+$/g, ''))
    .join('/');
  return clean === '' || clean === '/lsa' || clean === '/index' ? '/' : clean;
};

const linkReport = [];
/**
 * Resolve internal links (relative, or absolute lsa.umich.edu): a link to a
 * migrated page points at its EDS path; in nav/footer fragments a link to a page
 * that isn't migrated becomes a placeholder to the homepage (/). Other hosts
 * (umich.edu, giving, Course Guide, Gateway), anchors and mailto are untouched.
 */
function resolveLinks(html, docPath) {
  const isFragment = FRAGMENTS.has(docPath);
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    const abs = /^https?:\/\/lsa\.umich\.edu(\/[^"]*)?$/i.exec(href);
    if (!href.startsWith('/') && !abs) return m;
    if (href.startsWith('/media-da/')) return m;
    const url = new URL(abs ? (abs[1] || '/') : href, 'https://x.invalid');
    const target = normalizePath(url.pathname);
    let out = null;
    if (migrated.has(target)) out = target + url.hash;
    else if (isFragment) out = '/';
    if (!out) return m;
    if (isFragment) linkReport.push(`${docPath}: ${href} → ${out}${migrated.has(target) ? '' : '  (placeholder)'}`);
    return `href="${out}"`;
  });
}

files.forEach(({ file, docPath }) => {
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
  html = resolveLinks(html, docPath);

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

fs.writeFileSync(path.join(OUT, 'nav-links.txt'), `${linkReport.join('\n')}\n`);
console.log(`Built ${pages.length} DA documents in ${OUT}; ${mediaList.length} media files referenced.`);
console.log(`nav/footer links: ${linkReport.length} resolved (${linkReport.filter((l) => l.includes('placeholder')).length} placeholders) — see ${OUT}/nav-links.txt`);
if (missing.length) {
  console.error(`Missing local media: ${missing.join(', ')}`);
  process.exitCode = 1;
}
