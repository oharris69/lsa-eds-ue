/* eslint-disable no-underscore-dangle */
/* AEM GraphQL system fields (_path, _authorUrl, _publishUrl, _dynamicUrl) use
   leading underscores we cannot rename. */
import { getMetadata } from '../../scripts/aem.js';
import { isAuthorEnvironment } from '../../scripts/scripts.js';
import { getHostname, mapAemPathToSitePath } from '../../scripts/utils.js';

/**
 * News Story block — renders a single "News Story" Content Fragment as a card
 * (image + title + summary + link). Fetches the CF via the lsa-umich-eds
 * persisted query, following the same author/publish pattern as the existing
 * content-fragment block (direct GET on author, wrapper POST on publish).
 * @param {Element} block
 */
export default async function decorate(block) {
  const CONFIG = {
    // Shared RefDemo wrapper gateway used for publish-side CF fetches.
    WRAPPER_SERVICE_URL: 'https://3635370-refdemoapigateway-stage.adobeioruntime.net/api/v1/web/ref-demo-api-gateway/fetch-cf',
    GRAPHQL_QUERY: '/graphql/execute.json/lsa-umich-eds/NewsStoryByPath',
  };

  // The CF path is authored as a link/text in the first cell of the block.
  const contentPath = block.querySelector(':scope div:nth-child(1) > div a')?.textContent?.trim()
    || block.querySelector(':scope div:nth-child(1) > div')?.textContent?.trim();

  block.innerHTML = '';
  if (!contentPath) return;

  const isAuthor = isAuthorEnvironment();
  const hostnameFromPlaceholders = await getHostname();
  const hostname = hostnameFromPlaceholders || getMetadata('hostname');
  const aemauthorurl = getMetadata('authorurl') || '';
  const aempublishurl = hostname?.replace('author', 'publish')?.replace(/\/$/, '');

  const requestConfig = isAuthor
    ? {
      url: `${aemauthorurl}${CONFIG.GRAPHQL_QUERY};path=${contentPath};ts=${Date.now()}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
    : {
      url: CONFIG.WRAPPER_SERVICE_URL,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphQLPath: `${aempublishurl}${CONFIG.GRAPHQL_QUERY}`,
        cfPath: contentPath,
        variation: `master;ts=${Date.now()}`,
      }),
    };

  let item;
  try {
    const response = await fetch(requestConfig.url, {
      method: requestConfig.method,
      headers: requestConfig.headers,
      ...(requestConfig.body && { body: requestConfig.body }),
    });
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`news-story: CF request failed ${response.status}`, { contentPath });
      return;
    }
    const offer = await response.json();
    item = offer?.data?.newsStoryByPath?.item;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('news-story: error fetching CF', { error: error.message, contentPath });
    return;
  }

  if (!item) {
    // eslint-disable-next-line no-console
    console.error('news-story: no item returned', { contentPath });
    return;
  }

  // Resolve the card image URL (author vs publish rendition).
  const fi = item.featuredImage || {};
  const imgUrl = isAuthor
    ? (fi._authorUrl || fi._path)
    : (fi._dynamicUrl || fi._publishUrl || fi._path);

  // Resolve the story link: map /content DAM/site paths through paths.json on
  // publish; use as-authored on author.
  let href = item.link || '#';
  if (!isAuthor && href && href.startsWith('/content/')) {
    try {
      const mapped = await mapAemPathToSitePath(href);
      if (mapped) href = mapped;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('news-story: paths.json map failed', e);
    }
  }

  const summary = item.summary?.plaintext || '';
  const linkText = item.linkText || 'Read More';

  block.innerHTML = `
    <div class="news-story-card">
      ${imgUrl ? `<div class="news-story-image"><img src="${imgUrl}" alt="${item.imageAlt || ''}" loading="lazy"></div>` : ''}
      <div class="news-story-body">
        ${item.category ? `<p class="news-story-category">${item.category}</p>` : ''}
        <h3 class="news-story-title"><a href="${href}">${item.title || ''}</a></h3>
        <p class="news-story-summary">${summary}</p>
        <p class="news-story-cta"><a href="${href}" class="button">${linkText}</a></p>
      </div>
    </div>`;
}
