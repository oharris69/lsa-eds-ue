/*
 * LSA Design System page title (Figma "Internal Page Navigation" / the top of the
 * Faculty and Staff template): breadcrumb, the page title and — when the block
 * has a list of pages — a round chevron that opens them as a dropdown.
 *
 * Rows (xwalk model `lsa-page-title`):
 *   1 breadcrumb  list of links; the first is shown as the home icon, the last
 *                 is the current page
 *   2 title       heading (a plain line becomes the page's <h1>)
 *   3 links       optional list of the section's pages (the dropdown)
 */
let idCounter = 0;

function buildBreadcrumb(row) {
  const items = row ? [...row.querySelectorAll('li')] : [];
  const links = items.length ? items : [...(row?.querySelectorAll('a') || [])];
  if (!links.length) return null;
  const nav = document.createElement('nav');
  nav.className = 'lsa-page-title-breadcrumb';
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');
  links.forEach((item, i) => {
    const li = document.createElement('li');
    const a = item.tagName === 'A' ? item : item.querySelector('a');
    const text = (a || item).textContent.trim();
    if (i === links.length - 1 && i > 0) {
      li.setAttribute('aria-current', 'page');
      li.textContent = text;
    } else if (a) {
      const link = document.createElement('a');
      link.href = a.href;
      if (i === 0) {
        link.className = 'lsa-page-title-home';
        link.setAttribute('aria-label', text || 'Home');
      } else {
        link.textContent = text;
      }
      li.append(link);
    } else {
      li.textContent = text;
    }
    ol.append(li);
  });
  nav.append(ol);
  return nav;
}

function buildDropdown(block, list, heading) {
  idCounter += 1;
  const id = `lsa-page-title-menu-${idCounter}`;
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'lsa-page-title-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', id);
  toggle.setAttribute('aria-label', `Pages in ${heading.textContent.trim()}`);

  const panel = document.createElement('div');
  panel.className = 'lsa-page-title-menu';
  panel.id = id;
  panel.hidden = true;
  list.querySelectorAll('a').forEach((a) => {
    a.classList.remove('button');
    a.closest('.button-container')?.classList.remove('button-container');
    if (new URL(a.href).pathname === window.location.pathname) a.setAttribute('aria-current', 'page');
  });
  panel.append(list);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !block.contains(e.target)) setOpen(false);
  });
  block.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      toggle.focus();
    }
  });
  return { toggle, panel };
}

export default function decorate(block) {
  const [crumbRow, titleRow, linksRow] = [...block.children];
  const breadcrumb = buildBreadcrumb(crumbRow);

  let heading = titleRow?.querySelector('h1, h2, h3');
  if (!heading) {
    heading = document.createElement('h1');
    heading.textContent = titleRow?.textContent.trim() || document.title;
  }
  const titleBar = document.createElement('div');
  titleBar.className = 'lsa-page-title-bar';
  titleBar.append(heading);

  const list = linksRow?.querySelector('ul');
  if (list) {
    const { toggle, panel } = buildDropdown(block, list, heading);
    titleBar.append(toggle, panel);
  }

  block.replaceChildren(...[breadcrumb, titleBar].filter(Boolean));
}
