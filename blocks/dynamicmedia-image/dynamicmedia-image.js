import { getDynamicMediaServerURL } from '../../scripts/utils.js';
import { loadScript } from '../../scripts/aem.js';

/**
 * @param {HTMLElement} $block
 */
export default async function decorate(block) {
  console.log(block);
  const deliveryType = Array.from(block.children)[0]?.textContent?.trim();
  const inputs = block.querySelectorAll('.dynamicmedia-image > div');

  const inputsArray = Array.from(inputs);
  if (inputsArray.length < 2) {
    console.log('Missing inputs, expecting 2, ensure both the image and DM URL are set in the dialog');
    return;
  }
  const imageEl = inputs[1]?.getElementsByTagName('img')[0];
  const altText = inputs[5]?.textContent?.trim();

  if (deliveryType !== 'na') {
    if (deliveryType === 'dm') {
      // Get DM Url input
      const dmUrlEl = await getDynamicMediaServerURL();

      // Load the Scene7 responsive-image library on demand (only pages that
      // use this block pay for it; it used to be in head.html for every page).
      if (typeof window.s7responsiveImage !== 'function') {
        await loadScript('https://s7d1.scene7.com/s7viewers/libs/responsive_image.js');
      }
      if (typeof window.s7responsiveImage !== 'function') {
        console.error('s7responsiveImage function is not defined, ensure script include is added to head tag');
        return;
      }

      // Get image

      if (!imageEl) {
        console.error('Image element not found, ensure it is defined in the dialog');
        return;
      }

      const imageSrc = imageEl.getAttribute('src');
      if (!imageSrc) {
        console.error('Image element source not found, ensure it is defined in the dialog');
        return;
      }

      // Get imageName from imageSrc, expected in the format
      // /content/dam/<...>/<imageName>.<extension>
      const imageName = imageSrc.split('/').pop().split('.')[0];
      const dmUrl = dmUrlEl || 'https://smartimaging.scene7.com/is/image/DynamicMediaNA/';

      imageEl.setAttribute('data-src', dmUrl + (dmUrl.endsWith('/') ? '' : '/') + imageName);
      // imageEl.setAttribute("src", dmUrl + (dmUrl.endsWith('/') ? "" : "/") + imageName);
      imageEl.setAttribute('src', dmUrl + (dmUrl.endsWith('/') ? '' : '/') + imageName);
      imageEl.setAttribute('alt', altText || 'dynamic media image');
      imageEl.setAttribute('data-mode', 'smartcrop');
      block.innerHTML = '';
      block.appendChild(imageEl);
      window.s7responsiveImage(imageEl);

      // dmUrlEl.remove();
    }
    if (deliveryType === 'dm-openapi') {
      block.children[6]?.remove();
      block.children[5]?.remove();
      block.children[4]?.remove();
      block.children[3]?.remove();
      block.children[2]?.remove();
      block.children[0]?.remove();

      // Build OpenAPI delivery URL from authored values and render <img>
      // Prefer authored link; fallback to picture/source/img produced earlier
      const assetLink = inputs[1]?.querySelector('a[href]');
      let baseUrl = assetLink?.href?.split('?')[0];
      if (!baseUrl) {
        const sourceEl = inputs[1]?.querySelector('picture source[srcset]');
        const srcset = sourceEl?.getAttribute('srcset') || '';
        if (srcset) {
          const firstSrc = srcset.split(',')[0].trim();
          [baseUrl] = firstSrc.split('?');
        }
      }
      if (!baseUrl) {
        const imgEl2 = inputs[1]?.querySelector('picture img[src], img[src]');
        const imgSrc = imgEl2?.getAttribute('src') || '';
        if (imgSrc) {
          [baseUrl] = imgSrc.split('?');
        }
      }
      const rotationVal = inputs[2]?.textContent?.trim();
      const flipVal = inputs[3]?.textContent?.trim();
      const cropVal = inputs[4]?.textContent?.trim();
      const altFromAuthor = inputs[5]?.textContent?.trim();

      if (!baseUrl) {
        console.error('OpenAPI delivery URL not found. Ensure the DM delivery repository asset is selected.');
        return;
      }

      const params = new URLSearchParams();
      params.set('width', '1400');
      params.set('quality', '85');
      if (rotationVal && rotationVal.toLowerCase() !== 'none') params.set('rotate', rotationVal);
      if (flipVal) params.set('flip', flipVal.toLowerCase());
      if (cropVal) params.set('crop', cropVal.toLowerCase());

      const finalUrl = `${baseUrl}?${params.toString()}`;

      const img = document.createElement('img');
      img.setAttribute('src', finalUrl);
      img.setAttribute('alt', altFromAuthor || 'dynamic media image');
      img.setAttribute('loading', 'lazy');

      block.innerHTML = '';
      block.appendChild(img);
    }
  } else {
    block.innerHTML = '';
  }
}
