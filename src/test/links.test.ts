import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A link that opens a new tab must carry rel="noopener noreferrer" within 4 lines of it.
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'data' ? [] : files(path);
    return path.endsWith('.tsx') && !path.endsWith('.test.tsx') ? [path] : [];
  });

describe('links that open a new tab', () => {
  it('all have rel="noopener"', () => {
    const missing: string[] = [];
    for (const file of files('src')) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, i) => {
        if (!line.includes('target="_blank"')) return;
        const near = lines.slice(Math.max(0, i - 4), i + 5).join('\n');
        if (!near.includes('rel="noopener')) missing.push(`${file}:${i + 1}`);
      });
    }
    expect(missing).toEqual([]);
  });
});
