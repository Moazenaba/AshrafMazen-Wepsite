// Cloudflare R2, spoken to through its S3-compatible API with AWS Signature V4.
// Files starting with "_" in api/ are helpers, not endpoints. Everything secret stays on the server:
// the browser only ever receives a signed link that works for one file for a few minutes.
import { createHash, createHmac } from 'node:crypto';

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  // Where visitors read the files: the bucket's r2.dev address or custom domain, no trailing slash.
  // Empty when the bucket is private: files are then served through /api/r2?file=<key>
  publicUrl: string;
}

export function r2Config(): R2Config | null {
  const env = process.env;
  const accountId = env.R2_ACCOUNT_ID || '';
  const accessKeyId = env.R2_ACCESS_KEY_ID || '';
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || '';
  const bucket = env.R2_BUCKET || '';
  const publicUrl = (env.R2_PUBLIC_URL || env.VITE_R2_PUBLIC_URL || '').replace(/\/+$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket, publicUrl };
}

const sha256 = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const hmac = (key: string | Buffer, data: string) => createHmac('sha256', key).update(data).digest();

// RFC 3986 encoding, as SigV4 requires (encodeURIComponent leaves !'()* alone)
const encode = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
const encodePath = (key: string) => key.split('/').map(encode).join('/');

function signingKey(cfg: R2Config, date: string) {
  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, date);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  return hmac(kService, 'aws4_request');
}

function stamp(now = new Date()) {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return { amzDate, date: amzDate.slice(0, 8) };
}

const hostOf = (cfg: R2Config) => `${cfg.accountId}.r2.cloudflarestorage.com`;

// A link that performs one request (PUT to upload, GET to read, DELETE) without credentials, for `expires` seconds
export function presign(
  cfg: R2Config,
  method: 'GET' | 'PUT' | 'DELETE',
  key: string,
  expires = 900,
  extraQuery: Record<string, string> = {}
): string {
  const { amzDate, date } = stamp();
  const host = hostOf(cfg);
  const scope = `${date}/auto/s3/aws4_request`;
  const path = `/${cfg.bucket}/${encodePath(key)}`;
  const query: Record<string, string> = {
    ...extraQuery,
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${cfg.accessKeyId}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expires),
    'X-Amz-SignedHeaders': 'host',
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encode(k)}=${encode(query[k])}`)
    .join('&');
  const canonicalRequest = [method, path, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signature = createHmac('sha256', signingKey(cfg, date)).update(toSign).digest('hex');
  return `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

// A request signed in its headers, for bucket settings such as CORS (used by scripts/r2-setup.ts)
export async function signedRequest(
  cfg: R2Config,
  method: string,
  query: string,
  body = '',
  headers: Record<string, string> = {}
): Promise<Response> {
  const { amzDate, date } = stamp();
  const host = hostOf(cfg);
  const scope = `${date}/auto/s3/aws4_request`;
  const path = `/${cfg.bucket}`;
  const payloadHash = sha256(body);
  const all: Record<string, string> = { ...headers, host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate };
  const names = Object.keys(all).map((n) => n.toLowerCase()).sort();
  const lower = Object.fromEntries(Object.entries(all).map(([k, v]) => [k.toLowerCase(), v.trim()]));
  const canonicalHeaders = names.map((n) => `${n}:${lower[n]}\n`).join('');
  const signedHeaders = names.join(';');
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signature = createHmac('sha256', signingKey(cfg, date)).update(toSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const { host: _host, ...sendHeaders } = all;
  void _host;
  return fetch(`https://${host}${path}?${query}`, { method, headers: { ...sendHeaders, Authorization: authorization }, body: body || undefined });
}

// The site's link to a file: the bucket's public address when it has one, otherwise the site's own
// endpoint, which answers with a short-lived signed link (so the bucket can stay private)
export function fileLink(cfg: R2Config, key: string): string {
  return cfg.publicUrl ? `${cfg.publicUrl}/${key}` : `/api/r2?file=${encodeURIComponent(key)}`;
}

// The object key of a file in this bucket, from either kind of link; null for any other link
export function keyFromLink(cfg: R2Config, url: string): string | null {
  if (cfg.publicUrl && url.startsWith(`${cfg.publicUrl}/`)) return decodeURIComponent(url.slice(cfg.publicUrl.length + 1).split('?')[0]);
  const match = url.match(/^(?:https?:\/\/[^/]+)?\/api\/r2\?(?:.*&)?file=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Whether the bearer of this Supabase session is one of the site's admins (listed in public.admins)
export async function isAdminToken(token: string | undefined): Promise<boolean> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anon = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!token || !url || !anon) return false;
  const headers = { apikey: anon, Authorization: `Bearer ${token}` };
  const userRes = await fetch(`${url}/auth/v1/user`, { headers });
  if (!userRes.ok) return false;
  const user = (await userRes.json()) as { id?: string };
  if (!user.id) return false;
  const adminRes = await fetch(`${url}/rest/v1/admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}`, { headers });
  if (!adminRes.ok) return false;
  const rows = (await adminRes.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}
