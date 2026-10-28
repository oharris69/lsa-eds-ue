/* eslint-disable */
/* global WebImporter */

// Import script for the FAST Lab site (sites.lsa.umich.edu/fastlab — LSA Sites,
// WordPress / Astra + Gutenberg) into /en/departments/fastlab, in the LSA Design
// System (theme lsa-ds, FAST Lab nav/footer).
//
// The source is Cloudflare-protected, so pages are imported from Bright Data
// snapshots served locally (tools/importer/bd-snapshots/sites.lsa.umich.edu on
// :8094, see urls-fastlab.txt); images are downloaded beforehand by
// fastlab-images.mjs into /media-da/fastlab/ (same names as imageName()).
//
// Templates (by WordPress body class):
//   home          split hero (lab photo + "About"), Lab Updates cards, sustainability row
//   page          page title (breadcrumb + h1, sub-page dropdown in Media/Join/Contact)
//                 + the Gutenberg content:
//                   runs of image+linked-heading columns (press, presentations) → Lsa Cards (list)
//                   staff listings (Members)                                  → Lsa Cards (people)
//                   latest-posts                                              → Lsa Cards
//                   text + image columns                                      → Columns (media)
//                   YouTube embeds → Video; Flickr embeds → linked image; buttons → button links
//   single-post   page title + date + article
//   staff-member  page title + Lsa Cards (profile)
// Links to FAST Lab pages are rewritten to their /en/departments/fastlab paths;
// Cloudflare-obfuscated emails are decoded.

import {
  docPath, webPath, isCopiedImage, imageName, decodeCfEmail, DOC_ROOT, FASTLAB_ORIGIN,
} from './fastlab-paths.mjs';
import profiles from './fastlab-profiles.json';
import missing from './fastlab-missing-images.json';
import flickrEmbeds from './fastlab-flickr.json';

const HOME = webPath(`${DOC_ROOT}/index`);
const SECTIONS = {
  media: { title: 'Media', pages: [['Press', 'media/press'], ['Presentations', 'media/presentations'], ['Lab Photos', 'media/lab-photos']] },
  join: { title: 'Join', pages: [['Graduates', 'join/graduates'], ['Undergraduates', 'join/undergraduates'], ['Past Theses & Dissertations', 'join/past-theses']] },
  contact: { title: 'Contact Us', pages: [['Participate', 'participate']] },
};
const PARENT = {
  'media/press': 'media', 'media/presentations': 'media', 'media/lab-photos': 'media',
  'join/graduates': 'join', 'join/undergraduates': 'join', 'join/past-theses': 'join',
  'join/past-theses/masters-theses': 'join', participate: 'contact',
};

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const cleanTitle = (t) => t.split(/\s[–-]\s/)[0].trim();

function el(document, tag, html) {
  const e = document.createElement(tag);
  if (html !== undefined) e.innerHTML = html;
  return e;
}

/** A block table cell, optionally with an md2jcr field hint. */
function cell(document, nodes, field) {
  const div = document.createElement('div');
  if (field) div.append(document.createComment(` field:${field} `));
  [].concat(nodes).filter(Boolean).forEach((n) => div.append(typeof n === 'string' ? el(document, 'p', n) : n));
  return div;
}

function block(document, name, rows) {
  return WebImporter.Blocks.createBlock(document, { name, cells: rows });
}

/** Source pathname (/fastlab/...) of a link, or null if it's not a FAST Lab link. */
function fastlabPath(href, base) {
  try {
    const u = new URL(href, base);
    if (u.hostname === 'sites.lsa.umich.edu' || u.hostname === 'localhost') {
      return u.pathname.startsWith('/fastlab') ? u.pathname : null;
    }
  } catch (e) { /* not a URL */ }
  return null;
}

