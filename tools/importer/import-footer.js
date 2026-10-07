/* eslint-disable */
/* global WebImporter */

// Import script for the LSA site footer → /footer fragment (site root).
// footer.js loads the fragment and appends its sections into the footer block.
// Document structure (authorable in DA):
//   section 1: Columns block — [logo] | [title + links] x4 (Information for,
//              More about LSA, Student Resources, Connect)
//   section 2: copyright line
// Images keep original absolute https://lsa.umich.edu URLs.

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const src = document.body;
    const main = document.createElement('div');
    const footerSrc = src.querySelector('.footer-wrap');

    if (footerSrc) {
      const row = [];

      // Logo
      const logoImg = footerSrc.querySelector('.footer-logo img');
      if (logoImg) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = 'https://lsa.umich.edu';
        const img = document.createElement('img');
        img.src = logoImg.getAttribute('src');
        img.alt = logoImg.getAttribute('alt') || 'LSA';
        a.appendChild(img);
        p.appendChild(a);
        row.push([p]);
      }

      // Link columns → heading (title) + list each
      // Older markup wraps each column in .footer-col; the current live footer is
      // a plain <ul> per column whose first <li class="title"> is the heading.
      const cols = footerSrc.querySelectorAll('.footer-col').length
        ? footerSrc.querySelectorAll('.footer-col')
        : Array.from(footerSrc.querySelectorAll('ul')).filter((ul) => ul.querySelector('li.title'));
      cols.forEach((col) => {
        const cell = [];
        const title = col.querySelector('li.title');
        if (title) {
          const h = document.createElement('h3');
          h.textContent = title.textContent.trim();
          cell.push(h);
        }
        const ul = document.createElement('ul');
        col.querySelectorAll('li:not(.title)').forEach((li) => {
          const a = li.querySelector('a');
          if (!a) return;
          const liEl = document.createElement('li');
          const aEl = document.createElement('a');
          aEl.href = a.getAttribute('href');
          aEl.textContent = a.textContent.trim();
          liEl.appendChild(aEl);
          ul.appendChild(liEl);
        });
        if (ul.children.length) cell.push(ul);
        if (cell.length) row.push(cell);
      });

      if (row.length) {
        main.appendChild(WebImporter.Blocks.createBlock(document, { name: 'columns', cells: [row] }));
      }

      // Copyright (own section)
      const copy = footerSrc.querySelector('.copyright');
      if (copy) {
        main.appendChild(document.createElement('hr'));
        const p = document.createElement('p');
        p.innerHTML = copy.innerHTML.trim();
        main.appendChild(p);
      }
    }

    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);

    return [{
      element: main,
      path: '/footer',
      report: { fragment: 'footer' },
    }];
  },
};
