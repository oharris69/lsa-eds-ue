/* eslint-disable no-console, no-await-in-loop, no-restricted-syntax, no-continue */
/**
 * Download the images the FAST Lab pages use into content/media-da/fastlab/,
 * named by imageName() (fastlab-paths.mjs) so import-fastlab.js can point at them.
 *
 * Reads the content area (#main article) of every snapshot under
 * tools/importer/bd-snapshots/sites.lsa.umich.edu/fastlab. WordPress uploads are
 * fetched full-size (size suffix dropped; falls back to the size the page shows);
 * Cloudflare serves them as AVIF, so every file is converted to JPEG (max 2000px
 * wide) with ImageMagick. Flickr needs a browser user agent and referrer.
 * Already-downloaded files are skipped.
 *
 * Usage: node tools/importer/fastlab-images.mjs
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { isCopiedImage, imageName, fullSizeUrl } from './fastlab-paths.mjs'; // eslint-disable-line import/extensions

const SNAP = path.resolve('tools/importer/bd-snapshots/sites.lsa.umich.edu/fastlab');
const OUT = path.resolve('content/media-da/fastlab');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const TMP = fs.mkdtempSync('/tmp/fastlab-img-');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return e.name === 'index.html' ? [p] : [];
  });
}

const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}=(["'])(.*?)\\1`).exec(tag);
  return m ? m[2].replace(/&amp;/g, '&') : '';
};

// image URLs in the content area of every page
const srcs = new Set();
// Flickr embeds per page: Flickr's script swaps them for an iframe while the
// importer's browser loads the page, so import-fastlab.js rebuilds them from this
const flickrEmbeds = {};
walk(SNAP).forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('id="main"');
  const end = html.indexOf('id="colophon"');
  const content = html.slice(start > -1 ? start : 0, end > -1 ? end : undefined);
  for (const m of content.matchAll(/<img[^>]+?(?:data-src|src)=(["'])(.+?)\1/g)) {
    const src = m[2].replace(/&amp;/g, '&');
    if (isCopiedImage(src)) srcs.add(src);
  }
  const embeds = [...content.matchAll(/<a[^>]*data-flickr-embed[^>]*>\s*<img[^>]*>/g)].map(([tag]) => {
    const [a, img] = tag.split(/(?=<img)/);
    return { href: attr(a, 'href'), src: attr(img, 'src'), alt: attr(img, 'alt') };
  });
  if (embeds.length) flickrEmbeds[`/fastlab/${path.relative(SNAP, path.dirname(file))}/`.replace('//', '/')] = embeds;
});
fs.writeFileSync('tools/importer/fastlab-flickr.json', `${JSON.stringify(flickrEmbeds, null, 2)}\n`);

fs.mkdirSync(OUT, { recursive: true });
let fetched = 0; let skipped = 0;
const failed = [];
for (const src of srcs) {
  const name = imageName(src);
  const dest = path.join(OUT, name);
  if (fs.existsSync(dest)) { skipped += 1; continue; }
  const flickr = new URL(src).hostname.endsWith('staticflickr.com');
  const headers = { 'User-Agent': UA, Accept: 'image/jpeg,image/png,image/*;q=0.8' };
  if (flickr) headers.Referer = 'https://www.flickr.com/';
  let buf = null;
  for (const url of [...new Set([fullSizeUrl(src), src])]) {
    try {
      const r = await fetch(url, { headers });
      const type = r.headers.get('content-type') || '';
      if (r.ok && type.startsWith('image/')) { buf = Buffer.from(await r.arrayBuffer()); break; }
    } catch (e) { /* try the next candidate */ }
  }
  if (!buf) { failed.push(src); continue; }
  const raw = path.join(TMP, 'raw');
  fs.writeFileSync(raw, buf);
  try {
    execFileSync('convert', [`${raw}[0]`, '-auto-orient', '-strip', '-resize', '2000x>', '-quality', '82', '-interlace', 'Plane', dest]);
    fetched += 1;
  } catch (e) {
    failed.push(src);
  }
}
fs.rmSync(TMP, { recursive: true, force: true });
// broken on the source too (404/403) → import-fastlab.js drops these images
const missing = [...new Set(failed.map(imageName))].sort();
fs.writeFileSync('tools/importer/fastlab-missing-images.json', `${JSON.stringify(missing, null, 2)}\n`);
console.log(`${srcs.size} images: ${fetched} downloaded, ${skipped} already there, ${failed.length} failed`);
failed.forEach((s) => console.log(`  FAILED ${s}`));
