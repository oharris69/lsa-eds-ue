/* eslint-disable */
/* global WebImporter */

// Import script for the academics-directory template (/lsa/academics/*).
// Default-content-only pages: intro rich text + a program/department directory table.
// No block parsers — only the shared cleanup + sections transformers run.

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';

const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json ("academics-listing")
const PAGE_TEMPLATE = {
  name: 'academics-listing',
  description: 'Academics directory pages under /lsa/academics/ (majors-minors, departments-and-units). Default-content-only: intro + directory table.',
  urls: [
    'https://lsa.umich.edu/lsa/academics/majors-minors.html',
    'https://lsa.umich.edu/lsa/academics/departments-and-units.html',
  ],
  blocks: [],
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

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // No block parsers for this template — just DOM cleanup + section handling.
    executeTransformers('beforeTransform', main, payload);
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
        blocks: [],
      },
    }];
  },
};
