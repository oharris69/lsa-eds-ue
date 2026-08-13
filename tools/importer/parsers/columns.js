/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `columns` block variant. Base block: columns.
 * Source: https://lsa.umich.edu/ (homepage template)
 * Instance (page-templates.json):
 *   - "#gridparlsa_gridwrapper_5488_gridclass"  (Section 4 — "Student Experience")
 * Generated: 2026-08-13
 *
 * Project (xwalk) columns model (blocks/columns/_columns.json): fields columns (number),
 *   rows (number) are derived by columns.js from the table shape — they are NOT authored
 *   as cells. Per the field-hinting rules, COLUMNS BLOCKS DO NOT GET FIELD-HINT COMMENTS;
 *   cells contain only default content (text/images/links). columns.js sets
 *   `columns-N-cols` from the first row's child count and treats each row as a columns-row.
 *
 * Target layout (matches the source's visual side-by-side arrangement and the analysis hint
 *   "[collage image] | [h2 + p + CTA] | [collage image]"): a single row of 3 columns:
 *     col 1: left image collage
 *     col 2: "Student Experience" heading + descriptive paragraph + "Experience Student Life" CTA
 *     col 3: right image collage
 *
 * The source DOM nests these in two `.responsivegrid` wrappers (grid 1 = collage+title+text+button,
 * grid 2 = second collage), so we DON'T map responsivegrids to columns directly; we pull the
 * semantic pieces (images, title, text, button) and lay them out as the intended 3 columns.
 *
 * Image URLs are kept as their ORIGINAL absolute https://lsa.umich.edu/... paths (no rewriting).
 * Link hrefs are preserved exactly as authored.
 */

const SITE_BASE = 'https://lsa.umich.edu/';

function toAbsolute(url, element) {
  if (!url) return url;
  try {
    const base = (element && element.ownerDocument && element.ownerDocument.defaultView
      && element.ownerDocument.defaultView.location
      && element.ownerDocument.defaultView.location.href) || SITE_BASE;
    return new URL(url, base).href;
  } catch (e) {
    return url;
  }
}

/** Build a fresh <img> with an absolute src, preserving alt. */
function buildImg(srcImg, element, document) {
  if (!srcImg) return null;
  const img = document.createElement('img');
  img.setAttribute('src', toAbsolute(srcImg.getAttribute('src'), element));
  const alt = srcImg.getAttribute('alt');
  if (alt) img.setAttribute('alt', alt);
  return img;
}

export default function parse(element, { document }) {
  // Collect all collage images in document order.
  const imgs = Array.from(element.querySelectorAll('.cmp-image img, figure img, img'));
  // De-dupe by src (querySelector union could otherwise repeat).
  const seen = new Set();
  const uniqueImgs = imgs.filter((img) => {
    const s = img.getAttribute('src');
    if (!s || seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  const leftImg = uniqueImgs[0] ? buildImg(uniqueImgs[0], element, document) : null;
  const rightImg = uniqueImgs[1] ? buildImg(uniqueImgs[1], element, document) : null;

  // Middle text column: heading + paragraph + CTA button.
  const middle = [];
  const heading = element.querySelector('.title h1, .title h2, .title h3, h2');
  if (heading) {
    const h = document.createElement(heading.tagName.toLowerCase());
    h.textContent = heading.textContent.trim();
    middle.push(h);
  }
  const para = element.querySelector('.text-wrap p, .text p');
  if (para) middle.push(para.cloneNode(true));
  const ctaAnchor = element.querySelector('a.btn, a.lsa-button-click, .button a[href]');
  if (ctaAnchor) {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', ctaAnchor.getAttribute('href')); // preserve as-is
    a.textContent = ctaAnchor.textContent.trim();
    p.appendChild(a);
    middle.push(p);
  }

  // --- Empty-block guard ---
  if (!leftImg && !rightImg && middle.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Build the 3-column single content row.
  // (Columns blocks: NO field-hint comments — default content only.)
  const col1 = leftImg ? [leftImg] : [''];
  const col2 = middle.length ? middle : [''];
  const col3 = rightImg ? [rightImg] : [''];

  const cells = [[col1, col2, col3]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells });
  element.replaceWith(block);
}
