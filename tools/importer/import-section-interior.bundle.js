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

  // tools/importer/import-section-interior.js
  var import_section_interior_exports = {};
  __export(import_section_interior_exports, {
    default: () => import_section_interior_default
  });

  // tools/importer/parsers/cards.js
  var HERO_BASE = "https://lsa.umich.edu/";
  var STAT_COLORS = [
    ["mi-blue-bg", "stat-navy"],
    ["cyan-blue-bg", "stat-cyan"],
    ["maize-bg", "stat-maize"]
  ];
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
  function cardImg(container, element, document2) {
    const real = container.querySelector("img");
    if (real && real.getAttribute("src")) return buildImg(real, element, document2);
    const ds = container.querySelector("[data-src]");
    const raw = ds && ds.getAttribute("data-src");
    if (!raw) return null;
    const img = document2.createElement("img");
    img.setAttribute("src", toAbsolute(raw, element));
    const alt = (ds.getAttribute("data-alt") || "").trim();
    if (alt) img.setAttribute("alt", alt);
    return img;
  }
  function parsePromoImages(element, document2) {
    const promoImages = Array.from(element.querySelectorAll(".cmp-image"));
    if (promoImages.length < 2) return false;
    const cells = [];
    promoImages.forEach((cmp) => {
      const linkEl = cmp.querySelector("a[href]");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      const img = cardImg(cmp, element, document2);
      if (!img) return;
      const imageFrag = document2.createDocumentFragment();
      imageFrag.appendChild(document2.createComment(" field:image "));
      imageFrag.appendChild(maybeLink(img, href, element, document2));
      const textFrag = document2.createDocumentFragment();
      const label = img.getAttribute("alt");
      if (label) {
        textFrag.appendChild(document2.createComment(" field:text "));
        const h = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.setAttribute("href", href);
          a.textContent = label;
          h.appendChild(a);
        } else {
          h.textContent = label;
        }
        textFrag.appendChild(h);
      }
      cells.push([imageFrag, textFrag]);
    });
    if (!cells.length) return false;
    element.replaceWith(WebImporter.Blocks.createBlock(document2, { name: "cards", cells }));
    return true;
  }
  function parse(element, { document: document2 }) {
    const stories = Array.from(element.querySelectorAll(".story"));
    const fourBtns = Array.from(element.querySelectorAll(".fourBtn"));
    const statBlocks = Array.from(element.querySelectorAll(".stat-block"));
    let cardEls;
    if (stories.length) {
      cardEls = stories;
    } else if (fourBtns.length) {
      cardEls = fourBtns;
    } else if (statBlocks.length) {
      cardEls = statBlocks;
    } else if (parsePromoImages(element, document2)) {
      return;
    } else {
      cardEls = [element];
    }
    const cells = [];
    cardEls.forEach((card) => {
      var _a;
      const isStory = card.matches(".story") || !!card.querySelector(".lead-image");
      const isTile = card.matches(".lsa_tile") || !!card.querySelector(".tile-item, .tile-title");
      const isFourBtn = card.matches(".fourBtn") || !!card.querySelector(".button > .title");
      const isStat = card.matches(".stat-block");
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
        const desc = card.querySelector(".tile-rollover p:not(.tile-title)") || card.querySelector(".bottom > p:not(.tile-title)") || card.querySelector("p:not(.tile-title)");
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
      } else if (isStat) {
        const big = card.querySelector(".stat-lrg");
        if (big) {
          const p = document2.createElement("p");
          const strong = document2.createElement("strong");
          strong.innerHTML = big.innerHTML.trim();
          p.appendChild(strong);
          textNodes.push(p);
        }
        const label = card.querySelector(".stat-text");
        if (label) {
          const p = document2.createElement("p");
          p.textContent = label.textContent.replace(/\s+/g, " ").trim();
          textNodes.push(p);
        }
        const cite = card.querySelector(".stat-cite");
        if (cite) {
          const p = document2.createElement("p");
          p.innerHTML = cite.innerHTML.replace(/\s+/g, " ").trim();
          textNodes.push(p);
        }
      } else if (isFourBtn) {
        const titleEl = card.querySelector(".title");
        const label = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
        if (label) {
          const h = document2.createElement("h3");
          if (linkHref) {
            const a = document2.createElement("a");
            a.setAttribute("href", linkHref);
            a.textContent = label;
            h.appendChild(a);
          } else {
            h.textContent = label;
          }
          textNodes.push(h);
        }
      }
      if (textNodes.length) {
        textFrag.appendChild(document2.createComment(" field:text "));
        textNodes.forEach((n) => textFrag.appendChild(n));
      }
      if (isStat) {
        const styleFrag = document2.createDocumentFragment();
        const p = document2.createElement("p");
        p.textContent = ((_a = STAT_COLORS.find(([cls]) => card.classList.contains(cls))) == null ? void 0 : _a[1]) || "stat-navy";
        styleFrag.appendChild(p);
        cells.push([imageFrag, textFrag, styleFrag]);
      } else {
        cells.push([imageFrag, textFrag]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const name = statBlocks.length ? "cards (stats)" : "cards";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion.js
  function parse2(element, { document: document2 }) {
    const items = element.matches(".accordion") ? [element] : Array.from(element.querySelectorAll(".accordion"));
    const cells = [];
    items.forEach((item) => {
      const titleEl = item.querySelector(".rib h1, .rib h2, .rib h3, .rib h4, .rib h5, .rib h6, .rib");
      const title = titleEl ? titleEl.textContent.replace(/\s+/g, " ").trim() : "";
      const bodyEl = item.querySelector(".accordion-body");
      if (!title && !bodyEl) return;
      const content = document2.createElement("div");
      if (bodyEl) {
        Array.from(bodyEl.children).filter((c) => !c.classList.contains("clearfix")).forEach((c) => content.appendChild(c.cloneNode(true)));
      }
      cells.push([title, content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "accordion", cells });
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
    ".footer-wrap",
    ".department-footer-wrap"
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
    // left section-nav sidebar (homepage variant: .lsa-sidenav-wrap.sidenav-wrap)
    ".sidenav-wrap",
    // left section-nav sidebar (interior pages: bare .sidenav-wrap, e.g. /english/*, departments-and-units)
    ".lsa_policy_notice-wrap"
    // empty policy-notice shell region
  ];
  var RESIDUAL_SELECTORS = [
    "link",
    "iframe"
  ];
  var TRACKING_PIXEL_RE = /(\/\/(t\.co|analytics\.twitter\.com|bat\.bing\.com|www\.facebook\.com\/tr|[a-z.]*doubleclick\.net)\/)|\/adsct\b/i;
  function removeTrackingPixels(element) {
    element.querySelectorAll("img").forEach((img) => {
      if (TRACKING_PIXEL_RE.test(img.getAttribute("src") || "")) img.remove();
    });
  }
  var clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  function flattenEventsFeed(element, document2) {
    element.querySelectorAll(".events-wrap").forEach((wrap) => {
      const events = Array.from(wrap.querySelectorAll("a.event"));
      if (!events.length) return;
      const ul = document2.createElement("ul");
      events.forEach((ev) => {
        const date = [clean(ev.querySelector(".month")), clean(ev.querySelector(".day"))].filter(Boolean).join(" ");
        const title = clean(ev.querySelector(".details .title"));
        const subtitle = clean(ev.querySelector(".details .subtitle"));
        const where = [clean(ev.querySelector(".event_room")), clean(ev.querySelector(".place"))].filter(Boolean).join(" ");
        const when = [clean(ev.querySelector(".time")), where].filter(Boolean).join(", ");
        const li = document2.createElement("li");
        const a = document2.createElement("a");
        a.setAttribute("href", ev.getAttribute("href"));
        a.textContent = [date, [title, subtitle].filter(Boolean).join(": ")].filter(Boolean).join(" \u2014 ") + (when ? `, ${when}` : "");
        li.appendChild(a);
        ul.appendChild(li);
      });
      const out = document2.createElement("div");
      out.appendChild(ul);
      const all = wrap.querySelector(".footline a[href]");
      if (all) {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.setAttribute("href", all.getAttribute("href"));
        a.textContent = clean(all);
        p.appendChild(a);
        out.appendChild(p);
      }
      wrap.replaceWith(out);
    });
  }
  var WRAPPER_SELECTOR = ".lsa_gridwrapper, .responsivegrid, .parbase, .aem-Grid";
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, SEARCH_VUE_SELECTORS);
      WebImporter.DOMUtils.remove(element, INLINE_SCRIPT_STYLE_SELECTORS);
      removeTrackingPixels(element);
      flattenEventsFeed(element, payload && payload.document || element.ownerDocument);
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

  // tools/importer/import-section-interior.js
  var parsers = {
    cards: parse,
    accordion: parse2
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "section-interior",
    description: "College section interior pages (e.g. /lsa/prospective-students/*).",
    urls: [
      "https://lsa.umich.edu/lsa/prospective-students/graduate.html"
    ],
    blocks: [
      {
        name: "cards",
        instances: [
          "#page-content .four_button .four-button-wrap",
          "#page-content .stat-row",
          "#page-content .lsa-tile-group"
        ]
      },
      {
        name: "accordion",
        instances: [
          "#page-content .lsa-accordion-group"
        ]
      }
    ]
  };
  var LSA_ORIGIN = "https://lsa.umich.edu";
  function nextContentSibling(el) {
    let n = el.nextElementSibling;
    while (n && (n.matches(".spacer, .clearfix") || !n.textContent.trim() && !n.querySelector("img, a, iframe"))) {
      n = n.nextElementSibling;
    }
    return n;
  }
  function groupRuns(root, selector, test, className, min, document2) {
    const seen = /* @__PURE__ */ new Set();
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
      const wrap = document2.createElement("div");
      wrap.className = className;
      start.before(wrap);
      run.forEach((el) => wrap.appendChild(el));
    });
  }
  function prepareComponents(main, document2) {
    groupRuns(main, "#page-content .accordion", () => true, "lsa-accordion-group", 1, document2);
    const internalTile = (cmp) => {
      const a = cmp.querySelector(".hoverShine") && cmp.querySelector("a[href]");
      if (!a) return false;
      const href = a.getAttribute("href");
      return href.startsWith("/") || href.startsWith(LSA_ORIGIN);
    };
    groupRuns(main, "#page-content .cmp-image", internalTile, "lsa-tile-group", 2, document2);
    main.querySelectorAll(".events_calendar").forEach((cal) => {
      const frag = document2.createDocumentFragment();
      const title = cal.querySelector("h1");
      if (title) {
        const h1 = document2.createElement("h1");
        h1.textContent = title.textContent.replace(/\s+/g, " ").trim().split(":")[0];
        frag.appendChild(h1);
      }
      const p = document2.createElement("p");
      const a = document2.createElement("a");
      a.setAttribute("href", `${LSA_ORIGIN}/lsa/news-events/events.html`);
      a.textContent = "View the LSA events calendar";
      p.appendChild(a);
      frag.appendChild(p);
      cal.replaceWith(frag);
    });
  }
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
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.filter((blockDef) => !blockDef.name.startsWith("section-")).forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document2.querySelectorAll(selector).forEach((element) => {
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
  var import_section_interior_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      prepareComponents(main, document2);
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
  return __toCommonJS(import_section_interior_exports);
})();
