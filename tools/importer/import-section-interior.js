/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsParser from './parsers/cards.js';
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';

const parsers = {
  cards: cardsParser,
  accordion: accordionParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - college section interior pages
//
// Interior pages of a college section (the /lsa/prospective-students tree: Graduate,
// Transfer, Admissions, Student Stories, LSA 101, ...). No full-bleed gridwrapper
// sections: the interior shell (breadcrumb + h1 + left section-nav) is dropped as
// chrome and #page-content is mostly default content, plus:
//   - .four_button promo grid                 → cards (four-button branch)
//   - .stat-row stat tiles                    → cards (stats)
//   - runs of linked image tiles (.hoverShine) to section pages, e.g. the Student
//     Stories portraits                       → cards (promo image-link branch)
//   - runs of .accordion components (Graduate FAQ/Applying/Funding) → accordion
//   - the live events calendar widget (LSA 101 Events) → a link to the full calendar
// YouTube thumbnail tiles (LSA 101) stay default content (linked image).
const PAGE_TEMPLATE = {
  name: 'section-interior',
  description: 'College section interior pages (e.g. /lsa/prospective-students/*).',
  urls: [
    'https://lsa.umich.edu/lsa/prospective-students/graduate.html',
  ],
  blocks: [
    {
      name: 'cards',
      instances: [
        '#page-content .four_button .four-button-wrap',
        '#page-content .stat-row',
        '#page-content .lsa-tile-group',
      ],
    },
    {
      name: 'accordion',
      instances: [
        '#page-content .lsa-accordion-group',
      ],
    },
  ],
};

const LSA_ORIGIN = 'https://lsa.umich.edu';

/** Next element sibling, skipping layout spacers. */
function nextContentSibling(el) {
  let n = el.nextElementSibling;
  while (n && (n.matches('.spacer, .clearfix') || (!n.textContent.trim() && !n.querySelector('img, a, iframe')))) {
    n = n.nextElementSibling;
  }
  return n;
}

/**
 * Wrap each run of >= `min` consecutive siblings matching `test` in a
 * <div class="{className}"> so a single parser handles the whole run.
 */
function groupRuns(root, selector, test, className, min, document) {
  const seen = new Set();
  root.querySelectorAll(selector).forEach((start) => {
    if (seen.has(start) || !test(start)) return;
    const run = [start];
    let n = nextContentSibling(start);
    while (n && n.matches(selector) && test(n)) {
      run.push(n);
      n = nextContentSibling(n);
    }
    run.forEach((el) => seen.add(el));
    if (run.length < min) return;
    const wrap = document.createElement('div');
    wrap.className = className;
    start.before(wrap);
    run.forEach((el) => wrap.appendChild(el));
  });
}

function prepareComponents(main, document) {
  // Accordions: consecutive .accordion components → one accordion block.
  groupRuns(main, '#page-content .accordion', () => true, 'lsa-accordion-group', 1, document);

  // Linked image tiles pointing at site pages (not YouTube) → one cards block.
  const internalTile = (cmp) => {
    const a = cmp.querySelector('.hoverShine') && cmp.querySelector('a[href]');
    if (!a) return false;
    const href = a.getAttribute('href');
    return href.startsWith('/') || href.startsWith(LSA_ORIGIN);
  };
  groupRuns(main, '#page-content .cmp-image', internalTile, 'lsa-tile-group', 2, document);

  // Live (AJAX, date-driven) events calendar → its page title (without the live
  // date, e.g. "Events: Wednesday, October 7, 2026" → "Events") + a link to the
  // full calendar. The widget hosts the page's only <h1>.
  main.querySelectorAll('.events_calendar').forEach((cal) => {
    const frag = document.createDocumentFragment();
    const title = cal.querySelector('h1');
    if (title) {
      const h1 = document.createElement('h1');
      h1.textContent = title.textContent.replace(/\s+/g, ' ').trim().split(':')[0];
      frag.appendChild(h1);
    }
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.setAttribute('href', `${LSA_ORIGIN}/lsa/news-events/events.html`);
    a.textContent = 'View the LSA events calendar';
    p.appendChild(a);
    frag.appendChild(p);
    cal.replaceWith(frag);
  });
}

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks
    .filter((blockDef) => !blockDef.name.startsWith('section-'))
    .forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null,
          });
        });
      });
    });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    executeTransformers('beforeTransform', main, payload);
    prepareComponents(main, document);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    executeTransformers('afterTransform', main, payload);

    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
