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

  // tools/importer/import-figma.js
  var import_figma_exports = {};
  __export(import_figma_exports, {
    default: () => import_figma_default
  });

  // tools/importer/doc-path.mjs
  var LANG = "en";

  // tools/importer/import-figma.js
  var import_figma_default = {
    transform: (payload) => {
      const { document, params } = payload;
      const main = document.querySelector("main") || document.body;
      main.querySelectorAll("[data-field]").forEach((cell) => {
        cell.prepend(document.createComment(` field:${cell.dataset.field} `));
        cell.removeAttribute("data-field");
      });
      main.querySelectorAll("img[src]").forEach((img) => {
        const src = new URL(img.getAttribute("src"), params.originalURL);
        if (src.pathname.startsWith("/media-da/")) img.setAttribute("src", src.pathname);
      });
      const sections = [...main.querySelectorAll(":scope > section")];
      sections.forEach((section, i) => {
        const { style } = section.dataset;
        if (style) {
          section.append(WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style }
          }));
        }
        if (i > 0) section.before(document.createElement("hr"));
        section.replaceWith(...section.childNodes);
      });
      const name = new URL(params.originalURL).pathname.split("/").pop().replace(/\.html?$/, "");
      return [{
        element: main,
        path: `/${LANG}/${WebImporter.FileUtils.sanitizePath(name)}`,
        report: { title: document.title, template: "figma", sections: sections.length }
      }];
    }
  };
  return __toCommonJS(import_figma_exports);
})();
