// Keeps the saved channel library (src/data/youtube-library.ts) current: asks YouTube for every playlist's newest videos,
// adds the new ones (and any playlist made on the channel since), and leaves out videos YouTube no longer has.
// It is what makes a new upload reach the sitemap and the prerendered pages: those are built from the saved library.
// Run by .github/workflows/sync-youtube.yml every few minutes, which commits the file when it changed and so starts a deploy.
//
//   node scripts/refresh-youtube-library.mjs          writes the file
//   node scripts/refresh-youtube-library.mjs --dry    only says what it would change
//
// YouTube's RSS feeds answer 404 now, so the playlist pages are read (api/_youtubePage.ts, the same parser the site's
// api/youtube-library.ts uses at run time). If YouTube answers no playlist at all (blocked, or the page changed) the
// script fails loudly, so the workflow turns red instead of silently keeping an old library. It needs no npm packages.
import { parsePlaylists, parseVideos } from '../api/_youtubePage.ts';
import { readLibraryFile, writeLibraryFile } from './youtube-library-file.mjs';

const dry = process.argv.includes('--dry');
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36',
  'Accept-Language': 'ar,en;q=0.8',
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};

async function page(url) {
  try {
    const response = await fetch(url, { headers: HEADERS });
    return response.ok ? await response.text() : '';
  } catch {
    return '';
  }
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
let answered = 0;

// 1) New videos in the playlists we already have (newest first)
for (const playlist of library) {
  const found = parseVideos(await page(`https://www.youtube.com/playlist?list=${playlist.id}`));
  if (found.length === 0) continue;
  answered++;
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
  const videos = parseVideos(await page(`https://www.youtube.com/playlist?list=${p.id}`)).map((v) => ({ id: v.id, title: v.title, published: now }));
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

console.log(`${added.length} new, ${gone.size} removed.`);
added.forEach((line) => console.log(`  + ${line}`));
[...gone].forEach((id) => console.log(`  - ${id}`));
if (dry) console.log('--dry: nothing written.');
else console.log(writeLibraryFile(library) ? 'Library file updated.' : 'Library file unchanged.');
