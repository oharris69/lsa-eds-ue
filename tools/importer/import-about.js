/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns-about.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';
import { sitePath } from './doc-path.mjs';

const parsers = {
  hero: heroParser,
  cards: cardsParser,
  columns: columnsParser,
};

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json ("about")
// Recreated from import-about.bundle.js (the source was never committed).
const PAGE_TEMPLATE = {
  name: 'about',
  description: 'LSA About page: image+pull-quote hero, five image+text+button columns sections, and a promo image-link cards grid.',
  urls: [
    'https://lsa.umich.edu/lsa/about.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '#gridparlsa_gridwrapper_copy_1064718945_gridclass',
      ],
    },
    {
      name: 'columns',
      instances: [
        '#gridparlsa_gridwrapper_1033507225_gridclass',
        '#gridparlsa_gridwrapper_1163586397_gridclass',
        '#gridparlsa_gridwrapper_1750984253_gridclass',
        '#gridparlsa_gridwrapper_934011541_gridclass',
        '#gridparlsa_gridwrapper_72192711_gridclass',
      ],
    },
    {
      name: 'cards',
      instances: [
        '#gridparlsa_gridwrapper_418777680_gridclass',
      ],
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

    // Document path under the language root, mirroring lsa.umich.edu (doc-path.mjs).
    const path = WebImporter.FileUtils.sanitizePath(sitePath(new URL(params.originalURL).pathname));

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
