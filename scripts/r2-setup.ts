// One-time setup of the Cloudflare R2 bucket: lets the site's pages upload to it from the browser (CORS),
// then checks that a signed upload, a public read and a delete all work.
//   npx tsx scripts/r2-setup.ts
// Reads R2_* from .env.local. Extra site addresses can be added with R2_CORS_ORIGINS="https://a.com,https://b.com".
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { presign, r2Config, signedRequest } from '../api/_r2';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const cfg = r2Config();
if (!cfg) {
  console.error('Missing R2 settings. Put R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and VITE_R2_PUBLIC_URL in .env.local.');
  process.exit(1);
}

// The live domain first: uploads fail when the bucket's CORS list does not name it
const origins = [
  'https://ashraf-mazen.vercel.app',
  'https://ashraf-mazen-wepsite.vercel.app',
  'https://ashrafmazenwepsite.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  ...(process.env.R2_CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
  <CORSRule>
${origins.map((o) => `    <AllowedOrigin>${o}</AllowedOrigin>`).join('\n')}
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
    <ExposeHeader>ETag</ExposeHeader>
    <MaxAgeSeconds>3600</MaxAgeSeconds>
  </CORSRule>
</CORSConfiguration>`;

const md5 = createHash('md5').update(xml).digest('base64');
const cors = await signedRequest(cfg, 'PUT', 'cors=', xml, { 'content-type': 'application/xml', 'content-md5': md5 });
console.log(`CORS for ${origins.length} origins:`, cors.status, cors.ok ? 'ok' : await cors.text());

// A round trip with a small test file, removed at the end
const key = `setup-check/${Date.now()}.txt`;
const put = await fetch(presign(cfg, 'PUT', key, 120), { method: 'PUT', body: 'ok', headers: { 'Content-Type': 'text/plain' } });
console.log('signed upload:', put.status);
const read = cfg.publicUrl ? await fetch(`${cfg.publicUrl}/${key}`) : { status: 'skipped (private bucket)', ok: true };
console.log('public read:', read.status, read.ok ? '' : `(is public access enabled for ${cfg.publicUrl}?)`);
const del = await fetch(presign(cfg, 'DELETE', key, 120), { method: 'DELETE' });
console.log('delete:', del.status);
process.exit(cors.ok && put.ok && read.ok && del.ok ? 0 : 1);
