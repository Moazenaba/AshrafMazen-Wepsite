// A short fingerprint of which lessons are published and when. The build writes it to dist/content-hash.txt;
// scripts/check-content-changed.mjs compares it with the same fingerprint of the live /api/site answer.
// Only the newest 300 are used, because /api/site is capped at 300 lessons.
import { createHash } from 'node:crypto';

export function contentHash(lessons) {
  const lines = [...lessons]
    .sort((a, b) => String(b.published_at ?? '').localeCompare(String(a.published_at ?? '')) || String(a.id).localeCompare(String(b.id)))
    .slice(0, 300)
    .map((l) => `${l.id}:${l.published_at ?? ''}`);
  return createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
}
