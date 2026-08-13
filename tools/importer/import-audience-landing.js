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

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json ("audience-landing")
const PAGE_TEMPLATE = {
  name: 'audience-landing',
  description: 'Audience/program landing pages (prospective students, transfer, undergraduate).',
  urls: [
    'https://lsa.umich.edu/lsa/prospective-students.html',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '#gridparlsa_gridwrapper_copy_868376211_gridclass',
        '#gridparlsa_gridwrapper_719363065_gridclass',
        '#gridparlsa_gridwrapper_1904_1991551209_gridclass',
        '#gridparlsa_gridwrapper_1373_238990270_gridclass',
        '#gridparlsa_gridwrapper_1373_1439544965_gridclass',
        '#gridparlsa_gridwrapper_1772_gridclass',
      ],
    },
    {
      name: 'cards',
      instances: [
        '#gridparlsa_gridwrapper_gridclass .hoverShine',
        '#gridparlsa_gridwrapper_1697763167_gridclass .lsa_tile',
      ],
    },
    {
      name: 'columns',
      instances: [
        '#gridparlsa_gridwrapper_1526_gridclass',
      ],
    },
    {
      name: 'section-career-wheel',
      instances: ['#gridparlsa_gridwrapper_1772_gridclass'],
      section: 'career-wheel-bg',
    },
    {
      name: 'section-business-umblue',
      instances: ['#gridparlsa_gridwrapper_1526_gridclass'],
      section: 'umblue',
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
