/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: lsa.umich.edu site-wide cleanup.
 *
 * Removes non-authorable site chrome so the imported document contains only the
 * page-level content authors would create/edit. All selectors below were verified
 * against migration-work/cleaned.html (traced DOM nesting), except the search/Vue
 * popover and inline <script>/<style> selectors, which are site-shell elements that
 * the scraper strips from cleaned.html but that are present in the live/raw import
 * DOM (kept here for correctness at import time and cross-template reuse). Missing
 * selectors are no-ops in WebImporter.DOMUtils.remove.
 *
 * IMPORTANT: This transformer never touches <img> tags or their src attributes —
 * image URLs must remain the original absolute https://lsa.umich.edu paths so the
 * assets can be uploaded to AEM later.
 *
 * Structure preserved: the main #content region and its 6 top-level
 * .lsa_gridwrapper sections (hero, featured-news, look-to-michigan CTA,
 * student-experience, lsa-magazine, more-from-lsa-magazine).
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Search / Vue popovers. The <body> carries data-lsa-search-results-selector=".lsa-news-wrap",
// meaning the Vue search widget injects results INTO the news/cards region we parse — so these
// are removed in beforeTransform to keep them out of the cards parser. Selectors from task spec
// (site-shell; not emitted into cleaned.html by the scraper).
const SEARCH_VUE_SELECTORS = [
  '#lsaUnitSearchResults',
  '.searchResults',
  'lsa-vuesearch',
];

// Inline scripts/styles carried by the raw page (non-authorable, non-content).
const INLINE_SCRIPT_STYLE_SELECTORS = [
  'script',
  'style',
  'noscript',
];

// Site header region (verified in cleaned.html as siblings before #content).
const HEADER_SELECTORS = [
  '#vue-header-root-container',
  '.top-bar-wrap',
  '.header-wrap',
  '.department-nav-hoverzone',
  '.phone-search-wrap', // site-shell (mobile header); not in this saved page
  '.phone-nav-wrap',     // site-shell (mobile header); not in this saved page
  '.caution-tape',       // decorative spacer bars before/after #content
];

// Site footer (verified in cleaned.html as sibling after #content).
// `.department-footer-wrap` is the unit-specific footer band (dept name / address /
// phone / social) present on department pages (e.g. /english/*) above the global footer.
const FOOTER_SELECTORS = [
  '.footer-wrap',
  '.department-footer-wrap',
];

// Skip-to-content links (verified: <a class="skipToContent" href="#content">).
const SKIP_LINK_SELECTORS = [
  '.skipToContent',
  'a[href="#content"]',
  '.skipToPageContent',
  'a[href="#content-column"]',
];

// Interior-page shell chrome (present on section/landing pages like audience-landing,
// absent on the homepage — harmless no-ops there). The page <h1> title lives in
// #content-column.pageTitle and must be KEPT, so we strip only the burger toggle
// inside it, not the container. The left section-nav sidebar and breadcrumb are
// auto-generated navigation, not body content.
const INTERIOR_SHELL_SELECTORS = [
  '.breadcrumb-wrap',      // Home / <page> breadcrumb (auto nav)
  '.sideNavBurger',        // mobile section-nav toggle inside .pageTitle (keep the h1)
  '.phone-sidenav',        // wrapper around the left section-nav sidebar
  '.lsa-sidenav-wrap',     // left section-nav sidebar (homepage variant: .lsa-sidenav-wrap.sidenav-wrap)
  '.sidenav-wrap',         // left section-nav sidebar (interior pages: bare .sidenav-wrap, e.g. /english/*, departments-and-units)
  '.lsa_policy_notice-wrap', // empty policy-notice shell region
];

// Leftover non-content elements safe to strip in the final pass.
const RESIDUAL_SELECTORS = [
  'link',
  'iframe',
];

// Layout wrappers that may be left empty after chrome/block extraction (AEM grid noise).
const WRAPPER_SELECTOR = '.lsa_gridwrapper, .responsivegrid, .parbase, .aem-Grid';

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Remove Vue search popovers before block parsing so injected results do not
    // pollute the cards parser (which targets .lsa-news-wrap).
    WebImporter.DOMUtils.remove(element, SEARCH_VUE_SELECTORS);
    // Remove inline scripts/styles carried by the raw import DOM.
    WebImporter.DOMUtils.remove(element, INLINE_SCRIPT_STYLE_SELECTORS);
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable site chrome (header, footer, skip links, residuals).
    WebImporter.DOMUtils.remove(element, [
      ...HEADER_SELECTORS,
      ...FOOTER_SELECTORS,
      ...SKIP_LINK_SELECTORS,
      ...INTERIOR_SHELL_SELECTORS,
      ...RESIDUAL_SELECTORS,
    ]);

    // Remove empty AEM grid/layout wrapper noise left behind after cleanup/parsing.
    // A wrapper is removable only when it has no text, no media, no links, and no
    // parsed block tables — so real content and the 6 gridwrapper sections are kept.
    // Loop until stable, since removing a child wrapper can empty its parent.
    let removedInPass = true;
    let passes = 0;
    while (removedInPass && passes < 5) {
      removedInPass = false;
      passes += 1;
      element.querySelectorAll(WRAPPER_SELECTOR).forEach((el) => {
        const hasMeaningfulChild = el.querySelector('img, picture, source, video, svg, a, table, h1, h2, h3, h4, h5, h6');
        if (!hasMeaningfulChild && el.textContent.trim() === '') {
          el.remove();
          removedInPass = true;
        }
      });
    }
  }
}
