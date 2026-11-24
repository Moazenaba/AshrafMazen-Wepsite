// Text rules for page titles and descriptions, shared by the build (scripts/prerender.mjs, generate-sitemap.mjs),
// the videos sitemap (api/) and the app (pageMeta). Plain functions with no imports so every runtime can load them.

export const SITE_NAME = 'الشيخ أشرف مازن';

// Many channel titles end in hashtags ("… | #الشيخ_أشرف_مازن", "…/# لفضيلة الشيخ أشرف -مازن"). In a search result
// that tail reads as noise and cuts the real title short, so titles shown to search engines drop it.
// The visible title on YouTube is untouched; only our <title>, headings and structured data use the clean form.
export function cleanVideoTitle(raw: string): string {
  const original = String(raw ?? '').trim();
  const clean = original
    .replace(/\s*[|/]\s*#[^|/]*$/u, '') // a last part that is a hashtag
    .replace(/#[\p{L}\p{N}_]+/gu, '') // hashtags left in the middle
    .replace(/\s+/g, ' ')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/[\s|/_-]+$/u, '')
    .trim();
  return clean || original;
}

// The page title for a video, playlist or live page: its clean name, with the site's name unless it already has it
export function namedTitle(text: string): string {
  const clean = cleanVideoTitle(text);
  return /مازن/.test(clean) ? clean : `${clean} - ${SITE_NAME}`;
}

// The description of a channel video page
export function videoDescription(title: string, playlistTitle?: string): string {
  const clean = cleanVideoTitle(title);
  return `${clean}${playlistTitle ? ` - من «${cleanVideoTitle(playlistTitle)}»` : ''} للشيخ أشرف مازن.`;
}
