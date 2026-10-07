/*
 * Section navigation + breadcrumb (lsa.umich.edu interior pages).
 *
 * Auto-blocked by scripts.js on pages whose `section-nav` metadata points at a
 * section-nav document, e.g. /en/lsa/prospective-students/section-nav: one
 * nested list, authored in DA:
 *   - [Prospective Students](/en/lsa/prospective-students)
 *     - [Undergraduate](/en/lsa/prospective-students/undergraduate)
 *       - [What Are the Liberal Arts?](...)
 *     - [Graduate](...)
 *
 * Renders (as on the live site):
 *   - a breadcrumb above the page: home icon | ancestors | current page
 *   - a left menu: section title bar, the second level always shown, and the
 *     branch leading to the current page expanded (with its children)
 * and switches <main> to the two-column interior layout (menu | content) for the
 * leading content sections; full-bleed sections after them span both columns.
 */

const trimPath = (p) => (p || '').replace(/\.html$/, '').replace(/\/+$/, '') || '/';

function toTree(li) {
  const a = li.querySelector(':scope > a, :scope > p > a');
  const sub = li.querySelector(':scope > ul');
  return {
    href: a ? new URL(a.getAttribute('href'), window.location.href).pathname : '',
    text: a ? a.textContent.trim() : li.firstChild?.textContent?.trim() || '',
    children: sub ? [...sub.children].map(toTree) : [],
  };
}

/** Path of nodes from the root to the node for `path` (empty if not found). */
function trailTo(node, path) {
  if (trimPath(node.href) === path) return [node];
  for (let i = 0; i < node.children.length; i += 1) {
    const t = trailTo(node.children[i], path);
    if (t.length) return [node, ...t];
  }
  return [];
}

function buildList(nodes, trail, depth) {
  const ul = document.createElement('ul');
  ul.className = `section-nav-level-${depth}`;
  nodes.forEach((n) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = n.href;
    a.textContent = n.text;
    li.append(a);
    const onTrail = trail.includes(n);
    if (n === trail[trail.length - 1]) {
      li.classList.add('active');
      a.setAttribute('aria-current', 'page');
    } else if (onTrail) {
      li.classList.add('open');
    }
    if (onTrail && n.children.length) li.append(buildList(n.children, trail, depth + 1));
    ul.append(li);
  });
  return ul;
}

function buildBreadcrumb(trail, homeHref) {
  const nav = document.createElement('nav');
  nav.className = 'section-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  const home = document.createElement('li');
  home.className = 'section-breadcrumb-home';
  home.innerHTML = `<a href="${homeHref}" aria-label="Home"><span class="section-breadcrumb-home-icon" aria-hidden="true"></span></a>`;
  ol.append(home);
  trail.forEach((n, i) => {
    const li = document.createElement('li');
    if (i === trail.length - 1) {
      li.setAttribute('aria-current', 'page');
      li.textContent = n.text;
    } else {
      const a = document.createElement('a');
      a.href = n.href;
      a.textContent = n.text;
      li.append(a);
    }
    ol.append(li);
  });
  nav.append(ol);
  return nav;
}

export default async function decorate(block) {
  const section = block.closest('.section');
  const main = block.closest('main');
  const navLink = block.querySelector('a');
  const navPath = navLink ? new URL(navLink.href, window.location.href).pathname : '';
  const resp = navPath ? await fetch(`${trimPath(navPath)}.plain.html`) : null;
  if (!resp || !resp.ok) {
    section?.remove();
    return;
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = await resp.text();
  const rootLi = tmp.querySelector('ul > li');
  if (!rootLi) {
    section?.remove();
    return;
  }
  const root = toTree(rootLi);
  const current = trimPath(window.location.pathname);
  let trail = trailTo(root, current);
  if (!trail.length) trail = [root];

  // left menu: title bar + second level (+ the branch to the current page)
  const menu = document.createElement('nav');
  menu.className = 'section-nav-menu';
  menu.setAttribute('aria-label', root.text);
  const details = document.createElement('details');
  details.open = window.matchMedia('(min-width: 900px)').matches;
  const summary = document.createElement('summary');
  summary.className = 'section-nav-title';
  const titleLink = document.createElement('a');
  titleLink.href = root.href;
  titleLink.textContent = root.text;
  summary.append(titleLink);
  details.append(summary, buildList(root.children, trail, 2));
  menu.append(details);
  block.replaceChildren(menu);

  // breadcrumb spans both columns above the page
  const lang = window.location.pathname.split('/')[1] || 'en';
  const crumbSection = document.createElement('div');
  crumbSection.className = 'section breadcrumb-container';
  crumbSection.dataset.sectionStatus = 'loaded';
  crumbSection.append(buildBreadcrumb(trail, `/${lang}/`));

  // two-column layout for the leading content sections (until a full-bleed hero)
  const sections = [...main.querySelectorAll(':scope > .section')].filter((s) => s !== section);
  let leading = 0;
  while (leading < sections.length && !sections[leading].classList.contains('hero-container')) leading += 1;
  sections.slice(leading).forEach((s) => s.classList.add('section-nav-full'));
  section.style.gridRow = `2 / span ${Math.max(leading, 1)}`;
  main.classList.add('has-section-nav');
  main.prepend(crumbSection);
}
