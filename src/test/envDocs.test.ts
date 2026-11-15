import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Every environment variable the code reads is documented in .env.example (an undocumented name is how a setting gets lost).
const IGNORED = new Set(['DEV', 'MODE', 'PROD', 'VERCEL_ENV', 'DISABLE_HMR', 'NODE_ENV', 'BASE_URL', 'SSR', 'CI', 'TEMP', 'GITHUB_ACTIONS']);

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'data' || name === 'node_modules' ? [] : files(path);
    return /\.(ts|tsx|js|mjs)$/.test(path) && !/\.test\./.test(path) ? [path] : [];
  });

describe('.env.example', () => {
  it('documents every variable the code uses', () => {
    const documented = new Set([...readFileSync('.env.example', 'utf8').matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]+)=/gm)].map((m) => m[1]));
    const used = new Map<string, string>();
    for (const file of [...files('api'), ...files('src'), ...files('scripts'), 'vite.config.ts']) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/(?:process\.env|import\.meta\.env)\.([A-Z][A-Z0-9_]+)/g)) used.set(m[1], file);
    }
    const missing = [...used].filter(([name]) => !IGNORED.has(name) && !documented.has(name)).map(([name, file]) => `${name} (${file})`);
    expect(missing).toEqual([]);
  });
});