/** Rewrite links, decode emails, and point images at their local copies. */
function fixLinksAndMedia(root, document, base) {
  // links from an image to its WordPress attachment page → just the image
  root.querySelectorAll('a[href] > img[data-permalink]').forEach((img) => {
    const a = img.parentElement;
    if (a.getAttribute('href') === img.getAttribute('data-permalink')) a.replaceWith(...a.childNodes);
  });
  root.querySelectorAll('[data-cfemail]').forEach((span) => {
    const email = decodeCfEmail(span.getAttribute('data-cfemail'));
    span.replaceWith(document.createTextNode(email));
  });
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    const cf = /\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/i.exec(href);
    if (cf) {
      const email = decodeCfEmail(cf[1]);
      a.setAttribute('href', `mailto:${email}`);
      if (/\[email/.test(a.textContent) || !a.textContent.trim()) a.textContent = email;
      return;
    }
    const p = fastlabPath(href, base);
    if (!p) return;
    const doc = docPath(p);
    const hash = href.includes('#') ? href.slice(href.indexOf('#')) : '';
    // migrated page → its new path; uploads (PDFs) and archives → the live site
    a.setAttribute('href', doc ? webPath(doc) + hash : `${FASTLAB_ORIGIN}${p}`);
  });
  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    ['srcset', 'sizes', 'data-src', 'data-srcset', 'loading', 'decoding', 'width', 'height', 'class', 'style'].forEach((x) => img.removeAttribute(x));
    if (isCopiedImage(src)) {
      // broken on the source site too → drop it (and an image-only link around it)
      if (missing.includes(imageName(src))) {
        const a = img.closest('a');
        if (a && !a.textContent.trim() && a.querySelectorAll('img').length === 1) a.remove();
        else img.remove();
        return;
      }
      img.setAttribute('src', `/media-da/fastlab/${imageName(src)}`);
    }
    const alt = (img.getAttribute('alt') || '').replace(/\s*:\s*$/, '').trim();
    img.setAttribute('alt', alt);
  });
}

/** Strip WordPress chrome inside the content. */
function cleanContent(root) {
  root.querySelectorAll('script, style, noscript, .wp-block-spacer, .screen-reader-text, svg').forEach((n) => n.remove());
  root.querySelectorAll('hr').forEach((n) => n.remove());
  // WordPress link-preview embeds: drop the iframe, keep the fallback link;
  // md2jcr has no blockquote, so quotes become plain paragraphs
  root.querySelectorAll('iframe.wp-embedded-content').forEach((n) => n.remove());
  root.querySelectorAll('blockquote').forEach((q) => q.replaceWith(...q.childNodes));
  root.querySelectorAll('p').forEach((p) => {
    if (!p.textContent.replace(/ /g, ' ').trim() && !p.querySelector('img, a, iframe')) p.remove();
  });
}

/** Linkify bare URLs in a paragraph. */
function linkify(p, document) {
  p.innerHTML = p.innerHTML.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, pre, url) => {
    const clean = url.replace(/[.,;]$/, '');
    return `${pre}<a href="${clean}">${clean}</a>${url.slice(clean.length)}`;
  });
}

/** Page title block: breadcrumb (Home / [section] / page), h1, sub-page dropdown. */
function pageTitle(document, rel, title) {
  const crumbs = el(document, 'ul');
  const li = (text, href) => {
    const item = el(document, 'li');
    item.append(href ? Object.assign(el(document, 'a'), { href, textContent: text }) : text);
    crumbs.append(item);
  };
  li('FAST Lab', HOME);
  const parentKey = PARENT[rel];
  if (parentKey) li(SECTIONS[parentKey].title, webPath(`${DOC_ROOT}/${parentKey === 'contact' ? 'contact' : parentKey}`));
  if (rel.startsWith('members/')) li('Members', webPath(`${DOC_ROOT}/members`));
  li(title, webPath(`${DOC_ROOT}/${rel}`));
  const rows = [[cell(document, crumbs, 'breadcrumb')], [cell(document, el(document, 'h1', title), 'title')]];
  const sectionKey = SECTIONS[rel] ? rel : parentKey;
  if (sectionKey) {
    const list = el(document, 'ul');
    SECTIONS[sectionKey].pages.forEach(([text, path]) => {
      const item = el(document, 'li');
      item.append(Object.assign(el(document, 'a'), { href: webPath(`${DOC_ROOT}/${path}`), textContent: text }));
      list.append(item);
    });
    rows.push([cell(document, list, 'links')]);
  }
  return block(document, 'Lsa Page Title', rows);
}

/** Is this Gutenberg columns block a media item (image + linked heading)? */
const isMediaItem = (c) => c.matches('.wp-block-columns') && c.querySelector('img') && c.querySelector('h2 a, h3 a, h4 a');

