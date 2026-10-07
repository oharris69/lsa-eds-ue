/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the About-page `columns` variant. Base block: columns.
 * Source: https://lsa.umich.edu/lsa/about.html ("about" template)
 * Instances (page-templates.json): the five image + text + button sections
 *   #gridparlsa_gridwrapper_1033507225_gridclass, _1163586397_, _1750984253_,
 *   _934011541_, _72192711_.
 *
 * Each SECTION becomes one columns row: [section image] | [text group] (| [text group]…).
 * Some sections stack two text groups (e.g. "Our Vision, Mission, and Values" +
 * "Where LSA Is Headed"); each group = heading + paragraph(s) + its nearest CTA.
 * Columns blocks get NO field-hint comments (default content only).
 *
 * Recreated from tools/importer/import-about.bundle.js (the source was never committed).
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

function buildImg(srcImg, element, document) {
  if (!srcImg) return null;
  const img = document.createElement('img');
  img.setAttribute('src', toAbsolute(srcImg.getAttribute('src'), element));
  const alt = srcImg.getAttribute('alt');
  if (alt) img.setAttribute('alt', alt);
  return img;
}

// Build an <img> from an LSA image container. Saved pages can carry images as
// <div data-src="..." data-picture> with a <noscript><img></noscript> fallback;
// JSDOM does not expose <noscript> children, so a plain img query misses them.
// Prefer a real <img>, then any [data-src] (incl. the section's data-image-src).
function lsaImg(container, element, document) {
  if (!container) return null;
  const real = container.querySelector('img');
  if (real && real.getAttribute('src')) return buildImg(real, element, document);
  const ds = container.matches && container.matches('[data-src]')
    ? container
    : container.querySelector('[data-src]');
  const raw = ds && (ds.getAttribute('data-src') || ds.getAttribute('data-image-src'));
  if (!raw) return null;
  const img = document.createElement('img');
  img.setAttribute('src', toAbsolute(raw, element));
  const alt = (ds.getAttribute('data-alt') || '').trim();
  if (alt) img.setAttribute('alt', alt);
  return img;
}

export default function parse(element, { document }) {
  // Section image (any of: real img, data-picture div, section data-image-src).
  const imgContainer = element.querySelector('.cmp-image') || element;
  const sectionImg = lsaImg(imgContainer, element, document)
    || (element.getAttribute('data-image-src') ? lsaImg(element, element, document) : null);

  const textColumns = [];
  const groups = Array.from(element.querySelectorAll('.text-wrap, .title'))
    .filter((g) => g.querySelector('h1, h2, h3, h4') || g.querySelector('p'));
  const usedButtons = new Set();
  groups.forEach((group) => {
    const nodes = [];
    const heading = group.querySelector('h1, h2, h3, h4');
    if (heading) {
      const h = document.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      nodes.push(h);
    }
    group.querySelectorAll('p').forEach((p) => {
      if (p.textContent.trim()) nodes.push(p.cloneNode(true));
    });
    // Nearest CTA button after this group's grid wrapper.
    const wrapper = group.closest('.responsivegrid, .aem-Grid, section') || element;
    const btn = wrapper.querySelector('a.btn, a.lsa-button-click, .button a[href]');
    if (btn && !usedButtons.has(btn)) {
      usedButtons.add(btn);
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', btn.getAttribute('href'));
      a.textContent = btn.textContent.trim();
      p.appendChild(a);
      nodes.push(p);
    }
    if (nodes.length) textColumns.push(nodes);
  });

  if (!sectionImg && textColumns.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Row layout: [image?] then one column per text group.
  const row = [];
  if (sectionImg) row.push([sectionImg]);
  if (textColumns.length) textColumns.forEach((c) => row.push(c));
  else row.push(['']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] });
  element.replaceWith(block);
}
