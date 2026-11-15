import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The list of allowed upload extensions lives in src/constants/fileRules.js only. A second hand-written list drifts
// (the logo screen once promised SVG that the server refused).
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'data' ? [] : files(path);
    return /\.(ts|tsx|js|mjs)$/.test(path) && !/\.test\./.test(path) && !path.endsWith('fileRules.js') && !path.endsWith('fileRules.d.ts') ? [path] : [];
  });

describe('file rules have a single source', () => {
  it('no other file hand-writes an extension list', () => {
    const offenders = [...files('src'), ...files('api')].filter((file) => /['"](mp3|m4a|webp|jpeg)['"]\s*,\s*['"]/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
