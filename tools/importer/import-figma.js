/* eslint-disable */
/* global WebImporter */

// Import script for pages built from Figma designs (tools/importer/figma/*.html).
//
// The source is authored close to the final document:
//   - blocks as block tables (first row = block name, e.g. "Cards (stats-band)")
//   - one <section> per page section; data-style → Section Metadata "Style"
//   - data-field="x" on a table cell → `<!-- field:x -->` hint (md2jcr / sync)
//   - images under /media-da/ (the site's DA media folder)
// The importer strips <hr> and comments from the source page, so section breaks,
// Section Metadata and field hints are created here.
// The document lands under the language root at the source file's path:
// figma/figma-test.html → /en/figma-test, figma/lsa-figma/index.html → /en/lsa-figma/index.

import { LANG } from './doc-path.mjs';

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.querySelector('main') || document.body;

    // Field hints.
    main.querySelectorAll('[data-field]').forEach((cell) => {
      cell.prepend(document.createComment(` field:${cell.dataset.field} `));
      cell.removeAttribute('data-field');
    });

    // Images: keep the site-relative /media-da/ path (not the local server origin).
    main.querySelectorAll('img[src]').forEach((img) => {
      const src = new URL(img.getAttribute('src'), params.originalURL);
      if (src.pathname.startsWith('/media-da/')) img.setAttribute('src', src.pathname);
    });

    // Sections → content + Section Metadata, separated by <hr>.
    const sections = [...main.querySelectorAll(':scope > section')];
    sections.forEach((section, i) => {
      const { style } = section.dataset;
      if (style) {
        section.append(WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style },
        }));
      }
      if (i > 0) section.before(document.createElement('hr'));
      section.replaceWith(...section.childNodes);
    });

    // Document path = the source file's path below the server root.
    const name = new URL(params.originalURL).pathname.replace(/^\//, '').replace(/\.html?$/, '')
      .split('/').map((seg) => WebImporter.FileUtils.sanitizePath(seg)).join('/');

    return [{
      element: main,
      path: `/${LANG}/${name}`,
      report: { title: document.title, template: 'figma', sections: sections.length },
    }];
  },
};
