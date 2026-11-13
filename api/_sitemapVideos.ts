// The videos sitemap (/sitemap-videos.xml): the playlists and videos the site shows right now, so a video found on the
// channel after the last deploy reaches Google within the hour without waiting for one. Pure functions; the function
// that serves it is sitemap-videos.ts. What the admin hid or removed is taken off before this is built.
import type { YoutubeOverrides } from '../src/services/data/youtube';

export interface SitemapPlaylist {
  id: string;
  title: string;
  videos: { id: string; title: string; src?: string }[];
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID = /^[A-Za-z0-9_-]{2,60}$/;
// Google reads up to 50 000 addresses in one sitemap
const MAX_URLS = 5000;

const escapeXml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const list = (v: unknown) => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, any>) : {});

// The admin's saved settings (site_settings "youtube_overrides") with every part present
export function normalizeOverrides(raw: unknown): YoutubeOverrides {
  const o = obj(raw);
  return {
    hiddenPlaylists: list(o.hiddenPlaylists),
    hiddenVideos: list(o.hiddenVideos),
    videoTitles: obj(o.videoTitles),
    playlistTitles: obj(o.playlistTitles),
    extraPlaylists: list(o.extraPlaylists),
    extraVideos: list(o.extraVideos),
    playlistAdditions: obj(o.playlistAdditions),
    playlistOrder: list(o.playlistOrder),
    mediaFiles: obj(o.mediaFiles),
    playlistRemovals: obj(o.playlistRemovals),
    videoOrder: obj(o.videoOrder),
    playlistCategories: obj(o.playlistCategories),
  } as YoutubeOverrides;
}

// `dateOf`: the true publication date of a video when it is known (a video found today has none, and is left undated)
export function videosSitemap(playlists: SitemapPlaylist[], siteUrl: string, dateOf: (videoId: string) => string | undefined = () => undefined): string {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const playlist of playlists) {
    if (!PLAYLIST_ID.test(playlist.id) || playlist.videos.length === 0) continue;
    urls.push(`  <url><loc>${escapeXml(`${siteUrl}/playlist/${playlist.id}`)}</loc></url>`);
  }
  for (const playlist of playlists) {
    for (const video of playlist.videos) {
      // A file uploaded to the site is not on YouTube; a video in several playlists is listed once
      if (video.src || !VIDEO_ID.test(video.id) || seen.has(video.id) || !video.title) continue;
      seen.add(video.id);
      const date = dateOf(video.id);
      urls.push(`  <url>
    <loc>${escapeXml(`${siteUrl}/video/${video.id}`)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(`${video.title} - من «${playlist.title}» للشيخ أشرف مازن.`)}</video:description>
      <video:player_loc>${escapeXml(`https://www.youtube-nocookie.com/embed/${video.id}`)}</video:player_loc>${date && !Number.isNaN(Date.parse(date)) ? `\n      <video:publication_date>${escapeXml(date)}</video:publication_date>` : ''}
    </video:video>
  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.slice(0, MAX_URLS).join('\n')}
</urlset>
`;
}
