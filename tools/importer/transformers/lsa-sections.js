/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: lsa.umich.edu section boundaries + section metadata.
 *
 * Establishes section breaks (EDS `---`) between the 6 top-level gridwrapper
 * sections inside #content, and applies section-metadata style values.
 *
 * Section order and IDs verified against migration-work/cleaned.html (each
 * <section id="gridparlsa_gridwrapper_..._gridclass"> is the block anchor of one
 * top-level .lsa_gridwrapper child of #content):
 *   1. gridparlsa_gridwrapper_1456_379967915_gridclass  (Hero — Why LSA?)
 *   2. gridparlsa_gridwrapper_1456_162245604_gridclass  (Featured News / Support / Get Connected)
 *   3. gridparlsa_gridwrapper_1742_gridclass            (Look to Michigan CTA)
 *   4. gridparlsa_gridwrapper_5488_gridclass            (Student Experience)  -> style "dark"
 *   5. gridparlsa_gridwrapper_1286_gridclass            (LSA Magazine — Small but Mighty)
 *   6. gridparlsa_gridwrapper_4264_1137812086_gridclass (More from LSA Magazine) -> style "light-blue-bg"
 *
 * Section-metadata styles come from tools/importer/page-templates.json:
 *   - section-student-experience   -> "dark"          on #gridparlsa_gridwrapper_5488_gridclass
 *   - section-more-from-lsa-magazine -> "light-blue-bg" on #gridparlsa_gridwrapper_4264_1137812086_gridclass
 * They are read live from payload.template blocks (blocks[].section + instances)
 * so the transformer stays in sync with the template, with the verified map below
 * as a fallback.
 *
 * Runs in afterTransform ONLY: block parsers run between the hooks and rely on the
 * original DOM; section breaks/metadata are inserted after parsing is complete.
 *
 * IMPORTANT: does not touch <img> tags or their src attributes.
 */

const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Fallback style map (homepage section-* entries from page-templates.json).
// Only used when the payload template does not declare the style for an id.
const FALLBACK_STYLE_BY_ID = {
  gridparlsa_gridwrapper_5488_gridclass: 'dark',
  gridparlsa_gridwrapper_4264_1137812086_gridclass: 'light-blue-bg',
};

// Build the id -> style map, preferring values declared on template blocks that
// carry a `section` property (blocks[].section + blocks[].instances selectors).
function buildStyleMap(payload) {
  const map = { ...FALLBACK_STYLE_BY_ID };
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

// Derive the ordered list of top-level section IDs from the DOM (document order),
// so this transformer is template-agnostic. Each LSA content section is a
// <section id="gridparlsa_gridwrapper_..._gridclass"> nested inside a top-level
// .lsa_gridwrapper child of the content container.
function deriveSectionOrder(element) {
  const ids = [];
  element.querySelectorAll('section[id^="gridparlsa_gridwrapper"]').forEach((el) => {
    if (el.id) ids.push(el.id);
  });
  return ids;
}

const STAMP_ID = 'data-lsa-section-id';
const STAMP_STYLE = 'data-lsa-section-style';

export default function transform(hookName, element, payload) {
  // PHASE 1 (beforeTransform): stamp each section's surviving top-level
  // .lsa_gridwrapper with its id + style BEFORE block parsers run. Parsers whose
  // instance selector IS the <section id> call element.replaceWith(block), which
  // destroys the id — but the enclosing .lsa_gridwrapper wrapper survives. Stamping
  // the wrapper now lets afterTransform place breaks/metadata reliably for ALL
  // templates (homepage, audience-landing, …) without a hardcoded section list.
  if (hookName === TransformHook.beforeTransform) {
    const styleById = buildStyleMap(payload);
    deriveSectionOrder(element).forEach((id) => {
      const sectionEl = element.querySelector('[id="' + id + '"]');
      if (!sectionEl) return;
      const wrapper = sectionEl.closest('.lsa_gridwrapper') || sectionEl;
      wrapper.setAttribute(STAMP_ID, id);
      if (styleById[id]) wrapper.setAttribute(STAMP_STYLE, styleById[id]);
    });
    return;
  }

  // PHASE 2 (afterTransform): read the stamped wrappers (document order) and insert
  // section breaks + section-metadata. Runs after cleanup's afterTransform; stamped
  // wrappers hold parsed block content so cleanup's empty-wrapper prune leaves them.
  if (hookName === TransformHook.afterTransform) {
    const doc = (payload && payload.document) || document;
    const items = Array.from(element.querySelectorAll('[' + STAMP_ID + ']'));

    // Process in reverse so earlier insertions do not shift later reference nodes.
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const topEl = items[i];
      const style = topEl.getAttribute(STAMP_STYLE);

      // Section Metadata block at the end of the section it describes (styled only).
      if (style) {
        const block = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style },
        });
        topEl.after(block);
      }

      // Section break (<hr> -> `---`) before every section except the first.
      if (i > 0) {
        topEl.before(doc.createElement('hr'));
      }

      // Clean up the temporary stamps so they don't leak into output.
      topEl.removeAttribute(STAMP_ID);
      topEl.removeAttribute(STAMP_STYLE);
    }
  }
}
