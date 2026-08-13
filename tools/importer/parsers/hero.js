/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `hero` block variant. Base block: hero.
 * Source: https://lsa.umich.edu/ (homepage template)
 * Instances (page-templates.json):
 *   - #gridparlsa_gridwrapper_1456_379967915_gridclass  (Section 1 — "Why LSA?" pull-quote hero)
 *   - #gridparlsa_gridwrapper_1742_gridclass             (Section 3 — "Look to Michigan" dark CTA banner)
 * Generated: 2026-08-13
 *
 * Project (xwalk) hero model field order (blocks/hero/_hero.json):
 *   image (reference) + imageAlt (text, COLLAPSED into <img alt>),
 *   text (richtext), enableunderline (boolean), herolayout (select),
 *   backgroundstyle (select), ctalabel (text), ctalink (aem-content),
 *   ctastyle (select), badge (text).
 * Hero is a SIMPLE block: 1 column, one row per (non-collapsed) model field.
 * Only fields that carry authored content are emitted; each content cell gets a
 * `<!-- field:name -->` hint (imageAlt is collapsed into the <img alt> attribute,
 * so it never gets its own row/hint).
 *
 * Background image note: on these LSA sections the hero background is carried by the
 * section's `data-image-src` attribute (a relative /content/dam/... path), NOT an <img>.
 * We surface it as the hero `image` field, resolved to its original absolute
 * https://lsa.umich.edu/... URL (no localization/rewriting).
 */
export default function parse(element, { document }) {
  // --- image field: background carried on the section's data-image-src attribute ---
  // Fallbacks: inline background-image style, or a descendant <img>.
  let bgSrc = element.getAttribute('data-image-src')
    || (element.querySelector('[data-image-src]') || {}).getAttribute?.('data-image-src')
    || '';

  if (!bgSrc) {
    const styled = element.querySelector('[style*="background-image"]') || element;
    const m = (styled.getAttribute && styled.getAttribute('style') || '').match(/background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
    if (m) bgSrc = m[2];
  }

  let bgImg = null;
  if (bgSrc) {
    // Resolve to the original absolute URL (do NOT localize/rewrite the path).
    let absSrc = bgSrc;
    try {
      const base = (element.ownerDocument && element.ownerDocument.defaultView
        && element.ownerDocument.defaultView.location
        && element.ownerDocument.defaultView.location.href) || 'https://lsa.umich.edu/';
      absSrc = new URL(bgSrc, base).href;
    } catch (e) { /* keep raw value if URL construction fails */ }
    bgImg = document.createElement('img');
    bgImg.setAttribute('src', absSrc);
    bgImg.setAttribute('alt', ''); // imageAlt (collapsed) — decorative background
  } else {
    // Last-resort fallback: reuse an existing <img> from the block if present.
    bgImg = element.querySelector('img');
  }

  // --- text field (richtext): headings + paragraphs from text regions ---
  // Sources, in document order:
  //   - .title    → standalone section heading (e.g. Career Wheel "What can you do…")
  //   - .text-wrap → rich-text body (pull-quotes, paragraphs, profile heading+copy)
  // Using a combined selector preserves DOM order across mixed .title/.text-wrap
  // sections. Nested matches are de-duped (skip a region already inside a captured one).
  const textRegions = Array.from(element.querySelectorAll('.title, .text-wrap'))
    .filter((region, _i, all) => !all.some((other) => other !== region && other.contains(region)));
  const textNodes = [];
  textRegions.forEach((region) => {
    Array.from(region.children).forEach((child) => {
      if (child.textContent.trim().length > 0 || child.querySelector('img')) {
        textNodes.push(child);
      }
    });
  });

  // --- herolayout (select): overlay when a pull-quote overlay exists, else text-left background ---
  const herolayout = element.querySelector('.pull-quote-wrapper') ? 'overlay' : 'image-background-text-left';

  // --- backgroundstyle (select): both LSA hero banners are dark full-bleed images ---
  const backgroundstyle = 'theme-dark';

  // --- CTA: the block's action button ("Read More" / "Learn More") ---
  const ctaAnchor = element.querySelector('a.btn, a.lsa-button-click, .button a[href]');
  const ctaLabel = ctaAnchor ? ctaAnchor.textContent.trim() : '';
  const ctaHref = ctaAnchor ? ctaAnchor.getAttribute('href') : '';

  // --- Empty-block guard ---
  if (!bgImg && textNodes.length === 0 && !ctaLabel) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row: image (field:image) — imageAlt collapsed into the <img alt> attribute
  if (bgImg) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:image '));
    frag.appendChild(bgImg);
    cells.push([frag]);
  }

  // Row: text (field:text)
  if (textNodes.length) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:text '));
    textNodes.forEach((n) => frag.appendChild(n));
    cells.push([frag]);
  }

  // Row: herolayout (field:herolayout)
  {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:herolayout '));
    frag.appendChild(document.createTextNode(herolayout));
    cells.push([frag]);
  }

  // Row: backgroundstyle (field:backgroundstyle)
  {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:backgroundstyle '));
    frag.appendChild(document.createTextNode(backgroundstyle));
    cells.push([frag]);
  }

  // Row: ctalabel (field:ctalabel)
  if (ctaLabel) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:ctalabel '));
    frag.appendChild(document.createTextNode(ctaLabel));
    cells.push([frag]);
  }

  // Row: ctalink (field:ctalink) — aem-content link; href preserved as-is.
  if (ctaHref) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:ctalink '));
    const a = document.createElement('a');
    a.setAttribute('href', ctaHref);
    a.textContent = ctaLabel || ctaHref;
    frag.appendChild(a);
    cells.push([frag]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero', cells });
  element.replaceWith(block);
}