/** A card row from an image (optional) and body nodes. */
function cardRow(document, img, bodyNodes) {
  const media = img ? (() => { const p = el(document, 'p'); p.append(img); return p; })() : null;
  return [cell(document, media, 'image'), cell(document, bodyNodes, 'text')];
}

/** Press / presentation item → card row. */
function mediaItemRow(document, cols) {
  const img = cols.querySelector('img');
  const body = [...cols.querySelectorAll('h2, h3, h4, p')].filter((n) => n.textContent.trim() && !n.querySelector('img'));
  body.forEach((h) => { if (/^H[24]$/.test(h.tagName)) { const h3 = el(document, 'h3', h.innerHTML); h.replaceWith(h3); } });
  return cardRow(document, img, [...cols.querySelectorAll('h3, p')].filter((n) => n.textContent.trim() && !n.querySelector('img')));
}

/** Staff listing (Members page) → people cards. */
function peopleCards(document, listing) {
  const rows = [...listing.querySelectorAll('.staff-member')].map((m) => {
    const img = m.querySelector('.staff-member-photo');
    const name = m.querySelector('.staff-member-name')?.textContent.trim() || '';
    const slug = profiles[norm(name)];
    const h3 = el(document, 'h3');
    if (slug) h3.append(Object.assign(el(document, 'a'), { href: webPath(`${DOC_ROOT}/members/${slug}`), textContent: name }));
    else h3.textContent = name;
    const body = [h3];
    const pos = m.querySelector('.staff-member-position');
    if (pos) body.push(el(document, 'p', `<strong>${pos.textContent.trim()}</strong>`));
    const email = m.querySelector('.staff-member-email');
    if (email) { const p = el(document, 'p'); p.append(email); body.push(p); }
    const bio = m.querySelector('.staff-member-bio');
    if (bio) {
      const text = bio.querySelector('p')?.textContent.replace(/\s+/g, ' ').trim() || '';
      if (slug && text.length > 220) body.push(el(document, 'p', `${text.slice(0, 200).replace(/\s+\S*$/, '')}…`));
      else [...bio.children].forEach((c) => body.push(c));
    }
    return cardRow(document, img, body);
  });
  return block(document, 'Lsa Cards (people)', rows);
}

