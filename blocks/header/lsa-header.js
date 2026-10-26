/*
 * LSA Design System header (Figma "nav-bar_default" + "Modes Components":
 * Default-Lg / Dark-Nav-Search / Dark-Nav-QuickLinks), used on pages with the
 * `lsa-ds` theme. header.js hands over to this module.
 *
 * The nav document (page metadata `nav`, e.g. /en/lsa-figma/nav) has 4 sections:
 *   1 brand        logo link
 *   2 menu         search link (href = search URL ending in an empty query
 *                  parameter, e.g. …?q=), main links (list), a label paragraph
 *                  ("Information for") and an audience list; a nested list (and
 *                  any paragraph / picture) under an item opens in the second column
 *   3 social       links with :lsa-<network>: icons
 *   4 quick links  links (external ones get an arrow), a tiles list
 *                  (icon + label), and a feature (heading, text, picture)
 * Bar: [Menu]  logo  [Quick Links]. Menu opens a drawer on the left, Quick Links
 * a panel on the right; Escape, the backdrop and the toggle close them.
 */
import { getMetadata, loadCSS } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

const MENU_ICON = '<svg viewBox="0 0 34 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M2 5h9M2 12h7M2 19h9"/><circle cx="21" cy="11" r="7"/><path d="M26 16l5 5"/></g></svg>';
const PLUS_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 7v10M7 12h10" stroke-linecap="round"/></g></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke-linecap="round"/></g></svg>';
const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></g></svg>';
const EXTERNAL_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h5v5M14 2L7 9M12 10v4H2V4h4"/></g></svg>';

/**
 * A fragment path from page metadata (/en/lsa-figma/nav), rebased onto whatever
 * prefix the current page has before its language segment (e.g. /content on the
 * local preview), so the same document works on every host.
 */
export function rebaseFragmentPath(metaPath) {
  const path = new URL(metaPath, window.location).pathname;
  const [first] = path.split('/').filter(Boolean);
  const segments = window.location.pathname.split('/');
  const idx = first ? segments.indexOf(first) : -1;
  if (idx < 1) return path;
  const prefix = segments.slice(0, idx).join('/');
  return path.startsWith(`${prefix}/`) ? path : `${prefix}${path}`;
}

/** Icon-only links (:lsa-facebook:) get their network as an accessible name. */
export function labelIconLinks(root) {
  root.querySelectorAll('a').forEach((a) => {
    const icon = a.querySelector('.icon');
    if (!icon || a.textContent.trim() || a.getAttribute('aria-label')) return;
    const name = [...icon.classList].find((c) => c.startsWith('icon-'))?.replace(/^icon-(lsa-)?/, '') || '';
    const label = { x: 'X', linkedin: 'LinkedIn', youtube: 'YouTube' }[name]
      || name.charAt(0).toUpperCase() + name.slice(1);
    if (label) a.setAttribute('aria-label', label);
  });
}

function isExternal(a) {
  try {
    return new URL(a.href).origin !== window.location.origin;
  } catch (e) {
    return false;
  }
}

function el(tag, attrs = {}, html = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (html) node.innerHTML = html;
  return node;
}

/** Search form from a link whose href ends in an empty query parameter. */
function buildSearch(link) {
  const url = new URL(link.href);
  const param = [...url.searchParams.entries()].find(([, v]) => v === '')?.[0] || 'q';
  url.searchParams.delete(param);
  const form = el('form', { class: 'lsa-nav-search', role: 'search', action: `${url.origin}${url.pathname}` });
  url.searchParams.forEach((value, name) => form.append(el('input', { type: 'hidden', name, value })));
  const label = link.textContent.trim() || 'Search';
  const input = el('input', {
    type: 'search', name: param, placeholder: 'What are you looking for?', 'aria-label': label,
  });
  const submit = el('button', { type: 'submit', 'aria-label': label }, SEARCH_ICON);
  form.append(input, submit);
  return form;
}

/** Menu list item with a nested list → item button + second-column panel. */
function buildSubmenus(list, panelHost, closeOthers) {
  [...list.children].forEach((li, i) => {
    // The item link may be wrapped in a paragraph (li > p > a) once the item has
    // nested content; unwrap it so it sits beside the expand button.
    const wrapped = li.querySelector(':scope > p:first-child > a:only-child');
    if (wrapped) wrapped.parentElement.replaceWith(wrapped);
    const link = li.querySelector(':scope > a');
    const rest = [...li.children].filter((c) => c !== link);
    if (!link || !rest.length) return;
    link.classList.remove('button');
    const id = `lsa-nav-panel-${list.dataset.group}-${i}`;
    const panel = el('div', { class: 'lsa-nav-panel', id, hidden: '' });
    const title = el('p', { class: 'lsa-nav-panel-title' });
    title.append(link.cloneNode(true));
    panel.append(title, ...rest);
    panelHost.append(panel);
    const toggle = el('button', {
      type: 'button', class: 'lsa-nav-expand', 'aria-expanded': 'false', 'aria-controls': id,
    }, PLUS_ICON);
    toggle.setAttribute('aria-label', `More in ${link.textContent.trim()}`);
    li.classList.add('has-panel');
    li.append(toggle);
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      closeOthers();
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      li.classList.toggle('is-open', !open);
    });
  });
}

