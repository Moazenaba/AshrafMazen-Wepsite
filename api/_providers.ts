// The outside services that turn a YouTube video into a file to download, tried one after another.
// Three kinds are understood: cobalt (its API), Invidious and Piped (their stream lists, through their own proxy).
// The lists come from environment variables (comma separated), so a dead service can be swapped without code:
//   COBALT_INSTANCES   = https://host[|api-key],...
//   INVIDIOUS_INSTANCES = https://host,...
//   PIPED_INSTANCES     = https://host,...
// Nothing here touches the network; api/media-link.ts does, so these rules can be tested on their own.

// 'listen': the original sound to play on the site (no conversion, so it arrives fast with its size known)
export type MediaKind = 'audio' | 'video' | 'listen';

export interface Provider {
  type: 'cobalt' | 'invidious' | 'piped';
  base: string;
  key?: string;
}

export interface MediaLink {
  url: string;
  filename?: string;
  // The file comes as an attachment (saved, not played in a tab)
  attachment: boolean;
}

export const DEFAULTS = {
  cobalt: ['https://api.cobalt.liubquanti.click'],
  invidious: ['https://yt.chocolatemoo53.com'],
  piped: ['https://pipedapi.kavin.rocks', 'https://api.piped.private.coffee'],
};

const clean = (url: string) => url.trim().replace(/\/+$/, '');

function list(raw: string | undefined, fallback: string[]): string[] {
  const items = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

export function providersFrom(env: Record<string, string | undefined>): Provider[] {
  const cobalt = list(env.COBALT_INSTANCES, DEFAULTS.cobalt).map((item) => {
    const [base, key] = item.split('|');
    return { type: 'cobalt' as const, base: clean(base), ...(key ? { key: key.trim() } : {}) };
  });
  const invidious = list(env.INVIDIOUS_INSTANCES, DEFAULTS.invidious).map((b) => ({ type: 'invidious' as const, base: clean(b) }));
  const piped = list(env.PIPED_INSTANCES, DEFAULTS.piped).map((b) => ({ type: 'piped' as const, base: clean(b) }));
  return [...cobalt, ...invidious, ...piped].filter((p) => /^https:\/\//.test(p.base));
}

export function cobaltRequest(p: Provider, videoId: string, kind: MediaKind): { url: string; init: RequestInit } {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (p.key) headers.Authorization = `Api-Key ${p.key}`;
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const body =
    kind === 'listen'
      ? { url, downloadMode: 'audio', audioFormat: 'best', filenameStyle: 'basic' }
      : kind === 'audio'
        ? { url, downloadMode: 'audio', audioFormat: 'mp3', audioBitrate: '128', filenameStyle: 'basic' }
        : { url, downloadMode: 'auto', videoQuality: '720', youtubeVideoCodec: 'h264', filenameStyle: 'basic' };
  return { url: `${p.base}/`, init: { method: 'POST', headers, body: JSON.stringify(body) } };
}

// Whether a cobalt link must be checked to give bytes before it is handed out. A link on the relay's own address
// (it passes the file on from a server behind it) came back empty (200 and 0 bytes) when that server failed: a
// visitor got a 0 KB file or silence. Links straight from the servers behind it worked. The sound to play on the
// site is always checked: it is not converted, so its first bytes come within ~2 s.
export function cobaltLinkNeedsCheck(base: string, url: string, kind: MediaKind): boolean {
  if (kind === 'listen') return true;
  try {
    return new URL(url).host === new URL(base).host;
  } catch {
    return true;
  }
}

export function parseCobalt(data: any): MediaLink | null {
  if (!data || (data.status !== 'tunnel' && data.status !== 'redirect') || typeof data.url !== 'string') return null;
  return { url: data.url, filename: typeof data.filename === 'string' ? data.filename : undefined, attachment: data.status === 'tunnel' };
}

const absolute = (base: string, url: string) => (url.startsWith('/') ? `${base}${url}` : url);

// Invidious: a recording (itag 140, m4a) or the 360p video with sound (itag 18), through the instance's own proxy
export const invidiousRequest = (p: Provider, videoId: string) => `${p.base}/api/v1/videos/${videoId}?local=true&fields=title,adaptiveFormats,formatStreams`;

export function parseInvidious(p: Provider, data: any, kind: MediaKind): MediaLink | null {
  const pool: any[] = kind !== 'video' ? data?.adaptiveFormats ?? [] : data?.formatStreams ?? [];
  const pick =
    kind !== 'video'
      ? pool.find((f) => String(f?.itag) === '140') ?? pool.find((f) => String(f?.type ?? '').startsWith('audio/mp4'))
      : pool.find((f) => String(f?.itag) === '22') ?? pool.find((f) => String(f?.itag) === '18') ?? pool[0];
  if (!pick?.url) return null;
  return { url: absolute(p.base, pick.url), filename: data?.title, attachment: false };
}

// Piped: its stream list, already proxied
export const pipedRequest = (p: Provider, videoId: string) => `${p.base}/streams/${videoId}`;

export function parsePiped(data: any, kind: MediaKind): MediaLink | null {
  if (kind !== 'video') {
    const audio: any[] = (data?.audioStreams ?? []).filter((s: any) => s?.url);
    const pick = audio.find((s) => String(s.mimeType ?? '').includes('mp4')) ?? audio[0];
    return pick ? { url: pick.url, filename: data?.title, attachment: false } : null;
  }
  const videos: any[] = (data?.videoStreams ?? []).filter((s: any) => s?.url && s.videoOnly === false);
  const pick = videos.find((s) => String(s.quality ?? '').startsWith('720')) ?? videos[0];
  return pick ? { url: pick.url, filename: data?.title, attachment: false } : null;
}

// Only the sheikh's channel: the video's author (from YouTube's oEmbed) must be the channel
export function isChannelVideo(oembed: any, channelHandle: string, channelId: string): boolean {
  const author = String(oembed?.author_url ?? '').toLowerCase();
  return author.endsWith(`/@${channelHandle.toLowerCase()}`) || author.endsWith(`/channel/${channelId.toLowerCase()}`);
}