/** Gutenberg content → LSA DS document content. */
function convertContent(document, ec, base) {
  const out = [];
  const kids = [...ec.children];
  for (let i = 0; i < kids.length; i += 1) {
    const c = kids[i];
    if (isMediaItem(c)) {
      const rows = [];
      while (i < kids.length && isMediaItem(kids[i])) { rows.push(mediaItemRow(document, kids[i])); i += 1; }
      i -= 1;
      out.push(block(document, 'Lsa Cards (list)', rows));
    } else if (c.matches('.staff-member-listing')) {
      out.push(peopleCards(document, c));
    } else if (c.matches('.wp-block-latest-posts')) {
      const rows = [...c.querySelectorAll('li')].map((li) => {
        const a = li.querySelector('.wp-block-latest-posts__post-title');
        const h3 = el(document, 'h3'); h3.append(a);
        const ex = li.querySelector('.wp-block-latest-posts__post-excerpt');
        ex?.querySelector('.wp-block-latest-posts__read-more')?.remove();
        return cardRow(document, null, [h3, ex ? el(document, 'p', ex.textContent.trim()) : null]);
      });
      out.push(block(document, 'Lsa Cards', rows));
    } else if (c.matches('.wp-block-columns')) {
      const filled = (col) => col.textContent.trim() || col.querySelector('img');
      // a single column that only wraps another columns block → use the inner one
      let layout = c;
      for (;;) {
        const only = [...layout.querySelectorAll(':scope > .wp-block-column')].filter(filled);
        const inner = only.length === 1 && only[0].querySelector(':scope > .wp-block-columns');
        if (!inner) break;
        layout = inner;
      }
      const cols = [...layout.querySelectorAll(':scope > .wp-block-column')].filter(filled);
      const imgCol = cols.find((col) => col.querySelector('img') && !col.textContent.trim());
      const textCols = cols.filter((col) => col !== imgCol);
      if (imgCol && textCols.length === 1) {
        const img = imgCol.querySelector('img');
        const pic = el(document, 'p'); pic.append(img);
        textCols[0].querySelectorAll('p').forEach((p) => linkify(p, document));
        out.push(block(document, 'Columns (media)', [[cell(document, [...textCols[0].children]), cell(document, pic)]]));
      } else {
        cols.forEach((col) => out.push(...col.children));
      }
    } else if (c.matches('.wp-block-embed-youtube')) {
      const src = c.querySelector('iframe')?.getAttribute('src') || '';
      const id = /embed\/([^?&/]+)/.exec(src)?.[1];
      if (id) {
        const url = `https://www.youtube.com/watch?v=${id}`;
        out.push(block(document, 'Video', [[cell(document, `<a href="${url}">${url}</a>`, 'videoUrl')]]));
      }
    } else if (c.matches('.wp-block-embed-flickr, .wp-block-image')) {
      let a = c.querySelector('a[href]');
      let img = c.querySelector('img');
      if (!img && c.matches('.wp-block-embed-flickr')) {
        // Flickr's script swapped the embed for an iframe → rebuild it from the snapshot scan
        const i = [...document.querySelectorAll('.wp-block-embed-flickr')].indexOf(c);
        const embed = flickrEmbeds[new URL(base).pathname]?.[Math.max(i, 0)];
        if (embed) {
          a = el(document, 'a'); a.setAttribute('href', embed.href);
          img = el(document, 'img');
          img.setAttribute('src', `/media-da/fastlab/${imageName(embed.src)}`);
          img.setAttribute('alt', embed.alt);
        }
      }
      if (img) {
        const p = el(document, 'p');
        if (a && a.getAttribute('href') !== img.getAttribute('src')) { a.replaceChildren(img); p.append(a); } else p.append(img);
        out.push(p);
        const cap = c.querySelector('figcaption');
        if (cap?.textContent.trim()) out.push(el(document, 'p', `<em>${cap.textContent.trim()}</em>`));
      }
    } else if (c.matches('.wp-block-buttons')) {
      c.querySelectorAll('a').forEach((a) => {
        const p = el(document, 'p'); const s = el(document, 'strong');
        a.removeAttribute('class'); s.append(a); p.append(s); out.push(p);
      });
    } else if (c.matches('.wp-block-file')) {
      const a = c.querySelector('a[href]:not(.wp-block-file__button)') || c.querySelector('a[href]');
      if (a) { const p = el(document, 'p'); p.append(a); out.push(p); }
    } else if (c.matches('div') && !c.matches('[class*="wp-block"]')) {
      out.push(...c.children);
    } else {
      out.push(c);
    }
  }
  // headings one level down from a page's h1 start at h2
  out.forEach((n) => { if (n.tagName === 'H4' && !out.some((m) => m.tagName === 'H2' || m.tagName === 'H3')) { const h = el(document, 'h2', n.innerHTML); n.replaceWith(h); } });
  return out;
}

function metadata(document, title, description) {
  const meta = {
    Title: `${title} | FAST Lab | U-M LSA`,
    Description: description,
    theme: 'lsa-ds',
    nav: `${DOC_ROOT}/nav`,
    footer: `${DOC_ROOT}/footer`,
  };
  return WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: meta });
}

function section(document, nodes, style) {
  const s = document.createElement('div');
  nodes.filter(Boolean).forEach((n) => s.append(n));
  if (style) s.append(WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style } }));
  return s;
}

/**
 * Decode Cloudflare-obfuscated emails before the importer's own cleanup, which
 * drops links without text (the staff header's email link is just an icon).
 */
