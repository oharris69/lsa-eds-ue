/* eslint-disable */
/* global WebImporter */

// Import script for the LSA site header → /nav fragment (site root).
// header.js splits the fragment's 3 top-level children into brand / sections / tools.
// Images keep original absolute https://lsa.umich.edu URLs.

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const src = document.body;
    const main = document.createElement('div');

    // ---- Section 1: BRAND (logo → home) ----
    const brand = document.createElement('div');
    const brandLogo = src.querySelector('.header-logo img');
    const brandP = document.createElement('p');
    const brandA = document.createElement('a');
    brandA.href = '/';
    if (brandLogo) {
      const img = document.createElement('img');
      img.src = brandLogo.getAttribute('src');
      img.alt = brandLogo.getAttribute('alt') || 'U-M College of LSA';
      brandA.appendChild(img);
    } else {
      brandA.textContent = 'U-M College of LSA';
    }
    brandP.appendChild(brandA);
    brand.appendChild(brandP);

    // ---- Section 2: SECTIONS (functional nav: About, Academics, ...) ----
    const sections = document.createElement('div');
    const navUl = document.createElement('ul');

    src.querySelectorAll('.functional-nav-wrap > ul > li > a').forEach((a) => {
      const liEl = document.createElement('li');
      const aEl = document.createElement('a');
      aEl.href = a.getAttribute('href');
      aEl.textContent = a.textContent.trim();
      liEl.appendChild(aEl);
      navUl.appendChild(liEl);
    });

    sections.appendChild(navUl);

    // ---- Section 4: AUDIENCE ("for" band: Prospective / Current / Alumni / Faculty) ----
    // header.js renders this section as the band under the main menu.
    const audience = document.createElement('div');
    const forP = document.createElement('p');
    forP.textContent = 'for';
    const audUl = document.createElement('ul');
    src.querySelectorAll('.audience-nav-item > li > a.audItem').forEach((audA) => {
      const liEl = document.createElement('li');
      const topA = document.createElement('a');
      topA.href = audA.getAttribute('href');
      topA.textContent = audA.textContent.trim();
      liEl.appendChild(topA);
      audUl.appendChild(liEl);
    });
    audience.append(forP, audUl);

    // ---- Section 3: TOOLS (utility links) ----
    const tools = document.createElement('div');
    const toolsUl = document.createElement('ul');
    src.querySelectorAll('.top-bar-wrap .lsa-nav li:not(.divider) > a').forEach((a) => {
      const liEl = document.createElement('li');
      const aEl = document.createElement('a');
      aEl.href = a.getAttribute('href');
      aEl.textContent = a.textContent.trim();
      liEl.appendChild(aEl);
      toolsUl.appendChild(liEl);
    });
    tools.appendChild(toolsUl);

    main.append(
      brand,
      document.createElement('hr'),
      sections,
      document.createElement('hr'),
      tools,
      document.createElement('hr'),
      audience,
    );

    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);

    return [{
      element: main,
      path: '/nav',
      report: { fragment: 'nav' },
    }];
  },
};
