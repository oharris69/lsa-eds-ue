/* eslint-disable */
/* global WebImporter */

// Import script for the academics-directory template (/lsa/academics/*).
// Default-content-only pages: intro rich text + a program/department directory table.
// No block parsers — only the shared cleanup + sections transformers run.

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/lsa-cleanup.js';
import sectionsTransformer from './transformers/lsa-sections.js';
import { sitePath } from './doc-path.mjs';

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

const TYPE_FILTERS = ['.isMajor', '.isMinor', '.isSubMajor', '.isSPS'];
const CATEGORY_FILTERS = ['.isHUM', '.isNAT', '.isSOC', '.isINT'];

const filterLabels = (row, selectors) => selectors
  .map((sel) => row.querySelector(`.visible-xs ${sel} button`))
  .filter(Boolean)
  .map((b) => (b.getAttribute('title') || b.textContent).trim())
  .join(', ');

// The majors-minors program list is a frozen snapshot of an AJAX filter widget:
// each program row repeats filter buttons and is followed by an empty
// "loading" detail row. Rebuild it as a clean `table` block
// (Program | Type | Category) and turn the widget's "#" filter-legend links into
// plain text. In document authoring every table is a block, so leaving the raw
// table would produce an unknown "program-name" block.
function rebuildProgramTable(main, document) {
  const rows = Array.from(main.querySelectorAll('table tr.has-program-detail'));
  if (!rows.length) return;
  const table = rows[0].closest('table');
  const cells = [['Program', 'Type', 'Category']];
  rows.forEach((row) => {
    const name = row.querySelector('.dept-name > a');
    cells.push([
      name ? name.textContent.replace(/\s+/g, ' ').trim() : '',
      filterLabels(row, TYPE_FILTERS),
      filterLabels(row, CATEGORY_FILTERS),
    ]);
  });
  table.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'table', cells }));

  main.querySelectorAll('a[href="#"]').forEach((a) => a.replaceWith(document.createTextNode(a.textContent)));
  main.querySelectorAll('p').forEach((p) => {
    if (/^filtered by:?$/i.test(p.textContent.trim())) p.remove();
  });
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // No block parsers for this template — just DOM cleanup + section handling,
    // plus the program-directory table rebuild (majors-minors only).
    executeTransformers('beforeTransform', main, payload);
    rebuildProgramTable(main, document);
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
        blocks: [],
      },
    }];
  },
};
