// Vercel serverless function: the site's files on Cloudflare R2.
//   POST { action: 'sign', kind, filename, size }   admin only: a signed link to upload one file straight to R2
//   POST { action: 'delete', url }                  admin only: removes a file the site uploaded
//   POST { action: 'status' }                       admin only: proves the keys work (writes and removes a tiny file)
//   GET  ?file=<key>                                anyone: the file, by a redirect to a signed link (the bucket stays private)
//   GET  ?file=<key>&download=1&name=<file name>    anyone: the same, downloaded under the book's title
// Until the R2 settings are present it answers 501, and the admin screens say that file uploads are not set up yet.
import { randomUUID } from 'node:crypto';
import { fileLink, isAdminToken, keyFromLink, presign, r2Config, type R2Config } from './_r2.js'; // Node on Vercel needs the extension (the .ts file is compiled to .js)

const KINDS = {
  pdf: { folder: 'library/files', extensions: ['pdf'], maxMb: 200, type: 'application/pdf' },
  cover: { folder: 'library/covers', extensions: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 5, type: '' },
  audio: { folder: 'audio', extensions: ['mp3', 'm4a', 'wav', 'ogg'], maxMb: 500, type: '' },
  logo: { folder: 'branding', extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 2, type: '' },
  // The home page's featured picture
  hero: { folder: 'branding/hero', extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 8, type: '' },
  // Videos the admin uploads to the site itself (R2 takes a single upload of up to 5 GB)
  video: { folder: 'media/video', extensions: ['mp4', 'webm', 'mov', 'm4v'], maxMb: 4000, type: '' },
} as const;

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};
const AUDIO_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg' };
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
  const kind = body?.kind as keyof typeof KINDS;
  const rules = KINDS[kind];
  if (!rules) return send(res, 400, { error: 'نوع الملف غير معروف.' });
  const extension = String(body?.filename || '').split('.').pop()?.toLowerCase() || '';
  if (!(rules.extensions as readonly string[]).includes(extension)) {
    return send(res, 400, { error: `صيغة الملف غير مدعومة. الصيغ المسموحة: ${rules.extensions.join('، ')}.` });
  }
  if (Number(body?.size) > rules.maxMb * 1024 * 1024) {
    return send(res, 400, { error: `حجم الملف أكبر من ${rules.maxMb} ميجابايت.` });
  }
  const key = `${rules.folder}/${randomUUID()}.${extension}`;
  const contentType = rules.type || IMAGE_TYPES[extension] || AUDIO_TYPES[extension] || VIDEO_TYPES[extension] || 'application/octet-stream';
  return send(res, 200, {
    uploadUrl: presign(cfg, 'PUT', key, 15 * 60),
    publicUrl: fileLink(cfg, key),
    contentType,
  });
}

async function remove(cfg: R2Config, body: any, res: any) {
  const key = keyFromLink(cfg, String(body?.url || ''));
  if (!key) return send(res, 400, { error: 'هذا الرابط ليس ملفاً مرفوعاً على الموقع.' });
  const response = await fetch(presign(cfg, 'DELETE', key, 60), { method: 'DELETE' });
  if (!response.ok && response.status !== 404) return send(res, 502, { error: 'تعذّر حذف الملف من التخزين.' });
  return send(res, 200, { deleted: key });
}

// Writes a tiny file and removes it, so the admin screen can say plainly whether storage works
async function status(cfg: R2Config, res: any) {
  const key = `setup-check/${randomUUID()}.txt`;
  let write = false;
  let remove = false;
  try {
    write = (await fetch(presign(cfg, 'PUT', key, 60), { method: 'PUT', body: 'ok', headers: { 'Content-Type': 'text/plain' } })).ok;
    remove = (await fetch(presign(cfg, 'DELETE', key, 60), { method: 'DELETE' })).ok;
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
  if (!/^(library\/(files|covers)|audio|branding|media\/video)\//.test(key) || key.includes('..')) return send(res, 400, { error: 'رابط ملف غير صالح.' });
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
    console.error('r2 function error:', err);
    return send(res, 500, { error: 'حدث خطأ في الخادم أثناء معالجة الملف.' });
  }
}
