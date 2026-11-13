// Reads the videos of a YouTube playlist page or of the channel's "videos" page, and the playlists of the channel's
// "playlists" page (their ytInitialData), for when the RSS feeds (videos.xml) answer 404, which YouTube does now.
// Pure functions: the function that fetches is in youtube-library.ts.

export interface PageVideo {
  id: string;
  title: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// The JSON the page carries for its own rendering
export function pageData(html: string): unknown {
  const start = html.indexOf('var ytInitialData');
  if (start < 0) return null;
  const open = html.indexOf('{', start);
  const end = html.indexOf(';</script>', open);
  if (open < 0 || end < 0) return null;
  try {
    return JSON.parse(html.slice(open, end));
  } catch {
    return null;
  }
}

const textOf = (value: any): string => String(value?.content ?? value?.simpleText ?? value?.runs?.map((r: any) => r?.text ?? '').join('') ?? '').trim();

// Every video in the page, in the page's order, each once. YouTube shows a video in one of three shapes
// (the newer "lockup", or a playlist / list video renderer); all are read.
export function parseVideos(html: string): PageVideo[] {
  const data = pageData(html);
  const found = new Map<string, string>();
  const add = (id: unknown, title: string) => {
    if (typeof id === 'string' && VIDEO_ID.test(id) && title && !found.has(id)) found.set(id, title);
  };
  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const lockup = node.lockupViewModel;
    if (lockup?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') add(lockup.contentId, textOf(lockup.metadata?.lockupMetadataViewModel?.title));
    for (const key of ['playlistVideoRenderer', 'videoRenderer']) if (node[key]) add(node[key].videoId, textOf(node[key].title));
    Object.values(node).forEach(walk);
  };
  walk(data);
  return [...found.entries()].map(([id, title]) => ({ id, title }));
}

const PLAYLIST_ID = /^(PL|OL)[A-Za-z0-9_-]{10,60}$/;

// The playlists on the channel's "playlists" page, in its order, each once (a podcast is a playlist too)
export function parsePlaylists(html: string): PageVideo[] {
  const found = new Map<string, string>();
  const walk = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    const lockup = node.lockupViewModel;
    if (lockup && (lockup.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST' || lockup.contentType === 'LOCKUP_CONTENT_TYPE_PODCAST')) {
      const title = textOf(lockup.metadata?.lockupMetadataViewModel?.title);
      if (typeof lockup.contentId === 'string' && PLAYLIST_ID.test(lockup.contentId) && title && !found.has(lockup.contentId)) found.set(lockup.contentId, title);
    }
    Object.values(node).forEach(walk);
  };
  walk(pageData(html));
  return [...found.entries()].map(([id, title]) => ({ id, title }));
}
