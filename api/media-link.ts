// Vercel serverless function: a download link for one of the channel's videos, as sound or as video.
//   GET /api/media-link?id=<videoId>&kind=audio|video|listen   (listen: the original sound, to play on the site)  ->  { url, filename, attachment, provider }
// It asks the outside services in api/_providers.ts one after another and checks that the link really gives a file;
// the first that works is returned. The file itself goes from that service straight to the visitor, never through
// this server or R2. Only videos of the sheikh's channel are accepted, so this is not a downloader for any video.
import {
  cobaltRequest,
  invidiousRequest,
  isChannelVideo,
  parseCobalt,
  parseInvidious,
  parsePiped,
  pipedRequest,
  providersFrom,
  type MediaKind,
  type MediaLink,
  type Provider,
} from './_providers.js'; // Node on Vercel needs the extension
import { YOUTUBE_LIBRARY } from '../src/data/youtube-library.js';

const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || 'Ashrafmazen';
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCisGvsFtKyDU6NTFywaITzQ';
const STEP_MS = 9000;
// A cobalt video can take 20 s or more to answer; the function may run 60 s (vercel.json)
const COBALT_MS = 45000;
// A second ask to cobalt only while there is time left for it to answer (the function may run 60 s)
const RETRY_UNTIL_MS = 25000;
// Videos already checked to be the channel's
// The site's saved library counts as the channel's (also when YouTube's oEmbed cannot be reached)
const channelVideos = new Set<string>(YOUTUBE_LIBRARY.flatMap((p) => p.videos.map((v) => v.id)));

async function timed(url: string, init: RequestInit = {}, ms = STEP_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function json(url: string, init?: RequestInit, ms = STEP_MS): Promise<any> {
  const response = await timed(url, init, ms);
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${response.status}: ${text.replace(/\s+/g, ' ').slice(0, 80)}`);
  }
}

// Why a service gave no link, kept short, for the error answer (helps tell a blocked service from a slow one)
function reason(data: any): string {
  return String(data?.error?.code ?? data?.error ?? data?.status ?? 'no link').slice(0, 80);
}

// The link must really start giving the file: the first bytes of its body are waited for, then the request is dropped.
// A link that answers 200 and then sends nothing (a cobalt tunnel YouTube cut off, an expired link) would save as a
// 0 KB file, so headers alone are not enough.
async function works(link: MediaLink, ms: number): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(link.url, { headers: { Range: 'bytes=0-1023' }, signal: controller.signal, redirect: 'follow' });
    const type = response.headers.get('content-type') || '';
    if (!(response.status === 200 || response.status === 206) || type.startsWith('text/') || type.includes('json')) return false;
    if (response.headers.get('content-length') === '0' || !response.body) return false;
    const reader = response.body.getReader();
    // Some bytes must arrive (empty chunks are skipped); the stream ending first means an empty file
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return false;
      if (value && value.byteLength > 0) return true;
    }
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

async function ask(p: Provider, id: string, kind: MediaKind): Promise<{ link: MediaLink | null; why: string }> {
  let data: any;
  let link: MediaLink | null;
  if (p.type === 'cobalt') {
    const req = cobaltRequest(p, id, kind);
    // cobalt prepares the file before it answers (an MP3 can take several seconds), so it gets longer
    data = await json(req.url, req.init, COBALT_MS);
    link = parseCobalt(data);
  } else if (p.type === 'invidious') {
    data = await json(invidiousRequest(p, id));
    link = parseInvidious(p, data, kind);
  } else {
    data = await json(pipedRequest(p, id));
    link = parsePiped(data, kind);
  }
  return { link, why: link ? '' : reason(data) };
}

async function belongsToChannel(id: string): Promise<boolean> {
  if (channelVideos.has(id)) return true;
  try {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}`;
    const ok = isChannelVideo(await json(url), CHANNEL_HANDLE, CHANNEL_ID);
    if (ok) channelVideos.add(id);
    return ok;
  } catch {
    return false;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const id = String(req.query?.id || '');
  const kind: MediaKind = req.query?.kind === 'video' ? 'video' : req.query?.kind === 'listen' ? 'listen' : 'audio';
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return res.status(400).send(JSON.stringify({ error: 'رابط فيديو غير صالح.' }));
  if (!(await belongsToChannel(id))) return res.status(403).send(JSON.stringify({ error: 'التحميل متاح لفيديوهات قناة الشيخ فقط.' }));

  // All services are asked at once and the first working link wins. One after another, a slow cobalt video
  // (it can take over 16 s to answer) used up the time and the visitor got "no service answers".
  const started = Date.now();
  const tried: { service: string; why: string }[] = [];
  const attempt = async (p: Provider): Promise<MediaLink & { provider: string }> => {
    const service = new URL(p.base).host;
    // cobalt is asked a second time when its link turned out empty: the next answer often comes from another server
    const rounds = p.type === 'cobalt' ? 2 : 1;
    try {
      for (let round = 0; round < rounds; round++) {
        const { link, why } = await ask(p, id, kind);
        if (!link) {
          tried.push({ service, why });
          break;
        }
        // Every link is checked to send real bytes before it is handed out: a cobalt link can answer 200 and then
        // send nothing (its server could not get the video), which saved as a 0 KB file. The first bytes come in
        // 2-6 s; a link that gives none makes the server ask cobalt once more, which often answers from another server.
        if (await works(link, STEP_MS)) return { ...link, provider: p.type };
        tried.push({ service, why: 'link gave no file' });
        if (Date.now() - started > RETRY_UNTIL_MS) break;
      }
    } catch (err: any) {
      tried.push({ service, why: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err).slice(0, 100) });
    }
    throw new Error(service);
  };

  try {
    const link = await Promise.any(providersFrom(process.env).map(attempt));
    console.log(`media-link ok ${id} ${kind} via ${link.provider} ${new URL(link.url).host} in ${Date.now() - started} ms`);
    return res.status(200).send(JSON.stringify(link));
  } catch {
    // Written to the Vercel logs, so a failure can be read there (which service, and why)
    console.warn(`media-link failed ${id} ${kind} after ${Date.now() - started} ms: ${JSON.stringify(tried)}`);
    return res.status(502).send(JSON.stringify({ error: 'خدمات التحميل لا تستجيب الآن. حاول بعد قليل.', tried }));
  }
}
