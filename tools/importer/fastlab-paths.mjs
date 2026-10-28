/**
 * FAST Lab (sites.lsa.umich.edu/fastlab, LSA Sites / WordPress) → DA document paths
 * and local image names. Shared by import-fastlab.js (the import transform) and
 * fastlab-images.mjs (downloads the images the pages reference).
 *
 * Documents live under /en/departments/fastlab:
 *   /fastlab/                         → /en/departments/fastlab/index
 *   /fastlab/staff-members/<slug>/    → /en/departments/fastlab/members/<slug>
 *   /fastlab/YYYY/MM/DD/<slug>/       → /en/departments/fastlab/news/<slug>
 *   /fastlab/<path>/                  → /en/departments/fastlab/<path>
 * WordPress list views that weren't migrated point at the page that replaces them.
 */
export const FASTLAB_ORIGIN = 'https://sites.lsa.umich.edu';
export const FASTLAB_ROOT = '/fastlab';
export const DOC_ROOT = '/en/departments/fastlab';

/** Source pages that were not migrated → the migrated page that replaces them. */
export const REPLACED = {
  'press-old': 'media/press',
  'press-grid': 'media/press',
  'press-by-category': 'media/press',
  'publications-by-category': 'publications',
  'presentations-by-category': 'media/presentations',
  'join/undergraduates/thank-you-for-applying': 'join/undergraduates',
  // pre-reorganisation paths the Media and Join hub buttons still use
  graduates: 'join/graduates',
  undergraduates: 'join/undergraduates',
  'undergraduates/past-theses': 'join/past-theses',
  press: 'media/press',
  presentations: 'media/presentations',
  'lab-photos': 'media/lab-photos',
  search: '',
};

/** WordPress archive paths (categories, staff groups, authors) — not migrated. */
const ARCHIVE = /^(category|group|author|tag|feed|wp-content|wp-json|wp-admin|cdn-cgi)(\/|$)/;

/**
 * Document path for a FAST Lab source pathname, or null if it isn't a migrated
 * page (archives, uploads).
 * @param {string} pathname e.g. /fastlab/media/press/
 */
export function docPath(pathname) {
  if (!pathname.startsWith(FASTLAB_ROOT)) return null;
  let rel = pathname.slice(FASTLAB_ROOT.length).replace(/^\/+|\/+$/g, '').replace(/\.html?$/, '');
  if (ARCHIVE.test(rel)) return null;
  if (rel in REPLACED) rel = REPLACED[rel];
  const staff = /^staff-members\/([^/]+)$/.exec(rel);
  if (staff) return `${DOC_ROOT}/members/${staff[1]}`;
  const post = /^\d{4}\/\d{2}\/\d{2}\/([^/]+)$/.exec(rel);
  if (post) return `${DOC_ROOT}/news/${post[1]}`;
  return `${DOC_ROOT}/${rel || 'index'}`;
}

/** Published path of a document path (/…/index → /…/). */
export const webPath = (doc) => doc.replace(/\/index$/, '/');

/** Is this an image URL we copy locally (WordPress uploads, Flickr)? */
export function isCopiedImage(src) {
  try {
    const u = new URL(src);
    return (u.hostname === 'sites.lsa.umich.edu' && u.pathname.includes('/wp-content/uploads/'))
      || u.hostname.endsWith('staticflickr.com');
  } catch (e) {
    return false;
  }
}

/**
 * Full-size URL of a WordPress upload (drops the "-300x200" / "-scaled" size suffix).
 * @param {string} src
 */
export function fullSizeUrl(src) {
  const u = new URL(src);
  if (u.hostname.endsWith('staticflickr.com')) return src;
  u.pathname = u.pathname.replace(/-(\d+x\d+|scaled)(\.[a-z0-9]+)$/i, '$2');
  return u.href;
}

/**
 * Local file name (under /media-da/fastlab/) for an image URL. WordPress uploads
 * keep their year/month, so same-named uploads don't collide; every image is
 * stored as JPEG (the source serves AVIF).
 * @param {string} src
 */
export function imageName(src) {
  const u = new URL(fullSizeUrl(src));
  const base = decodeURIComponent(u.pathname.split('/').pop()).replace(/\.[a-z0-9]+$/i, '');
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (u.hostname.endsWith('staticflickr.com')) return `flickr-${slug(base)}.jpg`;
  const ym = /\/uploads\/sites\/\d+\/(\d{4})\/(\d{2})\//.exec(u.pathname);
  return `${ym ? `${ym[1]}-${ym[2]}-` : ''}${slug(base)}.jpg`;
}

/**
 * Decode a Cloudflare-obfuscated email (the hex after /cdn-cgi/l/email-protection#,
 * or a data-cfemail attribute).
 * @param {string} hex
 */
export function decodeCfEmail(hex) {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) {
    // eslint-disable-next-line no-bitwise
    out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  }
  try {
    out = decodeURIComponent(escape(out));
  } catch (e) {
    // not UTF-8 encoded — keep as is
  }
  // WordPress's antispambot() also writes the address as numeric character references
  return out
    .replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));
}
