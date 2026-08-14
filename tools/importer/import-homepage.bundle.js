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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero.js
  function parse(element, { document: document2 }) {
    var _a, _b;
    let bgSrc = element.getAttribute("data-image-src") || ((_b = (_a = element.querySelector("[data-image-src]") || {}).getAttribute) == null ? void 0 : _b.call(_a, "data-image-src")) || "";
    if (!bgSrc) {
      const styled = element.querySelector('[style*="background-image"]') || element;
      const m = (styled.getAttribute && styled.getAttribute("style") || "").match(/background-image\s*:\s*url\((['"]?)([^'")]+)\1\)/i);
      if (m) bgSrc = m[2];
    }
    let bgImg = null;
    if (bgSrc) {
      let absSrc = bgSrc;
      try {
        const base = element.ownerDocument && element.ownerDocument.defaultView && element.ownerDocument.defaultView.location && element.ownerDocument.defaultView.location.href || "https://lsa.umich.edu/";
        absSrc = new URL(bgSrc, base).href;
      } catch (e) {
      }
      bgImg = document2.createElement("img");
      bgImg.setAttribute("src", absSrc);
      bgImg.setAttribute("alt", "");
    } else {
      bgImg = element.querySelector("img");
    }
    const textRegions = Array.from(element.querySelectorAll(".title, .text-wrap")).filter((region, _i, all) => !all.some((other) => other !== region && other.contains(region)));
    const textNodes = [];
    textRegions.forEach((region) => {
      Array.from(region.children).forEach((child) => {
        if (child.textContent.trim().length > 0 || child.querySelector("img")) {
          textNodes.push(child);
        }
      });
    });
    const herolayout = element.querySelector(".pull-quote-wrapper") ? "overlay" : "image-background-text-left";
    const backgroundstyle = "theme-dark";
    const ctaAnchor = element.querySelector("a.btn, a.lsa-button-click, .button a[href]");
    const ctaLabel = ctaAnchor ? ctaAnchor.textContent.trim() : "";
    const ctaHref = ctaAnchor ? ctaAnchor.getAttribute("href") : "";
    if (!bgImg && textNodes.length === 0 && !ctaLabel) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImg) {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:image "));
      frag.appendChild(bgImg);
      cells.push([frag]);
    }
    if (textNodes.length) {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:text "));
      textNodes.forEach((n) => frag.appendChild(n));
      cells.push([frag]);
    }
    {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:enableunderline "));
      frag.appendChild(document2.createTextNode("false"));
      cells.push([frag]);
    }
    {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:herolayout "));
      frag.appendChild(document2.createTextNode(herolayout));
      cells.push([frag]);
    }
    {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:backgroundstyle "));
      frag.appendChild(document2.createTextNode(backgroundstyle));
      cells.push([frag]);
    }
    if (ctaLabel) {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:ctalabel "));
      frag.appendChild(document2.createTextNode(ctaLabel));
      cells.push([frag]);
    }
    if (ctaHref) {
      const frag = document2.createDocumentFragment();
      frag.appendChild(document2.createComment(" field:ctalink "));
      const a = document2.createElement("a");
      a.setAttribute("href", ctaHref);
      a.textContent = ctaLabel || ctaHref;
      frag.appendChild(a);
      cells.push([frag]);
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  var HERO_BASE = "https://lsa.umich.edu/";
  function toAbsolute(url, element) {
    if (!url) return url;
    try {
      const base = element && element.ownerDocument && element.ownerDocument.defaultView && element.ownerDocument.defaultView.location && element.ownerDocument.defaultView.location.href || HERO_BASE;
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  }
  function buildImg(srcImg, element, document2) {
    if (!srcImg) return null;
    const img = document2.createElement("img");
    img.setAttribute("src", toAbsolute(srcImg.getAttribute("src"), element));
    const alt = srcImg.getAttribute("alt");
    if (alt) img.setAttribute("alt", alt);
    return img;
  }
  function maybeLink(img, href, element, document2) {
    if (!img) return null;
    if (!href) return img;
    const a = document2.createElement("a");
    a.setAttribute("href", href);
    a.appendChild(img);
    return a;
  }
  function buildCta(label, href, document2) {
    if (!label && !href) return null;
    const p = document2.createElement("p");
    const a = document2.createElement("a");
    if (href) a.setAttribute("href", href);
    a.textContent = label || href;
    p.appendChild(a);
    return p;
  }
  function parse2(element, { document: document2 }) {
    const stories = Array.from(element.querySelectorAll(".story"));
    let cardEls;
    if (stories.length) {
      cardEls = stories;
    } else {
      cardEls = [element];
    }
    const cells = [];
    cardEls.forEach((card) => {
      const isStory = card.matches(".story") || !!card.querySelector(".lead-image");
      const isTile = card.matches(".lsa_tile") || !!card.querySelector(".tile-item, .tile-title");
      const imgEl = card.querySelector("img");
      const linkEl = card.querySelector("a[href]") || card.closest("a[href]");
      const linkHref = linkEl ? linkEl.getAttribute("href") : "";
      const imageFrag = document2.createDocumentFragment();
      const img = buildImg(imgEl, element, document2);
      if (img) {
        imageFrag.appendChild(document2.createComment(" field:image "));
        imageFrag.appendChild(maybeLink(img, linkHref, element, document2));
      }
      const textFrag = document2.createDocumentFragment();
      const textNodes = [];
      if (isStory) {
        const heading = card.querySelector(".copy h1, .copy h2, .copy h3, .copy h4, h3");
        if (heading) textNodes.push(heading.cloneNode(true));
        const desc = card.querySelector(".copy > p");
        if (desc) textNodes.push(desc.cloneNode(true));
        const readMore = card.querySelector("a.readMoreLink, .text a[href]");
        if (readMore) {
          const cta = buildCta(readMore.textContent.trim(), readMore.getAttribute("href"), document2);
          if (cta) textNodes.push(cta);
        }
      } else if (isTile) {
        const title = card.querySelector(".tile-title, h1, h2, h3, h4");
        if (title) {
          const h = document2.createElement("h3");
          h.textContent = title.textContent.trim();
          textNodes.push(h);
        }
        const desc = card.querySelector(".tile-rollover p, .bottom > p, p");
        if (desc) {
          const p = document2.createElement("p");
          p.textContent = desc.textContent.trim();
          textNodes.push(p);
        }
        const ctaEl = card.querySelector(".tile-cta");
        const ctaLabel = ctaEl ? ctaEl.textContent.replace(/\s+/g, " ").trim() : "";
        if (ctaLabel) {
          const cta = buildCta(ctaLabel, linkHref, document2);
          if (cta) textNodes.push(cta);
        }
      }
      if (textNodes.length) {
        textFrag.appendChild(document2.createComment(" field:text "));
        textNodes.forEach((n) => textFrag.appendChild(n));
      }
      cells.push([imageFrag, textFrag]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns.js
  var SITE_BASE = "https://lsa.umich.edu/";
  function toAbsolute2(url, element) {
    if (!url) return url;
    try {
      const base = element && element.ownerDocument && element.ownerDocument.defaultView && element.ownerDocument.defaultView.location && element.ownerDocument.defaultView.location.href || SITE_BASE;
      return new URL(url, base).href;
    } catch (e) {
      return url;
    }
  }
  function buildImg2(srcImg, element, document2) {
    if (!srcImg) return null;
    const img = document2.createElement("img");
    img.setAttribute("src", toAbsolute2(srcImg.getAttribute("src"), element));
    const alt = srcImg.getAttribute("alt");
    if (alt) img.setAttribute("alt", alt);
    return img;
  }
  function parse3(element, { document: document2 }) {
    const imgs = Array.from(element.querySelectorAll(".cmp-image img, figure img, img"));
    const seen = /* @__PURE__ */ new Set();
    const uniqueImgs = imgs.filter((img) => {
      const s = img.getAttribute("src");
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    });
    const leftImg = uniqueImgs[0] ? buildImg2(uniqueImgs[0], element, document2) : null;
    const rightImg = uniqueImgs[1] ? buildImg2(uniqueImgs[1], element, document2) : null;
    const middle = [];
    const heading = element.querySelector(".title h1, .title h2, .title h3, h2");
    if (heading) {
      const h = document2.createElement(heading.tagName.toLowerCase());
      h.textContent = heading.textContent.trim();
      middle.push(h);
    }
    const para = element.querySelector(".text-wrap p, .text p");
    if (para) middle.push(para.cloneNode(true));
    const ctaAnchor = element.querySelector("a.btn, a.lsa-button-click, .button a[href]");
    if (ctaAnchor) {
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", ctaAnchor.getAttribute("href"));
      a.textContent = ctaAnchor.textContent.trim();
      p.appendChild(a);
      middle.push(p);
    }
    if (!leftImg && !rightImg && middle.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const col1 = leftImg ? [leftImg] : [""];
    const col2 = middle.length ? middle : [""];
    const col3 = rightImg ? [rightImg] : [""];
    const cells = [[col1, col2, col3]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns", cells });
    element.replaceWith(block);
  }

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

  // tools/importer/import-homepage.js
  var parsers = {
    hero: parse,
    cards: parse2,
    columns: parse3
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "College homepage \u2014 top-level landing page for the LSA site. Hero, featured news, CTA banners, magazine features.",
    urls: [
      "https://lsa.umich.edu/"
    ],
    blocks: [
      {
        name: "hero",
        instances: [
          "#gridparlsa_gridwrapper_1456_379967915_gridclass",
          "#gridparlsa_gridwrapper_1742_gridclass"
        ]
      },
      {
        name: "cards",
        instances: [
          "#gridparlsa_gridwrapper_1456_162245604_gridclass .lsa-news-wrap",
          "#gridparlsa_gridwrapper_1286_gridclass .hoverShine",
          "#gridparlsa_gridwrapper_4264_1137812086_gridclass .lsa_tile"
        ]
      },
      {
        name: "columns",
        instances: [
          "#gridparlsa_gridwrapper_5488_gridclass"
        ]
      },
      {
        name: "section-student-experience",
        instances: [
          "#gridparlsa_gridwrapper_5488_gridclass"
        ],
        section: "dark"
      },
      {
        name: "section-more-from-lsa-magazine",
        instances: [
          "#gridparlsa_gridwrapper_4264_1137812086_gridclass"
        ],
        section: "light-blue-bg"
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.filter((blockDef) => !blockDef.name.startsWith("section-")).forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
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
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
