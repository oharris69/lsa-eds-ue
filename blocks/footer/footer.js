import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';

import {
  getLanguage, getSiteName, PATH_PREFIX,
} from '../../scripts/utils.js';

/**
 * Resolve a top-level fragment beside the current page's language root, keeping
 * the site segment intact. Finds the first `/{lang}/` segment and rebuilds up to
 * it, then appends the fragment name (works for /content/{site}/{lang}/…,
 * /content/{lang}/…, and /{lang}/… alike). Falls back to `/{lang}/{name}`.
 */
function footerFragmentPath(lang) {
  const segments = window.location.pathname.split('/');
  const langIdx = segments.indexOf(lang);
  if (langIdx > -1) {
    return `${segments.slice(0, langIdx + 1).join('/')}/footer`;
  }
  return `/${lang}/footer`;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const langCode = getLanguage();
  const siteName = await getSiteName();
  const isAuthor = isAuthorEnvironment();
  let footerPath;
  if (footerMeta) {
    footerPath = new URL(footerMeta, window.location).pathname;
  } else if (isAuthor) {
    footerPath = `/content/${siteName}${PATH_PREFIX}/${langCode}/footer`;
  } else {
    // Resolve relative to the current page's own language root so the site
    // segment is preserved on AEM preview/publish (/content/{site}/{lang}/...)
    // as well as EDS delivery (/{lang}/...). Hardcoding a root 404s the fragment.
    footerPath = footerFragmentPath(langCode);
  }

  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
