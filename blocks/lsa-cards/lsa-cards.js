/*
 * LSA Design System cards — repeating image + text items.
 *
 * Rows (xwalk items `lsa-card`): image | text (heading — linked when the card
 * points somewhere —, details, optional button). A row without an image is a
 * text-only card.
 * Variants (block options / `classes`):
 *   (default) grid of cards, image on top
 *   list      one item per row, thumbnail beside the text (press, presentations)
 *   people    grid of people: portrait, name, email, short bio
 *   profile   a single large portrait beside the full bio (a person's page)
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'lsa-card';
    const cells = [...row.children];
    const media = cells.find((c) => c.querySelector('picture, img'));
    const body = cells.find((c) => c !== media && c.textContent.trim());
    if (media) {
      media.className = 'lsa-card-media';
      li.append(media);
    } else {
      li.classList.add('no-media');
    }
    if (body) {
      body.className = 'lsa-card-body';
      // a card whose heading links somewhere makes the whole card clickable
      const link = body.querySelector(':is(h2, h3, h4) a[href]');
      if (link) li.classList.add('is-linked');
      li.append(body);
    }
    list.append(li);
  });
  block.replaceChildren(list);
}
