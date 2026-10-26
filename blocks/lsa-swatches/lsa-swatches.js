/*
 * LSA Design System colour swatches (style guide). Rows (xwalk items
 * `lsa-swatch`): name | hex value (e.g. "LSA Cyan (Web)" | "#007cba").
 */
const HEX = /#(?:[0-9a-f]{3}){1,2}\b/i;

function isDark(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
}

export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const [nameCell, valueCell] = [...row.children];
    const value = (valueCell?.textContent.match(HEX) || [])[0];
    if (!value) return;
    const li = document.createElement('li');
    const chip = document.createElement('span');
    chip.className = 'lsa-swatch-chip';
    chip.style.backgroundColor = value;
    if (isDark(value)) li.classList.add('is-dark');
    const name = document.createElement('strong');
    name.textContent = nameCell?.textContent.trim() || value;
    const code = document.createElement('code');
    code.textContent = value.toUpperCase();
    li.append(chip, name, code);
    list.append(li);
  });
  block.replaceChildren(list);
}
