// Downloading a video or a recording, or a whole playlist one after another.
// A file kept on the site is saved from there; a YouTube video is fetched through /api/media-link, which asks
// outside download services in turn, so the file goes from them straight to the visitor.
import { isR2Url, r2DownloadUrl } from '../services/r2';
import type { MediaFiles, SiteVideo } from './libraryOverrides';

export type DownloadKind = keyof MediaFiles;

export type DownloadSource = { type: 'file'; url: string; name: string } | { type: 'youtube'; id: string; name: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

// A link that saves the file under the video's title
export function downloadHref(url: string, name: string): string {
  return isR2Url(url) ? r2DownloadUrl(url, name) : url;
}

// Where one video's file comes from: the site's own file first, else YouTube (a site upload without that kind has none)
export function sourceOf(video: SiteVideo, kind: DownloadKind, name = video.title): DownloadSource | null {
  const file = video.files?.[kind];
  if (file) return { type: 'file', url: file, name };
  if (!video.src && YOUTUBE_ID.test(video.id)) return { type: 'youtube', id: video.id, name };
  return null;
}

// What a playlist can give for one kind, numbered, and how many videos have nothing to give
export function playlistSources(videos: SiteVideo[], kind: DownloadKind): { items: DownloadSource[]; missing: number } {
  const items = videos.flatMap((v, i) => {
    const source = sourceOf(v, kind, `${String(i + 1).padStart(2, '0')} - ${v.title}`);
    return source ? [source] : [];
  });
  return { items, missing: videos.length - items.length };
}

interface MediaLink {
  url: string;
  attachment: boolean;
}

export async function fetchMediaLink(id: string, kind: DownloadKind): Promise<MediaLink> {
  const response = await fetch(`/api/media-link?id=${encodeURIComponent(id)}&kind=${kind}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data?.url !== 'string') throw new Error(data?.error || 'تعذّر تجهيز التحميل الآن. حاول بعد قليل.');
  return { url: data.url, attachment: !!data.attachment };
}

export interface StartedDownload {
  url: string;
  name: string;
  // Sent as an attachment: opening it saves the file and the page stays
  attachment: boolean;
  // Started by itself; otherwise the visitor taps its button in the dialog
  auto?: boolean;
  // The YouTube video it came from and when, so an old link can be asked for again
  youtubeId?: string;
  at?: number;
}

// cobalt's links (attachments) die about 90 seconds after they are made; a phone visitor often comes back later
// (after checking the download in another app), and a dead link saves as a 0 KB file
const LINK_FRESH_MS = 60 * 1000;
export const isStale = (d: StartedDownload, now = Date.now()) => !!d.youtubeId && d.attachment && now - (d.at ?? 0) > LINK_FRESH_MS;

// "إعادة التحميل": the same link while fresh, else a new one from the services
export async function redownload(d: StartedDownload, kind: DownloadKind): Promise<StartedDownload> {
  if (!isStale(d)) {
    deliver(d);
    return d;
  }
  const fresh: StartedDownload = { ...(await fetchMediaLink(d.youtubeId!, kind)), name: d.name, youtubeId: d.youtubeId, at: Date.now() };
  fresh.auto = deliver(fresh);
  // A link that is not an attachment cannot be opened this late (the browser would block it): it is shown to tap
  return fresh;
}

// An attachment is opened in this tab: the browser saves it and the page stays where it is.
// (A hidden frame works on laptops but phones, iPhones above all, ignore downloads from it.)
// Any other link would need a new tab, and opening one seconds after the click (the link takes time to get) is
// what the browser blocks as a popup, so it is not opened here: the dialog shows it as a button to tap.
// Returns whether the download was started.
export function deliver(d: StartedDownload): boolean {
  if (!d.attachment) return false;
  window.location.href = d.url;
  return true;
}

// Gets the link (from the site's files or the download services) and starts it; returns it for "إعادة التحميل"
export async function downloadSource(source: DownloadSource, kind: DownloadKind): Promise<StartedDownload> {
  const started: StartedDownload =
    source.type === 'file'
      ? { url: downloadHref(source.url, source.name), name: source.name, attachment: isR2Url(source.url) }
      : { ...(await fetchMediaLink(source.id, kind)), name: source.name, youtubeId: source.id, at: Date.now() };
  started.auto = deliver(started);
  return started;
}

// The last resort when every service fails: savefrom's own shortcut (sfrom.net/ before the video link).
// It opens their page with the download ready; the visitor presses «Download» there.
export const savefromUrl = (videoId: string) => `https://sfrom.net/https://www.youtube.com/watch?v=${videoId}`;

export const youtubeUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

// Download sites the visitor can open when our services fail, in order. Each is opened by the visitor's own tap
// (never by the page later, which the browser would block). A site that cannot take the video in its address
// gets the video's link copied first, so the visitor only pastes it there. Checked by hand on 2026-11-12;
// add or reorder sites here (their own pages only: their hidden APIs are not ours to call).
export interface FallbackSite {
  name: string;
  url: (videoId: string) => string;
  // The video is already filled in when the page opens
  prefilled: boolean;
}

export const FALLBACK_SITES: FallbackSite[] = [
  { name: 'SaveFrom', url: savefromUrl, prefilled: true },
  { name: 'Y2mate', url: () => 'https://v42.www-y2mate.com/', prefilled: false },
];

// One after another, with a short pause, so the browser accepts them all (it may ask once to allow several downloads).
// A video that fails is counted and skipped.
export async function downloadAll(
  items: DownloadSource[],
  kind: DownloadKind,
  onProgress?: (done: number, failed: number) => void,
  signal?: { cancelled: boolean }
): Promise<{ failed: number; failedVideos: { id: string; name: string }[]; started: StartedDownload[] }> {
  let failed = 0;
  const failedVideos: { id: string; name: string }[] = [];
  const started: StartedDownload[] = [];
  for (let i = 0; i < items.length; i++) {
    if (signal?.cancelled) break;
    try {
      started.push(await downloadSource(items[i], kind));
    } catch {
      failed++;
      const item = items[i];
      if (item.type === 'youtube') failedVideos.push({ id: item.id, name: item.name });
    }
    onProgress?.(i + 1, failed);
    if (i < items.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }
  return { failed, failedVideos, started };
}
