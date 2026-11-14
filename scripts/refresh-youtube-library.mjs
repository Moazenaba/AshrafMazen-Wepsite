// Keeps the saved channel library (src/data/youtube-library.ts) the same as the channel on YouTube:
//   - every playlist is read in full (a long one comes 100 videos a page) and in Arabic,
//   - new videos are added, and any playlist made on the channel since,
//   - a title the Sheikh changed on YouTube is changed here too (Arabic, as on YouTube),
//   - videos YouTube no longer has are left out.
// It is what makes a new upload reach the sitemap and the prerendered pages: those are built from the saved library.
// Run by .github/workflows/sync-youtube.yml every 30 minutes, which commits the file when it changed and so starts a deploy.
//
//   node scripts/refresh-youtube-library.mjs          writes the file
//   node scripts/refresh-youtube-library.mjs --dry    only says what it would change
//
// Every page is asked for in Arabic (hl=ar): GitHub's servers are in the USA, and there YouTube sends its automatic
// English translation of the titles, which is how English titles once reached the site. YouTube's RSS feeds are not used
// (they answer 403/404 most of the time). If YouTube answers no playlist at all (blocked, or the page changed) the script
// fails loudly, so the workflow turns red instead of silently keeping an old library. It needs no npm packages.
import { continuationIn, innertubeOf, pageData, parsePlaylists, videosIn, withArabic, YOUTUBE_HEADERS } from '../api/_youtubePage.ts';
import { readLibraryFile, writeLibraryFile } from './youtube-library-file.mjs';

const dry = process.argv.includes('--dry');
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
const MAX_PAGES = 30;

async function page(url) {
  try {
    const response = await fetch(withArabic(url), { headers: YOUTUBE_HEADERS });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
}

// All the videos of a playlist, in YouTube's order: the first page, then each next page YouTube offers
async function playlistVideos(id) {
  const html = await page(`https://www.youtube.com/playlist?list=${id}`);
  const first = pageData(html);
  const videos = videosIn(first);
  const client = innertubeOf(html);
  let token = continuationIn(first);
  for (let n = 1; token && client && n < MAX_PAGES; n++) {
    try {
      const response = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${client.key}&prettyPrint=false`, {
        method: 'POST',
        headers: { ...YOUTUBE_HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: client.version, hl: 'ar', gl: 'EG' } }, continuation: token }),
      });
      if (!response.ok) break;
      const next = await response.json();
      videos.push(...videosIn(next));
      token = continuationIn(next);
    } catch {
      break;
    }
  }
  const seen = new Set();
  return videos.filter((v) => !seen.has(v.id) && seen.add(v.id));
}

// "136 فيديو" + 2 -> "138 فيديو"; "فيديو واحد" + 1 -> "2 فيديو"
function bumpCount(count, added) {
  if (/\d+/.test(count)) return count.replace(/\d+/, (n) => String(Number(n) + added));
  return `${1 + added} فيديو`;
}

// Only a definite 404 on the thumbnail means the video is gone (deleted or private); a network failure keeps it
async function goneIds(ids) {
  const gone = new Set();
  const queue = [...ids];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      try {
        if ((await fetch(`https://i.ytimg.com/vi/${id}/mqdefault.jpg`, { method: 'HEAD' })).status === 404) gone.add(id);
      } catch {
        // kept
      }
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  return gone;
}

const library = readLibraryFile();
const now = new Date().toISOString();
const added = [];
const renamed = [];
let answered = 0;

// 1) Each saved playlist against YouTube: new videos (to the top, newest first) and changed titles
for (const playlist of library) {
  const found = await playlistVideos(playlist.id);
  if (found.length === 0) continue;
  answered++;
  const onYoutube = new Map(found.map((v) => [v.id, v.title]));
  for (const video of playlist.videos) {
    const title = onYoutube.get(video.id);
    if (title && title !== video.title) {
      renamed.push(`${playlist.title}: ${video.title}  ->  ${title}`);
      video.title = title;
    }
  }
  const known = new Set(playlist.videos.map((v) => v.id));
  const fresh = found.filter((v) => !known.has(v.id)).map((v) => ({ id: v.id, title: v.title, published: now }));
  if (fresh.length === 0) continue;
  playlist.videos = [...fresh, ...playlist.videos];
  playlist.count = bumpCount(playlist.count, fresh.length);
  playlist.latestVideoId = fresh[0].id;
  added.push(...fresh.map((v) => `${playlist.title}: ${v.title}`));
}

if (answered === 0) {
  console.error('YouTube answered no playlist page (blocked, or the page changed). The library was not touched.');
  process.exit(1);
}

// 2) Playlists made on the channel since the saved library was built
const knownPlaylists = new Set(library.map((p) => p.id));
const discovered = parsePlaylists(await page(`https://www.youtube.com/channel/${CHANNEL_ID}/playlists`)).filter((p) => !knownPlaylists.has(p.id));
for (const p of discovered.slice(0, 30)) {
  const videos = (await playlistVideos(p.id)).map((v) => ({ id: v.id, title: v.title, published: now }));
  if (videos.length === 0) continue;
  library.push({ id: p.id, title: p.title, count: `${videos.length} فيديو`, latestVideoId: videos[0].id, videos });
  added.push(`New playlist: ${p.title} (${videos.length} videos)`);
}

// 3) Videos YouTube no longer has (the ones just added are not checked: a new upload's picture may not be ready)
const newIds = new Set(library.flatMap((p) => p.videos.filter((v) => v.published === now).map((v) => v.id)));
const gone = await goneIds(library.flatMap((p) => p.videos.map((v) => v.id)).filter((id) => !newIds.has(id)));
if (gone.size) {
  for (const p of library) {
    p.videos = p.videos.filter((v) => !gone.has(v.id));
    if (gone.has(p.latestVideoId) && p.videos[0]) p.latestVideoId = p.videos[0].id;
  }
}

console.log(`${added.length} new, ${renamed.length} renamed, ${gone.size} removed.`);
added.forEach((line) => console.log(`  + ${line}`));
renamed.forEach((line) => console.log(`  ~ ${line}`));
[...gone].forEach((id) => console.log(`  - ${id}`));
if (dry) console.log('--dry: nothing written.');
else console.log(writeLibraryFile(library) ? 'Library file updated.' : 'Library file unchanged.');
