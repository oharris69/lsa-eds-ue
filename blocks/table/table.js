/*
 * Table block — renders block rows/cells as a semantic <table>.
 * The first row is treated as the header (<thead>); the rest are <tbody>.
 * Authored as an EDS block: block > row(div) > cell(div).
 */
export default function decorate(block) {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(thead);
  table.append(tbody);

  [...block.children].forEach((row, i) => {
    const tr = document.createElement('tr');
    if (i === 0) thead.append(tr);
    else tbody.append(tr);
    [...row.children].forEach((cell) => {
      const el = document.createElement(i === 0 ? 'th' : 'td');
      if (i === 0) el.setAttribute('scope', 'col');
      // Move the cell's content (keeps links/formatting) rather than text only.
      el.innerHTML = cell.innerHTML;
      tr.append(el);
    });
  });

  block.innerHTML = '';
  block.append(table);
}
