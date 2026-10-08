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

  // tools/importer/import-footer.js
  var import_footer_exports = {};
  __export(import_footer_exports, {
    default: () => import_footer_default
  });

  // tools/importer/doc-path.mjs
  var LANG = "en";

  // tools/importer/import-footer.js
  var import_footer_default = {
    transform: (payload) => {
      const { document, params } = payload;
      const src = document.body;
      const main = document.createElement("div");
      const footerSrc = src.querySelector(".footer-wrap");
      if (footerSrc) {
        const row = [];
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
          row.push([p]);
        }
        const cols = footerSrc.querySelectorAll(".footer-col").length ? footerSrc.querySelectorAll(".footer-col") : Array.from(footerSrc.querySelectorAll("ul")).filter((ul) => ul.querySelector("li.title"));
        cols.forEach((col) => {
          const cell = [];
          const title = col.querySelector("li.title");
          if (title) {
            const h = document.createElement("h3");
            h.textContent = title.textContent.trim();
            cell.push(h);
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
          if (ul.children.length) cell.push(ul);
          if (cell.length) row.push(cell);
        });
        if (row.length) {
          main.appendChild(WebImporter.Blocks.createBlock(document, { name: "columns", cells: [row] }));
        }
        const copy = footerSrc.querySelector(".copyright");
        if (copy) {
          main.appendChild(document.createElement("hr"));
          const p = document.createElement("p");
          p.innerHTML = copy.innerHTML.trim();
          main.appendChild(p);
        }
      }
      WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);
      return [{
        element: main,
        path: `/${LANG}/footer`,
        report: { fragment: "footer" }
      }];
    }
  };
  return __toCommonJS(import_footer_exports);
})();
