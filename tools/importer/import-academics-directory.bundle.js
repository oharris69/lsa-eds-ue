/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-academics-directory.js
  var import_academics_directory_exports = {};
  __export(import_academics_directory_exports, {
    default: () => import_academics_directory_default
  });

  // tools/importer/transformers/lsa-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var SEARCH_VUE_SELECTORS = [
    "#lsaUnitSearchResults",
    ".searchResults",
    "lsa-vuesearch"
  ];
  var INLINE_SCRIPT_STYLE_SELECTORS = [
    "script",
    "style",
    "noscript"
  ];
  var HEADER_SELECTORS = [
    "#vue-header-root-container",
    ".top-bar-wrap",
    ".header-wrap",
    ".department-nav-hoverzone",
    ".phone-search-wrap",
    // site-shell (mobile header); not in this saved page
    ".phone-nav-wrap",
    // site-shell (mobile header); not in this saved page
    ".caution-tape"
    // decorative spacer bars before/after #content
  ];
  var FOOTER_SELECTORS = [
    ".footer-wrap"
  ];
  var SKIP_LINK_SELECTORS = [
    ".skipToContent",
    'a[href="#content"]',
    ".skipToPageContent",
    'a[href="#content-column"]'
  ];
  var INTERIOR_SHELL_SELECTORS = [
    ".breadcrumb-wrap",
    // Home / <page> breadcrumb (auto nav)
    ".sideNavBurger",
    // mobile section-nav toggle inside .pageTitle (keep the h1)
    ".phone-sidenav",
    // wrapper around the left section-nav sidebar
    ".lsa-sidenav-wrap",
    // left section-nav sidebar (Undergraduate, Graduate, ...)
    ".lsa_policy_notice-wrap"
    // empty policy-notice shell region
  ];
  var RESIDUAL_SELECTORS = [
    "link",
    "iframe"
  ];
  var WRAPPER_SELECTOR = ".lsa_gridwrapper, .responsivegrid, .parbase, .aem-Grid";
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, SEARCH_VUE_SELECTORS);
      WebImporter.DOMUtils.remove(element, INLINE_SCRIPT_STYLE_SELECTORS);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ...HEADER_SELECTORS,
        ...FOOTER_SELECTORS,
        ...SKIP_LINK_SELECTORS,
        ...INTERIOR_SHELL_SELECTORS,
        ...RESIDUAL_SELECTORS
      ]);
      let removedInPass = true;
      let passes = 0;
      while (removedInPass && passes < 5) {
        removedInPass = false;
        passes += 1;
        element.querySelectorAll(WRAPPER_SELECTOR).forEach((el) => {
          const hasMeaningfulChild = el.querySelector("img, picture, source, video, svg, a, table, h1, h2, h3, h4, h5, h6");
          if (!hasMeaningfulChild && el.textContent.trim() === "") {
            el.remove();
            removedInPass = true;
          }
        });
      }
    }
  }

  // tools/importer/transformers/lsa-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FALLBACK_STYLE_BY_ID = {
    gridparlsa_gridwrapper_5488_gridclass: "dark",
    gridparlsa_gridwrapper_4264_1137812086_gridclass: "light-blue-bg"
  };
  function buildStyleMap(payload) {
    const map = __spreadValues({}, FALLBACK_STYLE_BY_ID);
    const template = payload && payload.template ? payload.template : null;
    const blocks = template && Array.isArray(template.blocks) ? template.blocks : [];
    blocks.forEach((block) => {
      if (block && block.section && Array.isArray(block.instances)) {
        block.instances.forEach((selector) => {
          const match = /#([A-Za-z0-9_-]+)/.exec(selector);
          if (match) {
            map[match[1]] = block.section;
          }
        });
      }
    });
    return map;
  }
  function deriveSectionOrder(element) {
    const ids = [];
    element.querySelectorAll('section[id^="gridparlsa_gridwrapper"]').forEach((el) => {
      if (el.id) ids.push(el.id);
    });
    return ids;
  }
  var STAMP_ID = "data-lsa-section-id";
  var STAMP_STYLE = "data-lsa-section-style";
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.beforeTransform) {
      const styleById = buildStyleMap(payload);
      deriveSectionOrder(element).forEach((id) => {
        const sectionEl = element.querySelector('[id="' + id + '"]');
        if (!sectionEl) return;
        const wrapper = sectionEl.closest(".lsa_gridwrapper") || sectionEl;
        wrapper.setAttribute(STAMP_ID, id);
        if (styleById[id]) wrapper.setAttribute(STAMP_STYLE, styleById[id]);
      });
      return;
    }
    if (hookName === TransformHook2.afterTransform) {
      const doc = payload && payload.document || document;
      const items = Array.from(element.querySelectorAll("[" + STAMP_ID + "]"));
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const topEl = items[i];
        const style = topEl.getAttribute(STAMP_STYLE);
        if (style) {
          const block = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style }
          });
          topEl.after(block);
        }
        if (i > 0) {
          topEl.before(doc.createElement("hr"));
        }
        topEl.removeAttribute(STAMP_ID);
        topEl.removeAttribute(STAMP_STYLE);
      }
    }
  }

  // tools/importer/import-academics-directory.js
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "academics-listing",
    description: "Academics directory pages under /lsa/academics/ (majors-minors, departments-and-units). Default-content-only: intro + directory table.",
    urls: [
      "https://lsa.umich.edu/lsa/academics/majors-minors.html",
      "https://lsa.umich.edu/lsa/academics/departments-and-units.html"
    ],
    blocks: []
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var import_academics_directory_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_academics_directory_exports);
})();
