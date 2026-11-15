// Vercel serverless function: the site's files on Cloudflare R2.
//   POST { action: 'sign', kind, filename, size }   admin only: a signed link to upload one file straight to R2
//   POST { action: 'delete', url }                  admin only: removes a file the site uploaded
//   POST { action: 'status' }                       admin only: proves the keys work (writes and removes a tiny file)
//   GET  ?file=<key>                                anyone: the file, by a redirect to a signed link (the bucket stays private)
//   GET  ?file=<key>&download=1&name=<file name>    anyone: the same, downloaded under the book's title
// Until the R2 settings are present it answers 501, and the admin screens say that file uploads are not set up yet.
import { randomUUID } from 'node:crypto';
import { fileLink, isAdminToken, keyFromLink, presign, r2Config, type R2Config } from './_r2.js'; // Node on Vercel needs the extension (the .ts file is compiled to .js)
import { FILE_RULES } from '../src/constants/fileRules.js'; // the one list of what may be uploaded
import { fetchWithTimeout } from './_fetch.js'; // Node on Vercel needs the extension
import { logEvent } from './_log.js'; // Node on Vercel needs the extension

// The folders of the site's own files. Admin deletes may touch these (and the status check's folder), visitors may read PUBLIC_FOLDERS
export const SITE_FOLDERS = /^(library\/(files|covers)|audio|branding|media\/video|setup-check)\//;
const PUBLIC_FOLDERS = /^(library\/(files|covers)|audio|branding|media\/video)\//;
const isSiteKey = (key: string) => SITE_FOLDERS.test(key) && !key.includes('..');

const KINDS = FILE_RULES as Record<string, { folder: string; extensions: string[]; maxMb: number; type: string }>;

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};
const AUDIO_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', opus: 'audio/ogg' };
const VIDEO_TYPES: Record<string, string> = { mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

const send = (res: any, status: number, body: unknown) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
};

function bearer(req: any): string | undefined {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

async function sign(cfg: R2Config, body: any, res: any) {
  const kind = String(body?.kind);
  const rules = KINDS[kind];
  if (!rules) return send(res, 400, { error: 'نوع الملف غير معروف.' });
  const extension = String(body?.filename || '').split('.').pop()?.toLowerCase() || '';
  if (!rules.extensions.includes(extension)) {
    return send(res, 400, { error: `صيغة الملف غير مدعومة. الصيغ المسموحة: ${rules.extensions.join('، ')}.` });
  }
  if (Number(body?.size) > rules.maxMb * 1024 * 1024) {
    return send(res, 400, { error: `حجم الملف أكبر من ${rules.maxMb} ميجابايت.` });
  }
  const size = Number(body?.size) > 0 ? Number(body.size) : undefined;
  const key = `${rules.folder}/${randomUUID()}.${extension}`;
  const contentType = rules.type || IMAGE_TYPES[extension] || AUDIO_TYPES[extension] || VIDEO_TYPES[extension] || 'application/octet-stream';
  return send(res, 200, {
    uploadUrl: presign(cfg, 'PUT', key, 15 * 60, {}, size),
    publicUrl: fileLink(cfg, key),
    contentType,
    contentLength: size,
  });
}

async function remove(cfg: R2Config, body: any, res: any) {
  const key = keyFromLink(cfg, String(body?.url || ''));
  if (!key || !isSiteKey(key)) return send(res, 400, { error: 'هذا الرابط ليس ملفاً مرفوعاً على الموقع.' });
  const response = await fetchWithTimeout(presign(cfg, 'DELETE', key, 60), { method: 'DELETE' }, 10000);
  if (!response.ok && response.status !== 404) return send(res, 502, { error: 'تعذّر حذف الملف من التخزين.' });
  return send(res, 200, { deleted: key });
}

// Writes a tiny file and removes it, so the admin screen can say plainly whether storage works
async function status(cfg: R2Config, res: any) {
  const key = `setup-check/${randomUUID()}.txt`;
  let write = false;
  let remove = false;
  try {
    write = (await fetchWithTimeout(presign(cfg, 'PUT', key, 60), { method: 'PUT', body: 'ok', headers: { 'Content-Type': 'text/plain' } }, 10000)).ok;
    remove = (await fetchWithTimeout(presign(cfg, 'DELETE', key, 60), { method: 'DELETE' }, 10000)).ok;
  } catch {
    // reported below as false
  }
  return send(res, 200, { configured: true, bucket: cfg.bucket, publicAddress: !!cfg.publicUrl, write, remove });
}

// Signed links last a day, so a long recording keeps playing and seeking; the redirect itself is cached an hour
const LINK_SECONDS = 24 * 60 * 60;

function serveFile(cfg: R2Config, req: any, res: any) {
  const key = String(req.query?.file || '');
  // Only the site's own uploads, so this cannot be used to read anything else in the bucket
  if (!PUBLIC_FOLDERS.test(key) || key.includes('..')) return send(res, 400, { error: 'رابط ملف غير صالح.' });
  // With a public address (R2_PUBLIC_URL) every file but a library PDF is sent there for good: the browser remembers
  // this permanent redirect for a year (each upload has its own unique name) and never asks the site again for it.
  // PDFs stay here: the book viewer and the download under the book's title need this function.
  if (cfg.publicUrl && !req.query?.download && !key.startsWith('library/files/')) {
    res.statusCode = 308;
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Location', fileLink(cfg, key));
    return res.end();
  }
  const extra: Record<string, string> = {};
  if (req.query?.download) {
    // The file keeps its own extension, so a recording or a video downloads as such and not as a PDF
    const ext = (key.split('.').pop() || 'pdf').toLowerCase();
    let name = String(req.query?.name || '').replace(/[\\/:*?"<>|\r\n]+/g, ' ').trim() || 'file';
    if (!name.toLowerCase().endsWith(`.${ext}`)) name = `${name}.${ext}`;
    extra['response-content-disposition'] = `attachment; filename="file.${ext}"; filename*=UTF-8''${encodeURIComponent(name)}`;
  }
  // The redirect is the same for everyone and the files are the site's own public ones (the folder check above), so
  // the CDN keeps it for an hour: a picture on the home page no longer calls this function for every visitor.
  // (A replaced file has a new name, so nothing stale is shown.)
  res.setHeader('Cache-Control', req.query?.download ? 'no-store' : 'public, max-age=3600, s-maxage=3600');
  res.statusCode = 302;
  res.setHeader('Location', presign(cfg, 'GET', key, LINK_SECONDS, extra));
  res.end();
}

export default async function handler(req: any, res: any) {
  const cfg = r2Config();
  if (!cfg) return send(res, 501, { error: 'not-configured' });

  try {
    if (req.method === 'GET' && req.query?.file) return serveFile(cfg, req, res);
    if (req.method !== 'POST') return send(res, 405, { error: 'method-not-allowed' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    if (!(await isAdminToken(bearer(req)))) return send(res, 403, { error: 'هذه العملية للإدارة فقط. سجّل الدخول مرة أخرى.' });

    if (body.action === 'status') return status(cfg, res);
    if (body.action === 'sign') return sign(cfg, body, res);
    if (body.action === 'delete') return remove(cfg, body, res);
    return send(res, 400, { error: 'unknown-action' });
  } catch (err) {
    await logEvent('error', 'r2', 'function error', { reason: err instanceof Error ? err.message : String(err) });
    return send(res, 500, { error: 'حدث خطأ في الخادم أثناء معالجة الملف.' });
  }
}
