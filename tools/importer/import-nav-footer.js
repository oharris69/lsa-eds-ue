/* eslint-disable */
/* global WebImporter */

// Import script for the LSA site header (/en/nav) and footer (/en/footer) fragments.
// Input: a single source document containing #vue-header-root-container + .footer-wrap
//        (migration-work/source-html/header-footer-source.html, served locally).
// Output: TWO documents —
//   /en/nav    : 3 sections (brand / sections / tools) as header.js expects
//   /en/footer : the 4 link columns + logo + copyright as footer.js expects
// Images keep original absolute https://lsa.umich.edu URLs (assets uploaded to AEM later).

/** Build the nav fragment element (3 sections separated later into brand/sections/tools). */
function buildNav(document, src) {
  const frag = document.createElement('div');

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

  // ---- Section 2: SECTIONS (main nav) ----
  // Merge functional nav (top-level links) + 4 audience mega-menus (as dropdowns).
  const sections = document.createElement('div');
  const navUl = document.createElement('ul');

  // 2a. functional nav → top-level links
  src.querySelectorAll('.functional-nav-wrap > ul > li > a').forEach((a) => {
    const liEl = document.createElement('li');
    const aEl = document.createElement('a');
    aEl.href = a.getAttribute('href');
    aEl.textContent = a.textContent.trim();
    liEl.appendChild(aEl);
    navUl.appendChild(liEl);
  });

  // 2b. audience mega-menus → dropdown items (label + nested sub-links)
  src.querySelectorAll('.audience-nav-item > li > a.audItem').forEach((audA) => {
    const liEl = document.createElement('li');
    const topA = document.createElement('a');
    topA.href = audA.getAttribute('href');
    topA.textContent = audA.textContent.trim();
    liEl.appendChild(topA);

    const hoverId = audA.getAttribute('data-hover');
    const submenu = hoverId ? src.querySelector(`#audMenu-${hoverId}`) : null;
    if (submenu) {
      const subUl = document.createElement('ul');
      // featured link (if present)
      const featured = submenu.querySelector('a.featuredLink');
      if (featured) {
        const fLi = document.createElement('li');
        const fA = document.createElement('a');
        fA.href = featured.getAttribute('href');
        fA.textContent = featured.textContent.trim();
        fLi.appendChild(fA);
        subUl.appendChild(fLi);
      }
      // highlighted + other link lists
      submenu.querySelectorAll('ul.highlighted > li > a, ul.other > li > a').forEach((sa) => {
        const sLi = document.createElement('li');
        const sA = document.createElement('a');
        sA.href = sa.getAttribute('href');
        sA.textContent = sa.textContent.trim();
        sLi.appendChild(sA);
        subUl.appendChild(sLi);
      });
      if (subUl.children.length) liEl.appendChild(subUl);
    }
    navUl.appendChild(liEl);
  });

  sections.appendChild(navUl);

  // ---- Section 3: TOOLS (utility links) ----
  const tools = document.createElement('div');
  const toolsUl = document.createElement('ul');
  src.querySelectorAll('.top-bar-wrap .lsa-nav > li > a').forEach((a) => {
    const liEl = document.createElement('li');
    const aEl = document.createElement('a');
    aEl.href = a.getAttribute('href');
    aEl.textContent = a.textContent.trim();
    liEl.appendChild(aEl);
    toolsUl.appendChild(liEl);
  });
  tools.appendChild(toolsUl);

  frag.append(brand, document.createElement('hr'), sections, document.createElement('hr'), tools);
  return frag;
}

/** Build the footer fragment element (columns + logo + copyright). */
function buildFooter(document, src) {
  const frag = document.createElement('div');
  const footerSrc = src.querySelector('.footer-wrap');
  if (!footerSrc) return frag;

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
    frag.appendChild(p);
  }

  // Link columns — each becomes a heading (title) + list
  footerSrc.querySelectorAll('.footer-col').forEach((col) => {
    const title = col.querySelector('li.title');
    if (title) {
      const h = document.createElement('h3');
      h.textContent = title.textContent.trim();
      frag.appendChild(h);
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
    if (ul.children.length) frag.appendChild(ul);
  });

  // Copyright
  const copy = footerSrc.querySelector('.copyright');
  if (copy) {
    const p = document.createElement('p');
    p.innerHTML = copy.innerHTML.trim();
    frag.appendChild(p);
  }

  return frag;
}

export default {
  transform: (payload) => {
    const { document } = payload;
    const src = document.body;

    const navEl = buildNav(document, src);
    const footerEl = buildFooter(document, src);

    return [
      {
        element: navEl,
        path: '/en/nav',
        report: { fragment: 'nav' },
      },
      {
        element: footerEl,
        path: '/en/footer',
        report: { fragment: 'footer' },
      },
    ];
  },
};