function decodeEmails(document) {
  document.querySelectorAll('[data-cfemail]').forEach((span) => {
    span.replaceWith(document.createTextNode(decodeCfEmail(span.getAttribute('data-cfemail'))));
  });
  document.querySelectorAll('a[href*="/cdn-cgi/l/email-protection#"]').forEach((a) => {
    const hex = /email-protection#([0-9a-f]+)/i.exec(a.getAttribute('href'))[1];
    const email = decodeCfEmail(hex);
    a.setAttribute('href', `mailto:${email}`);
    if (/\[email/.test(a.textContent) || !a.textContent.trim()) a.textContent = email;
  });
}

export default {
  preprocess: ({ document }) => decodeEmails(document),

  transform: ({ document, params }) => {
    decodeEmails(document);
    const base = params.originalURL;
    const srcPath = new URL(base).pathname;
    const doc = docPath(srcPath);
    const rel = doc.slice(DOC_ROOT.length + 1);
    const body = document.body;
    const article = document.querySelector('#main article') || document.querySelector('#main');
    const ec = article.querySelector('.entry-content') || article;
    fixLinksAndMedia(article, document, base);
    cleanContent(ec);

    const pageTitleText = cleanTitle(article.querySelector('h1')?.textContent || document.title);
    const firstText = [...ec.querySelectorAll('p')].map((p) => p.textContent.replace(/\s+/g, ' ').trim()).find((t) => t.length > 60) || '';
    const description = firstText.length > 160 ? `${firstText.slice(0, 157).replace(/\s+\S*$/, '')}…` : firstText;
    const main = document.createElement('main');
    let template = 'page';

    if (body.classList.contains('home')) {
      template = 'home';
      const kids = [...ec.children];
      const about = kids.find((k) => k.matches('.wp-block-columns') && /about/i.test(k.querySelector('h2')?.textContent || ''));
      const img = about?.querySelector('img');
      const aboutText = about ? [...about.querySelectorAll('p')] : [];
      const heroText = [el(document, 'h1', 'Food and Addiction Science &amp; Treatment Lab'), ...aboutText];
      const heroImg = img ? (() => { const p = el(document, 'p'); p.append(img); return p; })() : null;
      main.append(section(document, [block(document, 'Lsa Hero (split)', [[cell(document, heroImg, 'image')], [cell(document, heroText, 'text')]])]));
      about?.remove();
      ec.querySelectorAll(':scope > h4').forEach((h) => h.replaceWith(el(document, 'h2', h.innerHTML)));
      const rest = convertContent(document, ec, base);
      // "Lab Updates" heading + cards, then the certification row
      main.append(section(document, rest));
      main.append(section(document, [metadata(document, 'Food and Addiction Science & Treatment Lab', description || 'The Food and Addiction Science and Treatment (FAST) Lab at the University of Michigan.')]));
    } else if (body.classList.contains('single-staff-member') || article.querySelector('.staff-header')) {
      template = 'staff-member';
      const header = article.querySelector('.staff-header');
      const img = header?.querySelector('img');
      const name = cleanTitle(header?.querySelector('h1')?.textContent || pageTitleText);
      const bodyNodes = [];
      const meta = header?.querySelector('.staff-meta');
      const title = meta?.querySelector('.title')?.textContent.trim();
      if (title) bodyNodes.push(el(document, 'p', `<strong>${title}</strong>`));
      const email = header?.querySelector('a[href^="mailto:"]');
      if (email) { const addr = email.getAttribute('href').slice(7); bodyNodes.push(el(document, 'p', `<a href="mailto:${addr}">${addr}</a>`)); }
      const content = article.querySelector('.staff-content') || ec;
      cleanContent(content);
      bodyNodes.push(...content.children);
      main.append(section(document, [pageTitle(document, rel, name)]));
      main.append(section(document, [block(document, 'Lsa Cards (profile)', [cardRow(document, img, bodyNodes)])]));
      main.append(section(document, [el(document, 'p', `<em><a href="${webPath(`${DOC_ROOT}/members`)}">All lab members</a></em>`), metadata(document, name, description || `${name}, FAST Lab, University of Michigan.`)]));
    } else if (body.classList.contains('single-post')) {
      template = 'post';
      const date = article.querySelector('[itemprop="datePublished"], .published')?.textContent.trim();
      const nodes = convertContent(document, ec, base);
      main.append(section(document, [pageTitle(document, rel, pageTitleText)]));
      main.append(section(document, [date ? el(document, 'p', `<strong>${date}</strong>`) : null, ...nodes], 'narrow'));
      main.append(section(document, [el(document, 'p', `<em><a href="${HOME}">Back to FAST Lab</a></em>`), metadata(document, pageTitleText, description)]));
    } else {
      const nodes = convertContent(document, ec, base);
      main.append(section(document, [pageTitle(document, rel, pageTitleText)]));
      main.append(section(document, nodes));
      main.append(section(document, [metadata(document, pageTitleText, description)]));
    }

    // Sections → <hr>-separated content (the importer turns each into a section).
    const out = document.createElement('div');
    [...main.children].forEach((s, i) => {
      if (i > 0) out.append(document.createElement('hr'));
      out.append(...s.childNodes);
    });

    return [{
      element: out,
      path: doc,
      report: { title: pageTitleText, template },
    }];
  },
};