export default async function decorate(block) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/header/lsa-header.css`);
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? rebaseFragmentPath(navMeta) : '/nav';
  const fragment = await loadFragment(navPath);
  if (fragment) labelIconLinks(fragment);
  const sections = fragment ? [...fragment.querySelectorAll(':scope > .section')] : [];
  const [brandSection, menuSection, socialSection, quickSection] = sections;

  block.textContent = '';
  const nav = el('nav', { id: 'nav', class: 'lsa-nav', 'aria-label': 'Main' });

  // Bar
  const bar = el('div', { class: 'lsa-nav-bar' });
  const menuToggle = el('button', {
    type: 'button', class: 'lsa-nav-toggle lsa-nav-menu-toggle', 'aria-expanded': 'false', 'aria-controls': 'lsa-nav-drawer',
  }, `${MENU_ICON}<span>Menu</span>`);
  const quickToggle = el('button', {
    type: 'button', class: 'lsa-nav-toggle lsa-nav-quick-toggle', 'aria-expanded': 'false', 'aria-controls': 'lsa-nav-quick',
  }, `<span>Quick Links</span>${PLUS_ICON}`);
  const brand = el('div', { class: 'lsa-nav-brand' });
  const brandLink = brandSection?.querySelector('a');
  if (brandLink) {
    brandLink.classList.remove('button');
    brandLink.closest('.button-container')?.classList.remove('button-container');
    brand.append(brandLink);
  }
  bar.append(menuToggle, brand, quickToggle);

  // Menu drawer
  const drawer = el('div', { class: 'lsa-nav-drawer', id: 'lsa-nav-drawer', hidden: '' });
  const drawerMain = el('div', { class: 'lsa-nav-drawer-main' });
  const drawerPanels = el('div', { class: 'lsa-nav-drawer-panels' });
  const closePanels = () => {
    drawer.querySelectorAll('.lsa-nav-expand[aria-expanded="true"]').forEach((b) => {
      b.setAttribute('aria-expanded', 'false');
      b.closest('li')?.classList.remove('is-open');
    });
    drawerPanels.querySelectorAll('.lsa-nav-panel').forEach((p) => { p.hidden = true; });
  };
  if (menuSection) {
    const content = menuSection.querySelector('.default-content-wrapper') || menuSection;
    let group = 0;
    [...content.children].forEach((child) => {
      const searchLink = child.tagName === 'P' && child.querySelector('a[href*="="]');
      if (searchLink && !drawerMain.querySelector('.lsa-nav-search')) {
        drawerMain.append(buildSearch(searchLink));
      } else if (child.tagName === 'UL') {
        child.classList.add('lsa-nav-list');
        child.dataset.group = String(group);
        group += 1;
        buildSubmenus(child, drawerPanels, closePanels);
        drawerMain.append(child);
      } else if (child.tagName === 'P') {
        child.className = 'lsa-nav-label';
        drawerMain.append(child);
      } else {
        drawerMain.append(child);
      }
    });
  }
  if (socialSection) {
    const social = el('div', { class: 'lsa-nav-social' });
    social.append(...(socialSection.querySelector('.default-content-wrapper') || socialSection).children);
    drawerMain.append(social);
  }
  if (brandLink) {
    const footBrand = el('p', { class: 'lsa-nav-drawer-brand' });
    footBrand.append(brandLink.cloneNode(true));
    drawerMain.append(footBrand);
  }
  drawer.append(drawerMain, drawerPanels);

  // Quick links panel
  const quick = el('div', { class: 'lsa-nav-quick', id: 'lsa-nav-quick', hidden: '' });
  if (quickSection) {
    const content = quickSection.querySelector('.default-content-wrapper') || quickSection;
    let lists = 0;
    [...content.children].forEach((child) => {
      if (child.tagName === 'UL') {
        child.classList.add(lists === 0 ? 'lsa-nav-quick-links' : 'lsa-nav-quick-tiles');
        lists += 1;
        child.querySelectorAll('a').forEach((a) => {
          a.classList.remove('button');
          a.closest('.button-container')?.classList.remove('button-container');
          if (child.classList.contains('lsa-nav-quick-links') && isExternal(a)) {
            a.insertAdjacentHTML('beforeend', EXTERNAL_ICON);
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener');
          }
        });
      } else {
        child.classList.add('lsa-nav-quick-feature');
      }
      quick.append(child);
    });
  }

  const backdrop = el('div', { class: 'lsa-nav-backdrop', hidden: '' });
  nav.append(bar, drawer, quick, backdrop);
  block.append(nav);

  // Open / close
  const setOpen = (target) => {
    const menuOpen = target === 'menu';
    const quickOpen = target === 'quick';
    drawer.hidden = !menuOpen;
    quick.hidden = !quickOpen;
    backdrop.hidden = !(menuOpen || quickOpen);
    if (!menuOpen) closePanels();
    menuToggle.setAttribute('aria-expanded', String(menuOpen));
    quickToggle.setAttribute('aria-expanded', String(quickOpen));
    menuToggle.innerHTML = menuOpen ? `${CLOSE_ICON}<span>Close</span>` : `${MENU_ICON}<span>Menu</span>`;
    quickToggle.innerHTML = quickOpen ? `<span>Close</span>${CLOSE_ICON}` : `<span>Quick Links</span>${PLUS_ICON}`;
    nav.dataset.open = target || '';
    document.body.classList.toggle('lsa-nav-open', Boolean(target));
  };
  menuToggle.addEventListener('click', () => setOpen(drawer.hidden ? 'menu' : null));
  quickToggle.addEventListener('click', () => setOpen(quick.hidden ? 'quick' : null));
  backdrop.addEventListener('click', () => setOpen(null));
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !nav.dataset.open) return;
    const toggle = nav.dataset.open === 'menu' ? menuToggle : quickToggle;
    setOpen(null);
    toggle.focus();
  });
}
