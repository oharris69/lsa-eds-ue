/*
 * LSA Design System hero (Figma "Dep-Hero" / "Audience-Hero").
 *
 * Rows (xwalk model `lsa-hero`): 1 image (+ alt), 2 text (richtext).
 * Variants (block options / `classes`):
 *   split   (default) photo band, then the title beside the intro + buttons
 *   overlay full-bleed photo (or background video: a link to an .mp4 in the text)
 *           with the copy bottom-left on a dark gradient, and a play/pause control
 *   band    accent band with a display headline + intro and the buttons on the
 *           right, the photo below
 *   photo   photo only (page-top image band)
 */
const VARIANTS = ['split', 'overlay', 'band', 'photo'];
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|$)/i;

function buildVideo(block, link) {
  const video = document.createElement('video');
  video.className = 'lsa-hero-video';
  video.src = link.href;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute('aria-hidden', 'true');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  video.autoplay = !reduced;

  const container = link.closest('p');
  link.remove();
  if (container && !container.textContent.trim() && !container.children.length) container.remove();

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'lsa-hero-toggle';
  const setState = (playing) => {
    toggle.setAttribute('aria-label', playing ? 'Pause background video' : 'Play background video');
    toggle.classList.toggle('is-paused', !playing);
  };
  setState(!reduced);
  toggle.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      setState(true);
    } else {
      video.pause();
      setState(false);
    }
  });

  block.querySelector('.lsa-hero-media').append(video);
  block.querySelector('.lsa-hero-content').append(toggle);
}

export default function decorate(block) {
  if (!VARIANTS.some((v) => block.classList.contains(v))) block.classList.add('split');

  const [imageRow, textRow] = [...block.children];
  imageRow?.classList.add('lsa-hero-media');
  if (!textRow) {
    block.classList.add('photo');
    return;
  }
  textRow.classList.add('lsa-hero-content');
  const cell = textRow.firstElementChild || textRow;
  cell.classList.add('lsa-hero-text');

  const videoLink = [...block.querySelectorAll('a[href]')].find((a) => VIDEO.test(a.href));

  if (block.classList.contains('split') || block.classList.contains('band')) {
    // split: heading on the left, everything else on the right.
    // band: copy on the left, buttons on the right.
    const start = document.createElement('div');
    const end = document.createElement('div');
    start.className = 'lsa-hero-start';
    end.className = 'lsa-hero-end';
    if (block.classList.contains('split')) {
      const heading = cell.querySelector('h1, h2, h3');
      if (heading) start.append(heading);
      end.append(...cell.childNodes);
    } else {
      const buttons = [...cell.querySelectorAll(':scope > .button-container')];
      start.append(...cell.childNodes);
      end.append(...buttons);
    }
    cell.replaceChildren(start, end);
  }

  if (!cell.textContent.trim()) {
    textRow.remove();
    block.classList.add('photo');
  }

  if (videoLink && block.classList.contains('overlay')) buildVideo(block, videoLink);
}
