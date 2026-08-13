/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroParser from './parsers/hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';

// PARSER REGISTRY - Map parser names to functions
const parsers = {
  hero: heroParser,
  cards: cardsParser,
  columns: columnsParser,
};

// TRANSFORMER REGISTRY - cleanup first, then sections (adds breaks + section metadata)
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json ("homepage")
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'College homepage — top-level landing page for the LSA site. Hero, featured news, CTA banners, magazine features.',
  urls: [
    'https://lsa.umich.edu/',
  ],
  blocks: [
    {
      name: 'hero',
      instances: [
        '#gridparlsa_gridwrapper_1456_379967915_gridclass',
        '#gridparlsa_gridwrapper_1742_gridclass',
      ],
    },
    {
      name: 'cards',
      instances: [
        '#gridparlsa_gridwrapper_1456_162245604_gridclass .lsa-news-wrap',
        '#gridparlsa_gridwrapper_1286_gridclass .hoverShine',
        '#gridparlsa_gridwrapper_4264_1137812086_gridclass .lsa_tile',
      ],
    },
    {
      name: 'columns',
      instances: [
        '#gridparlsa_gridwrapper_5488_gridclass',
      ],
    },
    {
      name: 'section-student-experience',
      instances: [
        '#gridparlsa_gridwrapper_5488_gridclass',
      ],
      section: 'dark',
    },
    {
      name: 'section-more-from-lsa-magazine',
      instances: [
        '#gridparlsa_gridwrapper_4264_1137812086_gridclass',
      ],
      section: 'light-blue-bg',
    },
  ],
};

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * Skips section-* entries — those carry section styling, handled by the sections transformer.
 * @param {Document} document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Array of block instances found on the page
 */
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

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers.
    //    Skip elements already replaced by a prior parser (detached from DOM).
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // Already replaced by earlier parser
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path. Map the root/homepage URL to `/index`.
    //    A pathname of `/` becomes '' after trailing-slash stripping, which crashes
    //    the bundled importer's path polyfill (`.cwd is not a function`).
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
