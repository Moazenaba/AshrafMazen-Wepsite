// Vercel serverless function: the browser's Content-Security-Policy violation reports (a blocked script, picture, request).
//   POST /api/csp-report   the legacy `csp-report` object, or the Reporting API array. Always answers 204.
import { addressOf, createLimiter } from './_rateLimit.js'; // Node on Vercel needs the extension
import { logEvent } from './_log.js';

const allowed = createLimiter(20, 600_000);

// Both report shapes as { directive, blocked, page }
export function readReports(body: any): { directive: string; blocked: string; page: string }[] {
  const items = Array.isArray(body) ? body.map((r) => r?.body) : [body?.['csp-report']];
  return items
    .filter(Boolean)
    .map((r: any) => ({
      directive: String(r['violated-directive'] ?? r.effectiveDirective ?? r['effective-directive'] ?? ''),
      blocked: String(r['blocked-uri'] ?? r.blockedURL ?? ''),
      page: String(r['document-uri'] ?? r.documentURL ?? ''),
    }));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('');
  try {
    if (allowed(addressOf(req))) {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      for (const report of readReports(body).slice(0, 5)) {
        await logEvent('error', 'csp-violation', `${report.directive} ${report.blocked}`, {}, { source: 'csp', path: report.page });
      }
    }
  } catch {
    // a malformed report is dropped
  }
  return res.status(204).send('');
}
