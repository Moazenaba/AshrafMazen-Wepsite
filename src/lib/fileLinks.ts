// Turns the site's own file link (/api/r2?file=<key>) into the bucket's public address when the site has one
// (VITE_R2_PUBLIC_URL, e.g. https://pub-xxxx.r2.dev or a custom domain). The file then loads straight from Cloudflare,
// with no request to the site at all (each such request was a "302" in the Vercel logs).
// Library PDFs keep the site link: the book viewer and the download under the book's title go through /api/r2.
// Without a public address nothing changes.

const FILE_LINK = /^(?:https?:\/\/[^/]+)?\/api\/r2\?(?:.*&)?file=([^&]+)/;

export function toPublicFileUrl<T extends string | null | undefined>(url: T, base: string): T | string {
  if (!url || !base) return url;
  const match = url.match(FILE_LINK);
  if (!match) return url;
  let key: string;
  try {
    key = decodeURIComponent(match[1]);
  } catch {
    return url;
  }
  if (!key || key.includes('..') || key.startsWith('library/files/')) return url;
  return `${base.replace(/\/+$/, '')}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

const PUBLIC_FILES = String(import.meta.env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');

// For any picture or sound shown on the site
export const fileSrc = <T extends string | null | undefined>(url: T): T | string => toPublicFileUrl(url, PUBLIC_FILES);
