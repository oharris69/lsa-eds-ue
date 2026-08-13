/* eslint-disable */
/* global WebImporter */

// Import script for the LSA site footer → /en/footer fragment.
// footer.js loads the fragment and appends its children into the footer block.
// Images keep original absolute https://lsa.umich.edu URLs.

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const src = document.body;
    const main = document.createElement('div');
    const footerSrc = src.querySelector('.footer-wrap');

    if (footerSrc) {
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
        main.appendChild(p);
      }

      // Link columns → heading (title) + list each
      footerSrc.querySelectorAll('.footer-col').forEach((col) => {
        const title = col.querySelector('li.title');
        if (title) {
          const h = document.createElement('h3');
          h.textContent = title.textContent.trim();
          main.appendChild(h);
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
        if (ul.children.length) main.appendChild(ul);
      });

      // Copyright
      const copy = footerSrc.querySelector('.copyright');
      if (copy) {
        const p = document.createElement('p');
        p.innerHTML = copy.innerHTML.trim();
        main.appendChild(p);
      }
    }

    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);

    return [{
      element: main,
      path: '/en/footer',
      report: { fragment: 'footer' },
    }];
  },
};
