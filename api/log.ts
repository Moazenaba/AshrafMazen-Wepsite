// Vercel serverless function: a failure reported by a visitor's browser (page crash, failed upload, blocked request).
//   POST /api/log  { name, message, detail?, path? }   always answers 204, so a bot never learns it was refused
import { addressOf, createLimiter } from './_rateLimit.js'; // Node on Vercel needs the extension
import { logEvent } from './_log.js';

const allowed = createLimiter(20, 600_000);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('');
  try {
    if (allowed(addressOf(req))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const name = String(body.name || 'browser-error').slice(0, 100);
      const detail = body.detail && typeof body.detail === 'object' ? (body.detail as Record<string, unknown>) : {};
      await logEvent('error', name, String(body.message || ''), detail, { source: 'browser', path: String(body.path || '') });
    }
  } catch {
    // a malformed report is dropped
  }
  return res.status(204).send('');
}
