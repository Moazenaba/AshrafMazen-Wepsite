// Downloading the site's files: one video or recording, or a whole playlist one file after another.
// Only files kept on the site (uploaded by the admin) can be downloaded; YouTube does not allow downloading its videos.
import { isR2Url, r2DownloadUrl } from '../services/r2';
import type { MediaFiles, SiteVideo } from './libraryOverrides';

export type DownloadKind = keyof MediaFiles;

// A link that saves the file under the video's title
export function downloadHref(url: string, name: string): string {
  return isR2Url(url) ? r2DownloadUrl(url, name) : url;
}

// What a playlist can give for one kind: the files there are, and how many videos have none
export function playlistFiles(videos: SiteVideo[], kind: DownloadKind): { items: { url: string; name: string }[]; missing: number } {
  const items = videos.flatMap((v, i) => (v.files?.[kind] ? [{ url: v.files[kind] as string, name: `${String(i + 1).padStart(2, '0')} - ${v.title}` }] : []));
  return { items, missing: videos.length - items.length };
}

export function triggerDownload(url: string, name: string): void {
  const a = document.createElement('a');
  a.href = downloadHref(url, name);
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// One file at a time with a short pause, so the browser accepts them all (it may ask once to allow several downloads)
export async function downloadAll(items: { url: string; name: string }[], onProgress?: (done: number) => void, signal?: { cancelled: boolean }): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    if (signal?.cancelled) return;
    triggerDownload(items[i].url, items[i].name);
    onProgress?.(i + 1);
    await new Promise((r) => setTimeout(r, 1500));
  }
}
