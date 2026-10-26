/*
 * LSA Design System support band (Figma "Support Full Width Header" /
 * "Support Vertical": "for what's next / LOOK TO MICHIGAN").
 *
 * Rows (xwalk model `lsa-give-band`): 1 tagline (richtext: a line + a heading),
 * 2 text, 3 buttons (bold link = primary, italic link = secondary).
 * Variants: default (full-width band), `vertical` (card, e.g. beside news).
 */
const PARTS = ['tagline', 'text', 'actions'];

export default function decorate(block) {
  [...block.children].forEach((row, i) => {
    const name = PARTS[i];
    if (!name) return;
    row.classList.add(`lsa-give-band-${name}`);
    if (!row.textContent.trim()) row.remove();
  });
}
