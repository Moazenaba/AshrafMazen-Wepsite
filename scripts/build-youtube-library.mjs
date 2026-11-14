// Merges every source of playlist videos into src/data/youtube-library.ts, which the site imports:
//   - src/data/youtube-playlists.json   (the RSS sync: newest videos, written by sync:youtube)
//   - src/data/youtube-backfill.json    (full lists saved by hand, keyed by playlist id)
//   - src/data/youtube-videos/<id>.json (full lists saved by hand, one file per playlist)
// Run with: npm run build:library   (after sync:youtube, whenever the lists change)
//
// A video removed from YouTube (deleted or made private) is left out: its thumbnail answers 404, so the site would
// show a broken picture (and log an error in every visitor's console) for a video nobody can watch. A playlist whose
// newest video is gone takes its cover from the next one. Only a definite 404 removes a video; a network failure keeps it.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeLibraryFile } from './youtube-library-file.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

// Playlist details (titles, counts, latest video) from the constants file
const playlists = [
  ...read('src/constants/youtubePlaylists.ts').matchAll(
    /\{\s*id:\s*'([^']+)',\s*title:\s*'([^']+)',\s*count:\s*'([^']+)',\s*latestVideoId:\s*'([^']+)'\s*\}/g
  ),
].map(([, id, title, count, latestVideoId]) => ({ id, title, count, latestVideoId }));

// Newest videos from the RSS sync, keyed by playlist id
const rssPath = 'src/data/youtube-playlists.json';
const rss = new Map();
if (existsSync(resolve(root, rssPath))) {
  for (const p of JSON.parse(read(rssPath)).playlists) {
    rss.set(p.id, p.videos.map((v) => ({ id: v.id, title: v.title, published: v.published })));
  }
}

// Full lists saved by hand: [videoId, title] pairs
const backfill = existsSync(resolve(root, 'src/data/youtube-backfill.json'))
  ? JSON.parse(read('src/data/youtube-backfill.json'))
  : {};
const perPlaylistDir = resolve(root, 'src/data/youtube-videos');
const perPlaylist = {};
if (existsSync(perPlaylistDir)) {
  for (const file of readdirSync(perPlaylistDir).filter((f) => f.endsWith('.json'))) {
    perPlaylist[file.replace(/\.json$/, '')] = JSON.parse(read(`src/data/youtube-videos/${file}`));
  }
}

const merged = playlists.map((playlist) => {
  const seen = new Set();
  const videos = [];
  const add = (video) => {
    if (!video.id || !video.title || seen.has(video.id)) return;
    seen.add(video.id);
    videos.push(video);
  };
  // Newest first from the RSS sync, then the hand-saved full list
  (rss.get(playlist.id) ?? []).forEach(add);
  (backfill[playlist.id] ?? []).forEach(([id, title]) => add({ id, title }));
  (perPlaylist[playlist.id] ?? []).forEach(([id, title]) => add({ id, title }));
  return { ...playlist, videos };
});

// Asks YouTube once per video, a few at a time
async function removedVideoIds(ids) {
  const removed = new Set();
  let unreachable = 0;
  const queue = [...ids];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      try {
        const response = await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, { method: 'HEAD' });
        if (response.status === 404) removed.add(id);
      } catch {
        unreachable++;
      }
    }
  };
  await Promise.all(Array.from({ length: 16 }, worker));
  if (unreachable) console.warn(`Could not check ${unreachable} videos (kept them). On a TLS error run with NODE_OPTIONS=--use-system-ca`);
  return removed;
}

const allIds = new Set(merged.flatMap((p) => [p.latestVideoId, ...p.videos.map((v) => v.id)]));
const removed = await removedVideoIds([...allIds]);
const library = merged.map((playlist) => {
  const videos = playlist.videos.filter((v) => !removed.has(v.id));
  const latestVideoId = removed.has(playlist.latestVideoId) ? videos[0]?.id ?? playlist.latestVideoId : playlist.latestVideoId;
  return { ...playlist, latestVideoId, videos };
});
if (removed.size) console.log(`Left out ${removed.size} videos no longer on YouTube: ${[...removed].join(', ')}`);

writeLibraryFile(library);
for (const p of library) console.log(`${p.title}: ${p.videos.length} videos`);
console.log(`Wrote src/data/youtube-library.ts (${library.length} playlists)`);
