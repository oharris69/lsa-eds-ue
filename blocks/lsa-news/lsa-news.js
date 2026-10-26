/*
 * LSA Design System featured news (Figma "8 Col Interactions"): one story at a
 * time — photo with the headline, summary and button on a dark panel — and a
 * "01 / 15" counter with previous / next controls.
 *
 * Rows (xwalk items `lsa-news-item`): image | text (heading link, summary, button).
 */
const pad = (n) => String(n).padStart(2, '0');

function arrow(direction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `lsa-news-${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'Previous story' : 'Next story');
  return button;
}

export default function decorate(block) {
  const slides = [...block.children];
  const track = document.createElement('ul');
  track.className = 'lsa-news-track';

  slides.forEach((row, i) => {
    const li = document.createElement('li');
    li.className = 'lsa-news-slide';
    li.id = `${block.id || 'lsa-news'}-${i + 1}`;
    li.setAttribute('aria-roledescription', 'slide');
    li.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    const [media, text] = [...row.children];
    media?.classList.add('lsa-news-media');
    text?.classList.add('lsa-news-content');
    li.append(...row.children);
    if (i > 0) li.hidden = true;
    track.append(li);
    row.remove();
  });

  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', 'carousel');
  block.setAttribute('aria-label', 'Featured news');
  block.append(track);
  if (slides.length < 2) return;

  const controls = document.createElement('div');
  controls.className = 'lsa-news-controls';
  const counter = document.createElement('p');
  counter.className = 'lsa-news-counter';
  counter.setAttribute('aria-live', 'polite');
  const prev = arrow('prev');
  const next = arrow('next');
  controls.append(counter, prev, next);
  block.append(controls);

  let current = 0;
  const show = (index) => {
    const items = [...track.children];
    current = (index + items.length) % items.length;
    items.forEach((li, i) => { li.hidden = i !== current; });
    counter.innerHTML = `<span class="lsa-news-current">${pad(current + 1)}</span><span class="lsa-news-sep" aria-hidden="true"></span><span class="lsa-news-total">${pad(items.length)}</span>`;
    counter.setAttribute('aria-label', `Story ${current + 1} of ${items.length}`);
  };
  prev.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  block.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
  show(0);
}
