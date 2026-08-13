/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-nav.js
  var import_nav_exports = {};
  __export(import_nav_exports, {
    default: () => import_nav_default
  });
  var import_nav_default = {
    transform: (payload) => {
      const { document, params } = payload;
      const src = document.body;
      const main = document.createElement("div");
      const brand = document.createElement("div");
      const brandLogo = src.querySelector(".header-logo img");
      const brandP = document.createElement("p");
      const brandA = document.createElement("a");
      brandA.href = "/";
      if (brandLogo) {
        const img = document.createElement("img");
        img.src = brandLogo.getAttribute("src");
        img.alt = brandLogo.getAttribute("alt") || "U-M College of LSA";
        brandA.appendChild(img);
      } else {
        brandA.textContent = "U-M College of LSA";
      }
      brandP.appendChild(brandA);
      brand.appendChild(brandP);
      const sections = document.createElement("div");
      const navUl = document.createElement("ul");
      src.querySelectorAll(".functional-nav-wrap > ul > li > a").forEach((a) => {
        const liEl = document.createElement("li");
        const aEl = document.createElement("a");
        aEl.href = a.getAttribute("href");
        aEl.textContent = a.textContent.trim();
        liEl.appendChild(aEl);
        navUl.appendChild(liEl);
      });
      src.querySelectorAll(".audience-nav-item > li > a.audItem").forEach((audA) => {
        const liEl = document.createElement("li");
        const topA = document.createElement("a");
        topA.href = audA.getAttribute("href");
        topA.textContent = audA.textContent.trim();
        liEl.appendChild(topA);
        const hoverId = audA.getAttribute("data-hover");
        const submenu = hoverId ? src.querySelector(`#audMenu-${hoverId}`) : null;
        if (submenu) {
          const subUl = document.createElement("ul");
          const featured = submenu.querySelector("a.featuredLink");
          if (featured) {
            const fLi = document.createElement("li");
            const fA = document.createElement("a");
            fA.href = featured.getAttribute("href");
            fA.textContent = featured.textContent.trim();
            fLi.appendChild(fA);
            subUl.appendChild(fLi);
          }
          submenu.querySelectorAll("ul.highlighted > li > a, ul.other > li > a").forEach((sa) => {
            const sLi = document.createElement("li");
            const sA = document.createElement("a");
            sA.href = sa.getAttribute("href");
            sA.textContent = sa.textContent.trim();
            sLi.appendChild(sA);
            subUl.appendChild(sLi);
          });
          if (subUl.children.length) liEl.appendChild(subUl);
        }
        navUl.appendChild(liEl);
      });
      sections.appendChild(navUl);
      const tools = document.createElement("div");
      const toolsUl = document.createElement("ul");
      src.querySelectorAll(".top-bar-wrap .lsa-nav > li > a").forEach((a) => {
        const liEl = document.createElement("li");
        const aEl = document.createElement("a");
        aEl.href = a.getAttribute("href");
        aEl.textContent = a.textContent.trim();
        liEl.appendChild(aEl);
        toolsUl.appendChild(liEl);
      });
      tools.appendChild(toolsUl);
      main.append(
        brand,
        document.createElement("hr"),
        sections,
        document.createElement("hr"),
        tools
      );
      WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);
      return [{
        element: main,
        path: "/en/nav",
        report: { fragment: "nav" }
      }];
    }
  };
  return __toCommonJS(import_nav_exports);
})();
