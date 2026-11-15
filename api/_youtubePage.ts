// Reads the videos of a YouTube playlist page or of the channel's "videos" page, and the playlists of the channel's
// "playlists" page (their ytInitialData), for when the RSS feeds (videos.xml) answer 404, which YouTube does now.
// Pure functions: the function that fetches is in youtube-library.ts.

export interface PageVideo {
  id: string;
  title: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// Every request to YouTube asks for the Arabic page. Without it YouTube answers a server in the USA (Vercel, GitHub)
// with its automatic English translation of the titles, and English titles reached the site.
export const YOUTUBE_LANGUAGE = 'hl=ar&gl=EG';
export const withArabic = (url: string) => `${url}${url.includes('?') ? '&' : '?'}${YOUTUBE_LANGUAGE}`;
export const YOUTUBE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'ar,en;q=0.5',
  Cookie: 'CONSENT=YES+1; SOCS=CAI; PREF=hl=ar&gl=EG',
};

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
  return videosIn(pageData(html));
}

// The same, from any part of YouTube's data: the page's own, or the answer for the next page of a long playlist
export function videosIn(data: unknown): PageVideo[] {
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

// A long playlist shows its first 100 videos; the rest come page by page. This is the token for the next page
// (it sits in a continuationCommand, directly or inside a commandExecutorCommand in the newer layout), or null.
export function continuationIn(data: unknown): string | null {
  let token: string | null = null;
  const walk = (node: any): void => {
    if (token || !node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (typeof node.continuationCommand?.token === 'string') {
      token = node.continuationCommand.token;
      return;
    }
    Object.values(node).forEach(walk);
  };
  walk(data);
  return token;
}

// What the page says to ask for the next page with (YouTube's own web client key and version), or null
export function innertubeOf(html: string): { key: string; version: string } | null {
  const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
  const version = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1];
  return key && version ? { key, version } : null;
}

// When a video was published, from its watch page, as an ISO time in UTC; null when the page does not say
export function publishDateOf(html: string): string | null {
  const raw = html.match(/"publishDate":"([^"]+)"/)?.[1] ?? html.match(/itemprop="datePublished" content="([^"]+)"/)?.[1];
  if (!raw) return null;
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

// Newest first. A video with no date keeps its place after the dated ones, in the order it had.
export function newestFirst<T extends { published?: string }>(videos: T[]): T[] {
  return videos
    .map((video, index) => ({ video, index, time: video.published ? Date.parse(video.published) : NaN }))
    .sort((a, b) => {
      const aDated = !Number.isNaN(a.time);
      const bDated = !Number.isNaN(b.time);
      if (aDated && bDated) return b.time - a.time || a.index - b.index;
      if (aDated !== bDated) return aDated ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.video);
}

// The playlists in the order of the channel's own page; one that is not on that page keeps its place after them
export function inChannelOrder<T extends { id: string }>(playlists: T[], channelIds: string[]): T[] {
  const position = new Map(channelIds.map((id, index) => [id, index]));
  return playlists
    .map((playlist, index) => ({ playlist, index }))
    .sort((a, b) => {
      const pa = position.get(a.playlist.id);
      const pb = position.get(b.playlist.id);
      if (pa !== undefined && pb !== undefined) return pa - pb;
      if (pa !== undefined || pb !== undefined) return pa !== undefined ? -1 : 1;
      return a.index - b.index;
    })
    .map((entry) => entry.playlist);
}
