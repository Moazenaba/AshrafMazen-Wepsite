// Records a failed site check in the site's own error log (it shows in the admin's "البيانات والتكامل" tab).
//   node scripts/report-monitor.mjs smoke.json      (smoke.json is the output of: smoke-test.mjs <url> --json)
// SITE_URL is the site's address. Never throws and never fails the workflow.
import { readFileSync } from 'node:fs';

export async function reportMonitor(file, site, fetcher = fetch) {
  try {
    const result = JSON.parse(readFileSync(file, 'utf8'));
    const failed = Array.isArray(result.failed) ? result.failed : [];
    const message = failed.length ? failed.join(' | ') : 'site check failed';
    await fetcher(`${site.replace(/\/+$/, '')}/api/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'monitor', message, path: '/' }),
    });
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1] && process.argv[1].endsWith('report-monitor.mjs')) {
  await reportMonitor(process.argv[2] || 'smoke.json', process.env.SITE_URL || 'https://ashraf-mazen.vercel.app');
}
