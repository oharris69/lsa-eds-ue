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

  // tools/importer/import-nav-footer.js
  var import_nav_footer_exports = {};
  __export(import_nav_footer_exports, {
    default: () => import_nav_footer_default
  });
  function buildNav(document, src) {
    const frag = document.createElement("div");
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
    frag.append(brand, document.createElement("hr"), sections, document.createElement("hr"), tools);
    return frag;
  }
  function buildFooter(document, src) {
    const frag = document.createElement("div");
    const footerSrc = src.querySelector(".footer-wrap");
    if (!footerSrc) return frag;
    const logoImg = footerSrc.querySelector(".footer-logo img");
    if (logoImg) {
      const p = document.createElement("p");
      const a = document.createElement("a");
      a.href = "https://lsa.umich.edu";
      const img = document.createElement("img");
      img.src = logoImg.getAttribute("src");
      img.alt = logoImg.getAttribute("alt") || "LSA";
      a.appendChild(img);
      p.appendChild(a);
      frag.appendChild(p);
    }
    footerSrc.querySelectorAll(".footer-col").forEach((col) => {
      const title = col.querySelector("li.title");
      if (title) {
        const h = document.createElement("h3");
        h.textContent = title.textContent.trim();
        frag.appendChild(h);
      }
      const ul = document.createElement("ul");
      col.querySelectorAll("li:not(.title)").forEach((li) => {
        const a = li.querySelector("a");
        if (!a) return;
        const liEl = document.createElement("li");
        const aEl = document.createElement("a");
        aEl.href = a.getAttribute("href");
        aEl.textContent = a.textContent.trim();
        liEl.appendChild(aEl);
        ul.appendChild(liEl);
      });
      if (ul.children.length) frag.appendChild(ul);
    });
    const copy = footerSrc.querySelector(".copyright");
    if (copy) {
      const p = document.createElement("p");
      p.innerHTML = copy.innerHTML.trim();
      frag.appendChild(p);
    }
    return frag;
  }
  var import_nav_footer_default = {
    transform: (payload) => {
      const { document } = payload;
      const src = document.body;
      const navEl = buildNav(document, src);
      const footerEl = buildFooter(document, src);
      return [
        {
          element: navEl,
          path: "/en/nav",
          report: { fragment: "nav" }
        },
        {
          element: footerEl,
          path: "/en/footer",
          report: { fragment: "footer" }
        }
      ];
    }
  };
  return __toCommonJS(import_nav_footer_exports);
})();
