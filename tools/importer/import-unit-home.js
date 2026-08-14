/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';

const parsers = {
  hero: heroParser,
  cards: cardsParser,
  columns: columnsParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json ("unit-home")
//
// Unit / program home pages (Residential College, CGIS). A stack of full-bleed
// gridwrapper sections inside #content:
//   1. #gridparlsa_gridwrapper_copy_gridclass            (Hero — pull-quote overlay over RC banner + 3 CTAs)
//   2. #gridparlsa_gridwrapper_1975_gridclass            (Our Mission text + slideshow + 4 promo tiles) — default content
//   3. #gridparlsa_gridwrapper_3050_gridclass            (Keene Theater gallery) -> style "dark"
//   4. #gridparlsa_gridwrapper_1416_gridclass            (Featured News cards + Instagram) — white/light, default content
//   5. #gridparlsa_gridwrapper_3050_237596116_gridclass  (RC Art Gallery gallery) -> style "dark"
//   6. #gridparlsa_gridwrapper_gridclass                 (Support CTA banner) — default content
//
// Blocks reuse existing project blocks (hero, cards). Sections 2/3/5/6 are default
// content (rich text + images + buttons); only the styled sections carry section metadata.
const PAGE_TEMPLATE = {
  name: 'unit-home',
  description: 'Top-level unit / program home pages (Residential College, CGIS).',
  urls: [
    'https://lsa.umich.edu/rc',
    'https://lsa.umich.edu/cgis',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '#gridparlsa_gridwrapper_copy_gridclass',
      ],
    },
    {
      name: 'cards',
      instances: [
        '#gridparlsa_gridwrapper_1416_gridclass .lsa-news-wrap',
      ],
    },
    {
      name: 'section-keene-theater',
      instances: ['#gridparlsa_gridwrapper_3050_gridclass'],
      section: 'dark',
    },
    {
      name: 'section-art-gallery',
      instances: ['#gridparlsa_gridwrapper_3050_237596116_gridclass'],
      section: 'dark',
    },
  ],
};

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
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
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
