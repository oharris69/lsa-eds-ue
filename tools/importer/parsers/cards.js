/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `cards` block variant. Base block: cards (container of `card` items).
 * Source: https://lsa.umich.edu/ (homepage template)
 * Instances (page-templates.json) — THREE distinct usages, at different DOM granularities:
 *   1. "#gridparlsa_gridwrapper_1456_162245604_gridclass .lsa-news-wrap"
 *        → element is a CONTAINER holding 2 `.story` cards (Featured News):
 *          linked lead image + <h3><a>title</a></h3> + <p>description</p> + Read More link.
 *   2. "#gridparlsa_gridwrapper_1286_gridclass .hoverShine"
 *        → element IS a SINGLE image-only card (Magazine 2x2 grid, 4 matches):
 *          a linked image, NO body text.
 *   3. "#gridparlsa_gridwrapper_4264_1137812086_gridclass .lsa_tile"
 *        → element IS a SINGLE rollover card (More from LSA Magazine, 6 matches):
 *          square image + <h3>title</h3> + <p>hover description</p> + More Info CTA.
 * Generated: 2026-08-13
 *
 * Project (xwalk) card model (blocks/cards/_cards.json): image (reference), text (richtext),
 *   ctastyle (select, default "button"). Cards is a CONTAINER block: one row per card.
 *   Columns per row: [image, text]. ctastyle is left to its model default (not authored per-card),
 *   matching the analysis field hints (per-card: image + text only).
 *   Field hints: image cell → `<!-- field:image -->`; text cell → `<!-- field:text -->`.
 *   Empty cells carry NO hint (per hinting rules). Every row has the same 2 columns; an
 *   image-only card still includes an (empty) text cell.
 *
 * Image URLs are kept as their ORIGINAL absolute https://lsa.umich.edu/... paths (no rewriting).
 * Link hrefs are preserved exactly as authored.
 */

const HERO_BASE = 'https://lsa.umich.edu/';

function toAbsolute(url, element) {
  if (!url) return url;
  try {
    const base = (element && element.ownerDocument && element.ownerDocument.defaultView
      && element.ownerDocument.defaultView.location
      && element.ownerDocument.defaultView.location.href) || HERO_BASE;
    return new URL(url, base).href;
  } catch (e) {
    return url;
  }
}

/** Build an <img> with an absolute src, preserving alt. */
function buildImg(srcImg, element, document) {
  if (!srcImg) return null;
  const img = document.createElement('img');
  img.setAttribute('src', toAbsolute(srcImg.getAttribute('src'), element));
  const alt = srcImg.getAttribute('alt');
  if (alt) img.setAttribute('alt', alt);
  return img;
}

/** Wrap an <img> in a link (preserving href) if a href is provided. */
function maybeLink(img, href, element, document) {
  if (!img) return null;
  if (!href) return img;
  const a = document.createElement('a');
  a.setAttribute('href', href); // preserve as-is (relative or absolute)
  a.appendChild(img);
  return a;
}

/** Create a <p><a href>label</a></p> CTA paragraph. */
function buildCta(label, href, document) {
  if (!label && !href) return null;
  const p = document.createElement('p');
  const a = document.createElement('a');
  if (href) a.setAttribute('href', href);
  a.textContent = label || href;
  p.appendChild(a);
  return p;
}

export default function parse(element, { document }) {
  // --- Determine the list of card source elements + their type ---
  // Featured News: the matched element is a wrapper containing multiple `.story` cards.
  const stories = Array.from(element.querySelectorAll('.story'));
  let cardEls;
  if (stories.length) {
    cardEls = stories;
  } else {
    // Magazine grid (`.hoverShine`) and rollover tiles (`.lsa_tile`) match a single card each.
    cardEls = [element];
  }

  const cells = [];

  cardEls.forEach((card) => {
    const isStory = card.matches('.story') || !!card.querySelector('.lead-image');
    const isTile = card.matches('.lsa_tile') || !!card.querySelector('.tile-item, .tile-title');
    // else: image-only card (hoverShine / plain linked image)

    const imgEl = card.querySelector('img');

    // Primary link: descendant anchor first (story lead-image / tile-item),
    // else an ancestor anchor (hoverShine wraps the figure in an <a>).
    const linkEl = card.querySelector('a[href]') || card.closest('a[href]');
    const linkHref = linkEl ? linkEl.getAttribute('href') : '';

    // --- image cell (field:image) ---
    const imageFrag = document.createDocumentFragment();
    const img = buildImg(imgEl, element, document);
    if (img) {
      imageFrag.appendChild(document.createComment(' field:image '));
      // Keep the image linked (preserves the card's destination href).
      imageFrag.appendChild(maybeLink(img, linkHref, element, document));
    }

    // --- text cell (field:text) ---
    const textFrag = document.createDocumentFragment();
    const textNodes = [];

    if (isStory) {
      // Heading (contains linked title), description paragraph, Read More link.
      const heading = card.querySelector('.copy h1, .copy h2, .copy h3, .copy h4, h3');
      if (heading) textNodes.push(heading.cloneNode(true));
      const desc = card.querySelector('.copy > p');
      if (desc) textNodes.push(desc.cloneNode(true));
      const readMore = card.querySelector('a.readMoreLink, .text a[href]');
      if (readMore) {
        const cta = buildCta(readMore.textContent.trim(), readMore.getAttribute('href'), document);
        if (cta) textNodes.push(cta);
      }
    } else if (isTile) {
      // Title (h2.tile-title), hover description, "More Info" CTA (tile is wrapped in a link).
      const title = card.querySelector('.tile-title, h1, h2, h3, h4');
      if (title) {
        const h = document.createElement('h3');
        h.textContent = title.textContent.trim();
        textNodes.push(h);
      }
      const desc = card.querySelector('.tile-rollover p, .bottom > p, p');
      if (desc) {
        const p = document.createElement('p');
        p.textContent = desc.textContent.trim();
        textNodes.push(p);
      }
      const ctaEl = card.querySelector('.tile-cta');
      const ctaLabel = ctaEl ? ctaEl.textContent.replace(/\s+/g, ' ').trim() : '';
      if (ctaLabel) {
        const cta = buildCta(ctaLabel, linkHref, document);
        if (cta) textNodes.push(cta);
      }
    }
    // image-only cards (hoverShine): no text nodes → empty text cell (no hint).

    if (textNodes.length) {
      textFrag.appendChild(document.createComment(' field:text '));
      textNodes.forEach((n) => textFrag.appendChild(n));
    }

    // Every row has 2 columns: [image, text]. Text cell may be empty (image-only card).
    cells.push([imageFrag, textFrag]);
  });

  // --- Empty-block guard ---
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
