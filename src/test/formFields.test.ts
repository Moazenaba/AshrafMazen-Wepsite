import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A site file link is /api/r2?file=..., which an <input type="url"> rejects; the browser then refuses to submit the whole
// form without any message (REL-09). So there is no type="url" field anywhere in the admin; use type="text" inputMode="url".
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return path.endsWith('.tsx') && !path.endsWith('.test.tsx') ? [path] : [];
  });

describe('admin form fields', () => {
  it('has no type="url" field', () => {
    const offenders = [...files('src/components/admin'), ...files('src/pages/admin')].filter((file) => /type=["']url["']/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
