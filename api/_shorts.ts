// Pure parsing for the channel's Shorts (the reels on the site). No network here, so it is tested on its own.

export interface ShortItem {
  id: string;
  title: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const unescapeJson = (text: string) => {
  try {
    return JSON.parse(`"${text}"`) as string;
  } catch {
    return text;
  }
};

const decodeXml = (text: string) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

// The channel's "Shorts" page: each short is a shortsLockupViewModel with its video id and its title
export function parseShortsPage(html: string): ShortItem[] {
  const seen = new Set<string>();
  const items: ShortItem[] = [];
  for (const part of html.split('"shortsLockupViewModel":{').slice(1)) {
    const block = part.slice(0, 6000);
    const id = block.match(/"videoId":"([A-Za-z0-9_-]{11})"/)?.[1] ?? block.match(/\/shorts\/([A-Za-z0-9_-]{11})/)?.[1];
    if (!id || seen.has(id)) continue;
    const raw = block.match(/"overlayMetadata":\{"primaryText":\{"content":"((?:[^"\\]|\\.)*)"/)?.[1] ?? '';
    seen.add(id);
    items.push({ id, title: unescapeJson(raw).trim() });
  }
  return items;
}

// YouTube's RSS feed of the channel's Shorts playlist (UUSH + the channel id without "UC")
export function parseShortsFeed(xml: string): ShortItem[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => ({
      id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? '',
      title: decodeXml(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').trim(),
    }))
    .filter((item) => VIDEO_ID.test(item.id));
}

// In the order given (each list is newest first); a short appears once, keeping the first title that is not empty
export function mergeShorts(...lists: ShortItem[][]): ShortItem[] {
  const byId = new Map<string, ShortItem>();
  for (const list of lists) {
    for (const item of list) {
      const known = byId.get(item.id);
      if (!known) byId.set(item.id, item);
      else if (!known.title && item.title) known.title = item.title;
    }
  }
  return [...byId.values()];
}
