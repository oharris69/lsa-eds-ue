/* eslint-disable */
/* global WebImporter */

/**
 * Parser for the `accordion` block. Base block: accordion.
 * Source: LSA interior pages (e.g. /lsa/prospective-students/graduate/frequently-asked-questions)
 *
 * The live site renders each collapsible group as its own `.accordion` component:
 *   .accordion > .accordion-wrap > .rib (h3 title + plus icon) + .accordion-body (rich text)
 * The import script wraps consecutive `.accordion` siblings in `.lsa-accordion-group`
 * so one EDS accordion block holds the whole run — one row per item, 2 cells:
 *   [ title (plain text) | content (rich text) ]
 * blocks/accordion/accordion.js turns each row into <details><summary>.
 */
export default function parse(element, { document }) {
  const items = element.matches('.accordion')
    ? [element]
    : Array.from(element.querySelectorAll('.accordion'));

  const cells = [];
  items.forEach((item) => {
    const titleEl = item.querySelector('.rib h1, .rib h2, .rib h3, .rib h4, .rib h5, .rib h6, .rib');
    const title = titleEl ? titleEl.textContent.replace(/\s+/g, ' ').trim() : '';
    const bodyEl = item.querySelector('.accordion-body');
    if (!title && !bodyEl) return;

    const content = document.createElement('div');
    if (bodyEl) {
      Array.from(bodyEl.children)
        .filter((c) => !c.classList.contains('clearfix'))
        .forEach((c) => content.appendChild(c.cloneNode(true)));
    }
    cells.push([title, content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
