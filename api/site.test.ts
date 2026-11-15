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
    expect(Object.keys(json(res)).sort()).toEqual(['categories', 'lessons', 'series', 'settings', 'social', 'transcripts', 'updatedAt']);
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

  it('never asks for the transcript text and caps the lessons', async () => {
    const f = vi.fn(async (..._a: unknown[]) => new Response('[]', { status: 200 }));
    vi.stubGlobal('fetch', f);
    await handler(fakeReq(), fakeRes());
    const lessons = f.mock.calls.map((c) => String(c[0])).find((u) => u.includes('order=published_at.desc'))!;
    expect(lessons).toContain('select=id,series_id');
    expect(lessons).not.toContain('select=*');
    expect(lessons).not.toMatch(/select=[^&]*transcript/);
    expect(lessons).toContain('limit=300');
  });

  it('lists the ids of lessons that have a text', async () => {
    vi.stubGlobal('fetch', vi.fn(async (u: string) => new Response(String(u).includes('transcript=neq.') ? '[{"id":"a"},{"id":"b"}]' : '[]')));
    const res = fakeRes();
    await handler(fakeReq(), res);
    expect(json(res).transcripts).toEqual(['a', 'b']);
  });
});
