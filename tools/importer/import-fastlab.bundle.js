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

  // tools/importer/import-fastlab.js
  var import_fastlab_exports = {};
  __export(import_fastlab_exports, {
    default: () => import_fastlab_default
  });

  // tools/importer/fastlab-paths.mjs
  var FASTLAB_ORIGIN = "https://sites.lsa.umich.edu";
  var FASTLAB_ROOT = "/fastlab";
  var DOC_ROOT = "/en/departments/fastlab";
  var REPLACED = {
    "press-old": "media/press",
    "press-grid": "media/press",
    "press-by-category": "media/press",
    "publications-by-category": "publications",
    "presentations-by-category": "media/presentations",
    "join/undergraduates/thank-you-for-applying": "join/undergraduates",
    // pre-reorganisation paths the Media and Join hub buttons still use
    graduates: "join/graduates",
    undergraduates: "join/undergraduates",
    "undergraduates/past-theses": "join/past-theses",
    press: "media/press",
    presentations: "media/presentations",
    "lab-photos": "media/lab-photos",
    search: ""
  };
  var ARCHIVE = /^(category|group|author|tag|feed|wp-content|wp-json|wp-admin|cdn-cgi)(\/|$)/;
  function docPath(pathname) {
    if (!pathname.startsWith(FASTLAB_ROOT)) return null;
    let rel = pathname.slice(FASTLAB_ROOT.length).replace(/^\/+|\/+$/g, "").replace(/\.html?$/, "");
    if (ARCHIVE.test(rel)) return null;
    if (rel in REPLACED) rel = REPLACED[rel];
    const staff = /^staff-members\/([^/]+)$/.exec(rel);
    if (staff) return `${DOC_ROOT}/members/${staff[1]}`;
    const post = /^\d{4}\/\d{2}\/\d{2}\/([^/]+)$/.exec(rel);
    if (post) return `${DOC_ROOT}/news/${post[1]}`;
    return `${DOC_ROOT}/${rel || "index"}`;
  }
  var webPath = (doc) => doc.replace(/\/index$/, "/");
  function isCopiedImage(src) {
    try {
      const u = new URL(src);
      return u.hostname === "sites.lsa.umich.edu" && u.pathname.includes("/wp-content/uploads/") || u.hostname.endsWith("staticflickr.com");
    } catch (e) {
      return false;
    }
  }
  function fullSizeUrl(src) {
    const u = new URL(src);
    if (u.hostname.endsWith("staticflickr.com")) return src;
    u.pathname = u.pathname.replace(/-(\d+x\d+|scaled)(\.[a-z0-9]+)$/i, "$2");
    return u.href;
  }
  function imageName(src) {
    const u = new URL(fullSizeUrl(src));
    const base = decodeURIComponent(u.pathname.split("/").pop()).replace(/\.[a-z0-9]+$/i, "");
    const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (u.hostname.endsWith("staticflickr.com")) return `flickr-${slug(base)}.jpg`;
    const ym = /\/uploads\/sites\/\d+\/(\d{4})\/(\d{2})\//.exec(u.pathname);
    return `${ym ? `${ym[1]}-${ym[2]}-` : ""}${slug(base)}.jpg`;
  }
  function decodeCfEmail(hex) {
    const key = parseInt(hex.slice(0, 2), 16);
    let out = "";
    for (let i = 2; i < hex.length; i += 2) {
      out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
    }
    try {
      out = decodeURIComponent(escape(out));
    } catch (e) {
    }
    return out.replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);/g, (m, d) => String.fromCharCode(Number(d)));
  }

  // tools/importer/fastlab-profiles.json
  var fastlab_profiles_default = {
    "aaria shah": "aaria-shah",
    "abigail murray b s": "abigail-murray",
    "alexandra berryman": "alexandra-berryman",
    "amanda walker b s": "amanda-yu-b-s",
    "anika vaitkevicius": "anika-vaitkevicius",
    "anushka chillale": "anushka-chillale",
    "ashley gearhardt ph d": "ashley-gearhardt-ph-d",
    "celina furman ph d": "celina-furman-m-a",
    "danica lee": "danica-lee",
    "david koo b a": "david-koo",
    "deborah lee": "deborah-lee",
    "emma leslie ph d": "emma-leslie-ph-d",
    "emma schiestl ph d": "emma-schiestl",
    "erica schulte ph d": "erica-schulte-ph-d",
    "falak suteri b s": "falak-suteri-b-s",
    "hannah xu m a": "hannah-xu",
    "hayley yu m s": "hayley-yu",
    "ian kuentz": "ian-kuentz",
    "ingrid worth b a": "ingrid-worth",
    "isabelle perraut b s": "isabelle-perraut",
    "jacki zhang b a": "jacki-zhang",
    "jackie katz m s": "jackie-katz",
    "jessi lewis b s": "jessi-lewis-b-s",
    "jocelyn tolliver": "jocelyn-tolliver",
    "julia rios ph d": "julia-rios",
    "julia smeal m d": "julia-smeal-b-s",
    "katie good": "katie-good",
    "lily lev b s": "lily-lev",
    "lindsey parnarouskis ph d": "lindsey-parnarouskis",
    "lindzey hoover ph d": "lindzey-hoover",
    "lucy loch m s": "lucy-loch",
    "maya sneller": "maya-sneller",
    "meredith turner b a": "meredith-turner-b-a",
    "michelle joyner ph d": "michelle-joyner-ph-d",
    "nikolai tassin b s": "nikolai-tassin-b-s",
    "noor khalaf m a": "noor-khalaf-b-a",
    "paul william martines mph": "paul-martines-m-p-h",
    "reva patchava": "reva-patchava",
    "sharon santosh": "sharon-santosh",
    "sydney jones": "sydney-jones",
    "vinicius m valicente phd": "vinicius-m-valicente-phd",
    "ximena d az torrente ph d msc": "ximena-diaz-torrente-ph-d-msc",
    "yulianna kowalczyk": "yulianna-kowalczyk",
    "zoey sailer": "zoey-sailer"
  };

  // tools/importer/fastlab-missing-images.json
  var fastlab_missing_images_default = [
    "2016-02-292373logo-e1455382629337.jpg",
    "2021-07-2021-07-16-2.jpg",
    "2023-01-keep-the-weight-off-fazigtiypk4-w7kymrqdedi-1400x1400.jpg"
  ];

  // tools/importer/fastlab-flickr.json
  var fastlab_flickr_default = {
    "/fastlab/media/lab-photos/": [
      {
        href: "https://www.flickr.com/photos/121911127@N06/albums/72157645391805727",
        src: "https://live.staticflickr.com/2935/14680330086_c4c17c2531_b.jpg",
        alt: "Restaurant Space"
      }
    ],
    "/fastlab/members/": [
      {
        href: "https://www.flickr.com/photos/204988582@N05/galleries/72157725803434813/",
        src: "https://live.staticflickr.com/65535/55099362613_b6aaa93fe6_b.jpg",
        alt: "Mood Boost Bach Collage"
      }
    ]
  };

  // tools/importer/import-fastlab.js
  var HOME = webPath(`${DOC_ROOT}/index`);
  var SECTIONS = {
    media: { title: "Media", pages: [["Press", "media/press"], ["Presentations", "media/presentations"], ["Lab Photos", "media/lab-photos"]] },
    join: { title: "Join", pages: [["Graduates", "join/graduates"], ["Undergraduates", "join/undergraduates"], ["Past Theses & Dissertations", "join/past-theses"]] },
    contact: { title: "Contact Us", pages: [["Participate", "participate"]] }
  };
  var PARENT = {
    "media/press": "media",
    "media/presentations": "media",
    "media/lab-photos": "media",
    "join/graduates": "join",
    "join/undergraduates": "join",
    "join/past-theses": "join",
    "join/past-theses/masters-theses": "join",
    participate: "contact"
  };
  var norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  var cleanTitle = (t) => t.split(/\s[–-]\s/)[0].trim();
  function el(document, tag, html) {
    const e = document.createElement(tag);
    if (html !== void 0) e.innerHTML = html;
    return e;
  }
  function cell(document, nodes, field) {
    const div = document.createElement("div");
    if (field) div.append(document.createComment(` field:${field} `));
    [].concat(nodes).filter(Boolean).forEach((n) => div.append(typeof n === "string" ? el(document, "p", n) : n));
    return div;
  }
  function block(document, name, rows) {
    return WebImporter.Blocks.createBlock(document, { name, cells: rows });
  }
  function fastlabPath(href, base) {
    try {
      const u = new URL(href, base);
      if (u.hostname === "sites.lsa.umich.edu" || u.hostname === "localhost") {
        return u.pathname.startsWith("/fastlab") ? u.pathname : null;
      }
    } catch (e) {
    }
    return null;
  }
  function fixLinksAndMedia(root, document, base) {
    root.querySelectorAll("a[href] > img[data-permalink]").forEach((img) => {
      const a = img.parentElement;
      if (a.getAttribute("href") === img.getAttribute("data-permalink")) a.replaceWith(...a.childNodes);
    });
    root.querySelectorAll("[data-cfemail]").forEach((span) => {
      const email = decodeCfEmail(span.getAttribute("data-cfemail"));
      span.replaceWith(document.createTextNode(email));
    });
    root.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      const cf = /\/cdn-cgi\/l\/email-protection#([0-9a-f]+)/i.exec(href);
      if (cf) {
        const email = decodeCfEmail(cf[1]);
        a.setAttribute("href", `mailto:${email}`);
        if (/\[email/.test(a.textContent) || !a.textContent.trim()) a.textContent = email;
        return;
      }
      const p = fastlabPath(href, base);
      if (!p) return;
      const doc = docPath(p);
      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      a.setAttribute("href", doc ? webPath(doc) + hash : `${FASTLAB_ORIGIN}${p}`);
    });
    root.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
      ["srcset", "sizes", "data-src", "data-srcset", "loading", "decoding", "width", "height", "class", "style"].forEach((x) => img.removeAttribute(x));
      if (isCopiedImage(src)) {
        if (fastlab_missing_images_default.includes(imageName(src))) {
          const a = img.closest("a");
          if (a && !a.textContent.trim() && a.querySelectorAll("img").length === 1) a.remove();
          else img.remove();
          return;
        }
        img.setAttribute("src", `/media-da/fastlab/${imageName(src)}`);
      }
      const alt = (img.getAttribute("alt") || "").replace(/\s*:\s*$/, "").trim();
      img.setAttribute("alt", alt);
    });
  }
  function cleanContent(root) {
    root.querySelectorAll("script, style, noscript, .wp-block-spacer, .screen-reader-text, svg").forEach((n) => n.remove());
    root.querySelectorAll("hr").forEach((n) => n.remove());
    root.querySelectorAll("iframe.wp-embedded-content").forEach((n) => n.remove());
    root.querySelectorAll("blockquote").forEach((q) => q.replaceWith(...q.childNodes));
    root.querySelectorAll("p").forEach((p) => {
      if (!p.textContent.replace(/ /g, " ").trim() && !p.querySelector("img, a, iframe")) p.remove();
    });
  }
  function linkify(p, document) {
    p.innerHTML = p.innerHTML.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (m, pre, url) => {
      const clean = url.replace(/[.,;]$/, "");
      return `${pre}<a href="${clean}">${clean}</a>${url.slice(clean.length)}`;
    });
  }
  function pageTitle(document, rel, title) {
    const crumbs = el(document, "ul");
    const li = (text, href) => {
      const item = el(document, "li");
      item.append(href ? Object.assign(el(document, "a"), { href, textContent: text }) : text);
      crumbs.append(item);
    };
    li("FAST Lab", HOME);
    const parentKey = PARENT[rel];
    if (parentKey) li(SECTIONS[parentKey].title, webPath(`${DOC_ROOT}/${parentKey === "contact" ? "contact" : parentKey}`));
    if (rel.startsWith("members/")) li("Members", webPath(`${DOC_ROOT}/members`));
    li(title, webPath(`${DOC_ROOT}/${rel}`));
    const rows = [[cell(document, crumbs, "breadcrumb")], [cell(document, el(document, "h1", title), "title")]];
    const sectionKey = SECTIONS[rel] ? rel : parentKey;
    if (sectionKey) {
      const list = el(document, "ul");
      SECTIONS[sectionKey].pages.forEach(([text, path]) => {
        const item = el(document, "li");
        item.append(Object.assign(el(document, "a"), { href: webPath(`${DOC_ROOT}/${path}`), textContent: text }));
        list.append(item);
      });
      rows.push([cell(document, list, "links")]);
    }
    return block(document, "Lsa Page Title", rows);
  }
  var isMediaItem = (c) => c.matches(".wp-block-columns") && c.querySelector("img") && c.querySelector("h2 a, h3 a, h4 a");
  function cardRow(document, img, bodyNodes) {
    const media = img ? (() => {
      const p = el(document, "p");
      p.append(img);
      return p;
    })() : null;
    return [cell(document, media, "image"), cell(document, bodyNodes, "text")];
  }
  function mediaItemRow(document, cols) {
    const img = cols.querySelector("img");
    const body = [...cols.querySelectorAll("h2, h3, h4, p")].filter((n) => n.textContent.trim() && !n.querySelector("img"));
    body.forEach((h) => {
      if (/^H[24]$/.test(h.tagName)) {
        const h3 = el(document, "h3", h.innerHTML);
        h.replaceWith(h3);
      }
    });
    return cardRow(document, img, [...cols.querySelectorAll("h3, p")].filter((n) => n.textContent.trim() && !n.querySelector("img")));
  }
  function peopleCards(document, listing) {
    const rows = [...listing.querySelectorAll(".staff-member")].map((m) => {
      var _a, _b;
      const img = m.querySelector(".staff-member-photo");
      const name = ((_a = m.querySelector(".staff-member-name")) == null ? void 0 : _a.textContent.trim()) || "";
      const slug = fastlab_profiles_default[norm(name)];
      const h3 = el(document, "h3");
      if (slug) h3.append(Object.assign(el(document, "a"), { href: webPath(`${DOC_ROOT}/members/${slug}`), textContent: name }));
      else h3.textContent = name;
      const body = [h3];
      const pos = m.querySelector(".staff-member-position");
      if (pos) body.push(el(document, "p", `<strong>${pos.textContent.trim()}</strong>`));
      const email = m.querySelector(".staff-member-email");
      if (email) {
        const p = el(document, "p");
        p.append(email);
        body.push(p);
      }
      const bio = m.querySelector(".staff-member-bio");
      if (bio) {
        const text = ((_b = bio.querySelector("p")) == null ? void 0 : _b.textContent.replace(/\s+/g, " ").trim()) || "";
        if (slug && text.length > 220) body.push(el(document, "p", `${text.slice(0, 200).replace(/\s+\S*$/, "")}\u2026`));
        else [...bio.children].forEach((c) => body.push(c));
      }
      return cardRow(document, img, body);
    });
    return block(document, "Lsa Cards (people)", rows);
  }
  function convertContent(document, ec, base) {
    var _a, _b, _c;
    const out = [];
    const kids = [...ec.children];
    for (let i = 0; i < kids.length; i += 1) {
      const c = kids[i];
      if (isMediaItem(c)) {
        const rows = [];
        while (i < kids.length && isMediaItem(kids[i])) {
          rows.push(mediaItemRow(document, kids[i]));
          i += 1;
        }
        i -= 1;
        out.push(block(document, "Lsa Cards (list)", rows));
      } else if (c.matches(".staff-member-listing")) {
        out.push(peopleCards(document, c));
      } else if (c.matches(".wp-block-latest-posts")) {
        const rows = [...c.querySelectorAll("li")].map((li) => {
          var _a2;
          const a = li.querySelector(".wp-block-latest-posts__post-title");
          const h3 = el(document, "h3");
          h3.append(a);
          const ex = li.querySelector(".wp-block-latest-posts__post-excerpt");
          (_a2 = ex == null ? void 0 : ex.querySelector(".wp-block-latest-posts__read-more")) == null ? void 0 : _a2.remove();
          return cardRow(document, null, [h3, ex ? el(document, "p", ex.textContent.trim()) : null]);
        });
        out.push(block(document, "Lsa Cards", rows));
      } else if (c.matches(".wp-block-columns")) {
        const filled = (col) => col.textContent.trim() || col.querySelector("img");
        let layout = c;
        for (; ; ) {
          const only = [...layout.querySelectorAll(":scope > .wp-block-column")].filter(filled);
          const inner = only.length === 1 && only[0].querySelector(":scope > .wp-block-columns");
          if (!inner) break;
          layout = inner;
        }
        const cols = [...layout.querySelectorAll(":scope > .wp-block-column")].filter(filled);
        const imgCol = cols.find((col) => col.querySelector("img") && !col.textContent.trim());
        const textCols = cols.filter((col) => col !== imgCol);
        if (imgCol && textCols.length === 1) {
          const img = imgCol.querySelector("img");
          const pic = el(document, "p");
          pic.append(img);
          textCols[0].querySelectorAll("p").forEach((p) => linkify(p, document));
          out.push(block(document, "Columns (media)", [[cell(document, [...textCols[0].children]), cell(document, pic)]]));
        } else {
          cols.forEach((col) => out.push(...col.children));
        }
      } else if (c.matches(".wp-block-embed-youtube")) {
        const src = ((_a = c.querySelector("iframe")) == null ? void 0 : _a.getAttribute("src")) || "";
        const id = (_b = /embed\/([^?&/]+)/.exec(src)) == null ? void 0 : _b[1];
        if (id) {
          const url = `https://www.youtube.com/watch?v=${id}`;
          out.push(block(document, "Video", [[cell(document, `<a href="${url}">${url}</a>`, "videoUrl")]]));
        }
      } else if (c.matches(".wp-block-embed-flickr, .wp-block-image")) {
        let a = c.querySelector("a[href]");
        let img = c.querySelector("img");
        if (!img && c.matches(".wp-block-embed-flickr")) {
          const i2 = [...document.querySelectorAll(".wp-block-embed-flickr")].indexOf(c);
          const embed = (_c = fastlab_flickr_default[new URL(base).pathname]) == null ? void 0 : _c[Math.max(i2, 0)];
          if (embed) {
            a = el(document, "a");
            a.setAttribute("href", embed.href);
            img = el(document, "img");
            img.setAttribute("src", `/media-da/fastlab/${imageName(embed.src)}`);
            img.setAttribute("alt", embed.alt);
          }
        }
        if (img) {
          const p = el(document, "p");
          if (a && a.getAttribute("href") !== img.getAttribute("src")) {
            a.replaceChildren(img);
            p.append(a);
          } else p.append(img);
          out.push(p);
          const cap = c.querySelector("figcaption");
          if (cap == null ? void 0 : cap.textContent.trim()) out.push(el(document, "p", `<em>${cap.textContent.trim()}</em>`));
        }
      } else if (c.matches(".wp-block-buttons")) {
        c.querySelectorAll("a").forEach((a) => {
          const p = el(document, "p");
          const s = el(document, "strong");
          a.removeAttribute("class");
          s.append(a);
          p.append(s);
          out.push(p);
        });
      } else if (c.matches(".wp-block-file")) {
        const a = c.querySelector("a[href]:not(.wp-block-file__button)") || c.querySelector("a[href]");
        if (a) {
          const p = el(document, "p");
          p.append(a);
          out.push(p);
        }
      } else if (c.matches("div") && !c.matches('[class*="wp-block"]')) {
        out.push(...c.children);
      } else {
        out.push(c);
      }
    }
    out.forEach((n) => {
      if (n.tagName === "H4" && !out.some((m) => m.tagName === "H2" || m.tagName === "H3")) {
        const h = el(document, "h2", n.innerHTML);
        n.replaceWith(h);
      }
    });
    return out;
  }
  function metadata(document, title, description) {
    const meta = {
      Title: `${title} | FAST Lab | U-M LSA`,
      Description: description,
      theme: "lsa-ds",
      nav: `${DOC_ROOT}/nav`,
      footer: `${DOC_ROOT}/footer`
    };
    return WebImporter.Blocks.createBlock(document, { name: "Metadata", cells: meta });
  }
  function section(document, nodes, style) {
    const s = document.createElement("div");
    nodes.filter(Boolean).forEach((n) => s.append(n));
    if (style) s.append(WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style } }));
    return s;
  }
  function decodeEmails(document) {
    document.querySelectorAll("[data-cfemail]").forEach((span) => {
      span.replaceWith(document.createTextNode(decodeCfEmail(span.getAttribute("data-cfemail"))));
    });
    document.querySelectorAll('a[href*="/cdn-cgi/l/email-protection#"]').forEach((a) => {
      const hex = /email-protection#([0-9a-f]+)/i.exec(a.getAttribute("href"))[1];
      const email = decodeCfEmail(hex);
      a.setAttribute("href", `mailto:${email}`);
      if (/\[email/.test(a.textContent) || !a.textContent.trim()) a.textContent = email;
    });
  }
  var import_fastlab_default = {
    preprocess: ({ document }) => decodeEmails(document),
    transform: ({ document, params }) => {
      var _a, _b, _c, _d;
      decodeEmails(document);
      const base = params.originalURL;
      const srcPath = new URL(base).pathname;
      const doc = docPath(srcPath);
      const rel = doc.slice(DOC_ROOT.length + 1);
      const body = document.body;
      const article = document.querySelector("#main article") || document.querySelector("#main");
      const ec = article.querySelector(".entry-content") || article;
      fixLinksAndMedia(article, document, base);
      cleanContent(ec);
      const pageTitleText = cleanTitle(((_a = article.querySelector("h1")) == null ? void 0 : _a.textContent) || document.title);
      const firstText = [...ec.querySelectorAll("p")].map((p) => p.textContent.replace(/\s+/g, " ").trim()).find((t) => t.length > 60) || "";
      const description = firstText.length > 160 ? `${firstText.slice(0, 157).replace(/\s+\S*$/, "")}\u2026` : firstText;
      const main = document.createElement("main");
      let template = "page";
      if (body.classList.contains("home")) {
        template = "home";
        const kids = [...ec.children];
        const about = kids.find((k) => {
          var _a2;
          return k.matches(".wp-block-columns") && /about/i.test(((_a2 = k.querySelector("h2")) == null ? void 0 : _a2.textContent) || "");
        });
        const img = about == null ? void 0 : about.querySelector("img");
        const aboutText = about ? [...about.querySelectorAll("p")] : [];
        const heroText = [el(document, "h1", "Food and Addiction Science &amp; Treatment Lab"), ...aboutText];
        const heroImg = img ? (() => {
          const p = el(document, "p");
          p.append(img);
          return p;
        })() : null;
        main.append(section(document, [block(document, "Lsa Hero (split)", [[cell(document, heroImg, "image")], [cell(document, heroText, "text")]])]));
        about == null ? void 0 : about.remove();
        ec.querySelectorAll(":scope > h4").forEach((h) => h.replaceWith(el(document, "h2", h.innerHTML)));
        const rest = convertContent(document, ec, base);
        main.append(section(document, rest));
        main.append(section(document, [metadata(document, "Food and Addiction Science & Treatment Lab", description || "The Food and Addiction Science and Treatment (FAST) Lab at the University of Michigan.")]));
      } else if (body.classList.contains("single-staff-member") || article.querySelector(".staff-header")) {
        template = "staff-member";
        const header = article.querySelector(".staff-header");
        const img = header == null ? void 0 : header.querySelector("img");
        const name = cleanTitle(((_b = header == null ? void 0 : header.querySelector("h1")) == null ? void 0 : _b.textContent) || pageTitleText);
        const bodyNodes = [];
        const meta = header == null ? void 0 : header.querySelector(".staff-meta");
        const title = (_c = meta == null ? void 0 : meta.querySelector(".title")) == null ? void 0 : _c.textContent.trim();
        if (title) bodyNodes.push(el(document, "p", `<strong>${title}</strong>`));
        const email = header == null ? void 0 : header.querySelector('a[href^="mailto:"]');
        if (email) {
          const addr = email.getAttribute("href").slice(7);
          bodyNodes.push(el(document, "p", `<a href="mailto:${addr}">${addr}</a>`));
        }
        const content = article.querySelector(".staff-content") || ec;
        cleanContent(content);
        bodyNodes.push(...content.children);
        main.append(section(document, [pageTitle(document, rel, name)]));
        main.append(section(document, [block(document, "Lsa Cards (profile)", [cardRow(document, img, bodyNodes)])]));
        main.append(section(document, [el(document, "p", `<em><a href="${webPath(`${DOC_ROOT}/members`)}">All lab members</a></em>`), metadata(document, name, description || `${name}, FAST Lab, University of Michigan.`)]));
      } else if (body.classList.contains("single-post")) {
        template = "post";
        const date = (_d = article.querySelector('[itemprop="datePublished"], .published')) == null ? void 0 : _d.textContent.trim();
        const nodes = convertContent(document, ec, base);
        main.append(section(document, [pageTitle(document, rel, pageTitleText)]));
        main.append(section(document, [date ? el(document, "p", `<strong>${date}</strong>`) : null, ...nodes], "narrow"));
        main.append(section(document, [el(document, "p", `<em><a href="${HOME}">Back to FAST Lab</a></em>`), metadata(document, pageTitleText, description)]));
      } else {
        const nodes = convertContent(document, ec, base);
        main.append(section(document, [pageTitle(document, rel, pageTitleText)]));
        main.append(section(document, nodes));
        main.append(section(document, [metadata(document, pageTitleText, description)]));
      }
      const out = document.createElement("div");
      [...main.children].forEach((s, i) => {
        if (i > 0) out.append(document.createElement("hr"));
        out.append(...s.childNodes);
      });
      return [{
        element: out,
        path: doc,
        report: { title: pageTitleText, template }
      }];
    }
  };
  return __toCommonJS(import_fastlab_exports);
})();
