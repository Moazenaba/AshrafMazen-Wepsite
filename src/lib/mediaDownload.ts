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
}

// An attachment is opened in this tab: the browser saves it and the page stays where it is.
// (A hidden frame works on laptops but phones, iPhones above all, ignore downloads from it.)
// Any other link opens in a new tab, where the visitor can save it.
export function deliver(d: StartedDownload): void {
  if (d.attachment) {
    window.location.href = d.url;
    return;
  }
  const a = document.createElement('a');
  a.href = d.url;
  a.download = d.name;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Gets the link (from the site's files or the download services) and starts it; returns it for "إعادة التحميل"
export async function downloadSource(source: DownloadSource, kind: DownloadKind): Promise<StartedDownload> {
  const started: StartedDownload =
    source.type === 'file'
      ? { url: downloadHref(source.url, source.name), name: source.name, attachment: isR2Url(source.url) }
      : { ...(await fetchMediaLink(source.id, kind)), name: source.name };
  deliver(started);
  return started;
}

// The last resort when every service fails: savefrom's own shortcut (sfrom.net/ before the video link).
// It opens their page with the download ready; the visitor presses «Download» there.
export const savefromUrl = (videoId: string) => `https://sfrom.net/https://www.youtube.com/watch?v=${videoId}`;

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
