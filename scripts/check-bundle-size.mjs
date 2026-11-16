// Fails the build when the entry script (what every visitor downloads first) gets heavier than the budget.
//   node scripts/check-bundle-size.mjs [dist-folder]
// Budget: the gzip size measured on 2026-11-15 (44375 bytes) plus 10%. Raise it on purpose, in a commit that says why.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

export const MEASURED_BYTES = 44375; // 2026-11-15
export const BUDGET_BYTES = Math.round(MEASURED_BYTES * 1.1);

// { ok, bytes, budget, file } for the entry script named in <dist>/app.html
export function checkBundle(dist = 'dist') {
  const html = readFileSync(resolve(dist, 'app.html'), 'utf8');
  const file = html.match(/<script[^>]*\ssrc="\/([^"]+\.js)"/)?.[1];
  if (!file) throw new Error('no entry script in app.html');
  const bytes = gzipSync(readFileSync(resolve(dist, file))).length;
  return { ok: bytes <= BUDGET_BYTES, bytes, budget: BUDGET_BYTES, file };
}

if (process.argv[1] && process.argv[1].endsWith('check-bundle-size.mjs')) {
  const result = checkBundle(process.argv[2]);
  console.log(`${result.ok ? 'OK' : 'FAIL'}  entry script ${result.file}: ${result.bytes} bytes gzip (budget ${result.budget})`);
  process.exit(result.ok ? 0 : 1);
}
