import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { BUDGET_BYTES, checkBundle } from './check-bundle-size.mjs';

// A fake dist folder whose entry script is `size` incompressible bytes
function fakeDist(size) {
  const dist = mkdtempSync(join(tmpdir(), 'dist-'));
  mkdirSync(join(dist, 'assets'));
  writeFileSync(join(dist, 'app.html'), '<html><script type="module" src="/assets/index-x.js"></script></html>');
  writeFileSync(join(dist, 'assets', 'index-x.js'), randomBytes(size));
  return dist;
}

describe('checkBundle', () => {
  it('passes under the budget', () => {
    expect(checkBundle(fakeDist(1000)).ok).toBe(true);
  });

  it('fails over the budget', () => {
    const result = checkBundle(fakeDist(BUDGET_BYTES + 5000));
    expect(result.ok).toBe(false);
    expect(result.bytes).toBeGreaterThan(BUDGET_BYTES);
  });
});
