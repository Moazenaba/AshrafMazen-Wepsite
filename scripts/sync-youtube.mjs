// Reads the YouTube RSS feed of every playlist in src/constants/youtubePlaylists.ts and writes
// src/data/youtube-playlists.json, so the site can show playlists and their videos with no network calls.
// Run with: npm run sync:youtube
// The feed returns the most recent videos of each playlist (newest first), up to about 15 per playlist.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'src/constants/youtubePlaylists.ts'), 'utf8');

// Pull the playlist ids and their channel titles out of the constants file
const playlists = [...source.matchAll(/\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*count:\s*'([^']+)'/g)].map(
  ([, id, title, count]) => ({ id, title, count })
);

const decode = (text) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const parseFeed = (xml) => {
  const feedTitle = decode(xml.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').trim();
  const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, entry]) => ({
    id: entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] ?? '',
    title: decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '').trim(),
    published: entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? '',
  }));
  return { feedTitle, videos: videos.filter((v) => v.id) };
};

const result = [];
for (const playlist of playlists) {
  const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlist.id}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed: ${playlist.title} (${response.status})`);
    continue;
  }
  const { videos } = parseFeed(await response.text());
  result.push({ ...playlist, videos });
  console.log(`${playlist.title}: ${videos.length} videos`);
}

const outDir = resolve(root, 'src/data');
mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, 'youtube-playlists.json'),
  JSON.stringify({ syncedAt: new Date().toISOString(), playlists: result }, null, 2) + '\n',
  'utf8'
);
console.log(`Wrote ${result.length} playlists to src/data/youtube-playlists.json`);
