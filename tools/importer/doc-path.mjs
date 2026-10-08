/**
 * Document paths for the migrated site: lsa.umich.edu's structure under a
 * language root (/en, room for /es etc. later).
 *
 * lsa.umich.edu hosts the College site (/lsa/…, with its home page served at /)
 * and department/unit sites beside it (/english, /psych, /urop, /cgis, /rc).
 * Under the language root the College's pages sit directly below the root and
 * each unit site keeps its slug:
 *   /                                            → /en/index (served at /en/)
 *   /lsa/prospective-students/undergraduate.html → /en/prospective-students/undergraduate
 *   /english/undergraduate.html                  → /en/english/undergraduate
 *
 * Shared by the import scripts (document output paths) and build-da-docs.mjs
 * (link resolution, section-nav and redirects), so both always agree.
 */
export const LANG = 'en';
export const COLLEGE_SITE = 'lsa';

/**
 * Normalize path segments like WebImporter.FileUtils.sanitizePath: lowercase,
 * no .html, non-alphanumerics → "-", no leading/trailing dashes
 * ("what-are-the-liberal-arts-" → "what-are-the-liberal-arts").
 * @param {string} pathname source URL pathname
 * @returns {string[]} segments
 */
export function segmentsOf(pathname) {
  return pathname.replace(/\.html?$/i, '').toLowerCase().split('/')
    .map((s) => s.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean);
}

/**
 * Document path for a source page.
 * @param {string} pathname source URL pathname (e.g. /lsa/about.html)
 * @param {string} [lang] language root
 * @returns {string} e.g. /en/about; the home page is /en/index
 */
export function sitePath(pathname, lang = LANG) {
  const segs = segmentsOf(pathname);
  if (segs[0] === COLLEGE_SITE) segs.shift();
  return `/${[lang, ...(segs.length ? segs : ['index'])].join('/')}`;
}

/**
 * Published URL path of a document path (/en/index → /en/).
 * @param {string} docPath e.g. /en/index
 * @returns {string}
 */
export const webPath = (docPath) => docPath.replace(/\/index$/, '/');
