import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './r2';
import { fakeReq, fakeRes, json, type FakeRes } from './_testing';

const SETTINGS = { R2_ACCOUNT_ID: 'a'.repeat(32), R2_BUCKET: 'site-bucket', R2_ACCESS_KEY_ID: 'k'.repeat(32), R2_SECRET_ACCESS_KEY: 's'.repeat(64) };

// The database answers: the token's user, then the admins list
function database(isAdmin: boolean) {
  return vi.fn(async (url: string) => {
    if (String(url).includes('/auth/v1/user')) return new Response(JSON.stringify({ id: 'u1' }));
    return new Response(JSON.stringify(isAdmin ? [{ user_id: 'u1' }] : []));
  });
}

let res: FakeRes = fakeRes();
const post = async (body: unknown, token: string | null = 'tok') => {
  res = fakeRes();
  await handler(fakeReq({ method: 'POST', body, headers: token ? { authorization: `Bearer ${token}` } : {} }), res);
};

beforeEach(() => {
  for (const [k, v] of Object.entries(SETTINGS)) vi.stubEnv(k, v);
  vi.stubEnv('SUPABASE_URL', 'https://db.test');
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('R2_PUBLIC_URL', '');
  vi.stubGlobal('fetch', database(true));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('api/r2 POST', () => {
  it('403 without a token', async () => {
    await post({ action: 'sign' }, null);
    expect(res.statusCode).toBe(403);
  });

  it('403 when the user is not in admins', async () => {
    vi.stubGlobal('fetch', database(false));
    await post({ action: 'sign', kind: 'pdf', filename: 'a.pdf', size: 1 });
    expect(res.statusCode).toBe(403);
  });

  it('sign refuses a wrong extension', async () => {
    await post({ action: 'sign', kind: 'pdf', filename: 'a.exe', size: 1 });
    expect(res.statusCode).toBe(400);
  });

  it('sign refuses an oversize file', async () => {
    await post({ action: 'sign', kind: 'cover', filename: 'a.png', size: 6 * 1024 * 1024 });
    expect(res.statusCode).toBe(400);
  });

  it('sign answers a signed address for a valid file', async () => {
    await post({ action: 'sign', kind: 'audio', filename: 'a.mp3', size: 1000 });
    expect(res.statusCode).toBe(200);
    expect(json(res).uploadUrl).toContain('X-Amz-Signature');
    expect(json(res).publicUrl).toContain('/api/r2?file=audio');
  });

  it('delete refuses a link that is not a site file', async () => {
    await post({ action: 'delete', url: 'https://evil.test/x.pdf' });
    expect(res.statusCode).toBe(400);
  });

  it('signs the exact upload length', async () => {
    await post({ action: 'sign', kind: 'audio', filename: 'a.mp3', size: 1000 });
    expect(json(res).uploadUrl).toContain('X-Amz-SignedHeaders=content-length%3Bhost');
    expect(json(res).contentLength).toBe(1000);
  });

  it('delete refuses a key outside the site folders and calls no storage', async () => {
    const f = database(true);
    vi.stubGlobal('fetch', f);
    await post({ action: 'delete', url: '/api/r2?file=private%2Fx.txt' });
    expect(res.statusCode).toBe(400);
    await post({ action: 'delete', url: '/api/r2?file=audio%2F..%2Fx' });
    expect(res.statusCode).toBe(400);
    expect(f.mock.calls.filter(([u]) => String(u).includes('r2.cloudflarestorage'))).toHaveLength(0);
  });
});
