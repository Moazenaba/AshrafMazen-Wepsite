// The pure parts of scripts/prerender.mjs, kept apart so they can be tested without running the whole build.
import { DEFAULT_NAME_FONT_ID, NAME_FONT_LIST } from '../src/constants/nameFontList.js';

export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// JSON inside <script>: "</" would end the script early
export const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const setMeta = (html, attr, name, value) =>
  html.replace(new RegExp(`(<meta ${attr}="${name}" content=")[^"]*(")`), `$1${esc(value)}$2`);

// The shell with one page's head and text. `site` = { siteUrl, verification }.
export function render(template, { path, title, description, image, schema = [], body, noCanonical = false }, site) {
  const url = (p) => `${site.siteUrl}${encodeURI(p)}`;
  let html = template.replace(/<title>[^<]*<\/title>/, () => `<title>${esc(title)}</title>`);
  html = setMeta(html, 'name', 'description', description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', description);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', description);
  if (noCanonical) {
    html = html.replace(/\s*<link rel="canonical"[^>]*>/, '').replace(/\s*<meta property="og:url"[^>]*>/, '');
  } else {
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url(path))}$2`);
    html = setMeta(html, 'property', 'og:url', url(path));
  }
  if (image) {
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = html.replace('</head>', `  <meta property="og:image" content="${esc(image)}" />\n    <meta name="twitter:image" content="${esc(image)}" />\n  </head>`);
  }
  const extraHead = [site.verification, ...schema.map(jsonLd)].filter(Boolean).join('\n    ');
  if (extraHead) html = html.replace('</head>', () => `  ${extraHead}\n  </head>`);
  if (body) {
    html = html.replace(
      '<div id="root"></div>',
      () => `<div id="root"><main dir="rtl" style="max-width:72rem;margin:0 auto;padding:2rem 1rem;line-height:1.9">${body}</main></div>`
    );
  }
  return html;
}

// The sheikh's name is drawn in the admin's font from the first paint, and that font's file is the one preloaded,
// so the big name on the home page never changes font (and height) after the page appears
export function withNameFont(html, id) {
  const font = NAME_FONT_LIST.find((f) => f.id === id) ?? NAME_FONT_LIST.find((f) => f.id === DEFAULT_NAME_FONT_ID);
  return html
    .replace(/(<link rel="preload" id="name-font-preload" href=")[^"]*(")/, `$1${font.file}$2`)
    .replace(/<html ([^>]*)>/, (tag, attrs) => (attrs.includes('style=') ? tag : `<html ${attrs} style="--name-font: ${esc(font.family)}">`));
}

// The same answer /api/site gives, written into the page as inert JSON: a first-time visitor's first render already has
// the texts, lessons and featured card, and the fresh answer replaces it a moment later. `readSeed` returns the data;
// when it fails the page is returned unchanged and fetches as before.
export async function withSiteSeed(html, readSeed) {
  try {
    const json = JSON.stringify(await readSeed()).replace(/</g, '\\u003c');
    return html.replace('</body>', () => `<script type="application/json" id="site-seed">${json}</script>
  </body>`);
  } catch (err) {
    console.warn(`site seed skipped: ${err.message}`);
    return html;
  }
}
