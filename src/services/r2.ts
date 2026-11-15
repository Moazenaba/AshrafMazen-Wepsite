import { supabase } from '../lib/supabase';
import { timedFetch } from '../lib/timedFetch';
import { reportError } from '../lib/reportError';

// The site's files (recordings, books, covers, the logo) live on Cloudflare R2 and nowhere else.
// The keys stay on the server (api/r2.ts); the browser only ever gets a short-lived signed link.

// The bucket's public address, if it has one (r2.dev or a custom domain). Without it the bucket stays private
// and the site serves files itself through /api/r2?file=<key>.
export const R2_PUBLIC_URL = String(import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

const ENDPOINT = '/api/r2';

export type R2Kind = 'pdf' | 'cover' | 'audio' | 'logo' | 'hero' | 'video';

async function adminToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('انتهت جلسة الدخول. سجّل الدخول مرة أخرى ثم أعد المحاولة.');
  return token;
}

// Uploads a file straight from the browser to R2 through a short-lived signed link from the server,
// and returns the link the site stores for it. Every failure says what to do about it.
export async function uploadToR2(file: File, kind: R2Kind, onProgress?: (fraction: number) => void): Promise<string> {
  let response: Response;
  try {
    response = await timedFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminToken()}` },
      body: JSON.stringify({ action: 'sign', kind, filename: file.name, size: file.size }),
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('انتهت')) throw err;
    throw new Error('تعذّر الاتصال بخادم الموقع لتجهيز الرفع.');
  }
  // 501: the server has no R2 settings; 404: there is no server function here (a plain static preview)
  if (response.status === 501 || response.status === 404) {
    throw new Error('تخزين الملفات غير مُفعّل على هذا الخادم بعد. أضف إعدادات Cloudflare R2 (R2_ACCOUNT_ID وR2_BUCKET وR2_ACCESS_KEY_ID وR2_SECRET_ACCESS_KEY) في متغيرات البيئة.');
  }
  const signed = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(signed.error || 'تعذّر تجهيز رفع الملف.');

  await new Promise<void>((resolve, reject) => {
    // XMLHttpRequest rather than fetch, for the upload progress of large recordings and books
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signed.uploadUrl);
    xhr.setRequestHeader('Content-Type', signed.contentType || file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      const err = new Error(`رفض التخزين الملف (${xhr.status}).`);
      reportError('upload-failed', err, { kind, status: xhr.status });
      reject(err);
    };
    // What a browser reports when the bucket has no CORS rule for this site
    xhr.onerror = () => {
      const err = new Error('منع المتصفح الرفع إلى Cloudflare R2. أضف عنوان الموقع إلى قواعد CORS للحاوية (R2 ← الحاوية ← Settings ← CORS Policy).');
      reportError('upload-failed', err, { kind, blocked: true });
      reject(err);
    };
    xhr.send(file);
  });
  return signed.publicUrl as string;
}

// The site's own link to a file in the private bucket: /api/r2?file=<key>
const FILE_LINK = /^(?:https?:\/\/[^/]+)?\/api\/r2\?(?:.*&)?file=([^&]+)/;

// Whether a stored link points at a file kept on R2 (by the bucket's public address or the site's file link)
export const isR2Url = (url: string | null | undefined) =>
  !!url && ((!!R2_PUBLIC_URL && url.startsWith(`${R2_PUBLIC_URL}/`)) || FILE_LINK.test(url));

// Removes a file the site uploaded to R2; failures are logged, not thrown, so a delete in the admin never sticks
export async function deleteFromR2(url: string): Promise<void> {
  try {
    const response = await timedFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await adminToken()}` },
      body: JSON.stringify({ action: 'delete', url }),
    });
    if (!response.ok) console.error('R2 delete failed:', response.status, await response.text());
  } catch (err) {
    console.error('R2 delete failed:', err);
  }
}

// A link that downloads a library PDF from R2 under the book's title
export function r2DownloadUrl(url: string, name: string): string {
  const match = url.match(FILE_LINK);
  const key = match ? decodeURIComponent(match[1]) : decodeURIComponent(url.slice(R2_PUBLIC_URL.length + 1).split('?')[0]);
  return `${ENDPOINT}?file=${encodeURIComponent(key)}&download=1&name=${encodeURIComponent(name)}`;
}
