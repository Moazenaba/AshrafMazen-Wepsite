import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './site';
import { fakeReq, fakeRes, json } from './_testing';

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://db.test');
  vi.stubEnv('VITE_SUPABASE_URL', '');
  vi.stubEnv('SUPABASE_ANON_KEY', 'anon');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/site', () => {
  it('answers 503 when the database address or key is missing', async () => {
    vi.stubEnv('SUPABASE_URL', '');
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(res.statusCode).toBe(503);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('answers 200 with the five lists and a cache header', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: 200 })));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(Object.keys(json(res)).sort()).toEqual(['categories', 'lessons', 'series', 'settings', 'social', 'updatedAt']);
    expect(res.headers['cache-control']).toContain('s-maxage=30');
  });

  it('answers 502 with no-store when one query fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('[]', { status: ++n === 3 ? 500 : 200 })));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(res.statusCode).toBe(502);
    expect(res.headers['cache-control']).toBe('no-store');
  });
});
