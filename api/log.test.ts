import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './log';
import csp, { readReports } from './csp-report';
import { fakeReq, fakeRes } from './_testing';

const posted = () => vi.fn(async (..._a: unknown[]) => new Response('', { status: 201 }));

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://db.test');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/log', () => {
  it('answers 405 to GET', async () => {
    const res = fakeRes();
    await handler(fakeReq({ method: 'GET' }), res);
    expect(res.statusCode).toBe(405);
  });

  it('stores a valid report as a browser event and cuts long fields', async () => {
    const f = posted();
    vi.stubGlobal('fetch', f);
    const res = fakeRes();
    await handler(fakeReq({ method: 'POST', headers: { 'x-forwarded-for': '1.1.1.1' }, body: { name: 'n'.repeat(300), message: 'm'.repeat(900), path: '/lesson/1' } }), res);
    expect(res.statusCode).toBe(204);
    const body = JSON.parse((f.mock.calls[0][1] as RequestInit).body as string);
    expect(body.source).toBe('browser');
    expect(body.name).toHaveLength(100);
    expect(body.message).toHaveLength(500);
    expect(body.path).toBe('/lesson/1');
  });

  it('stores nothing from the 21st call in 10 minutes but still answers 204', async () => {
    const f = posted();
    vi.stubGlobal('fetch', f);
    let last = fakeRes();
    for (let i = 0; i < 21; i++) {
      last = fakeRes();
      await handler(fakeReq({ method: 'POST', headers: { 'x-forwarded-for': '2.2.2.2' }, body: { name: 'a', message: 'b' } }), last);
    }
    expect(f).toHaveBeenCalledTimes(20);
    expect(last.statusCode).toBe(204);
  });

  it('answers 204 for a body that is not JSON', async () => {
    const res = fakeRes();
    await handler(fakeReq({ method: 'POST', headers: { 'x-forwarded-for': '3.3.3.3' }, body: '{broken' }), res);
    expect(res.statusCode).toBe(204);
  });
});

describe('api/csp-report', () => {
  it('reads the legacy and the Reporting API shapes', () => {
    expect(readReports({ 'csp-report': { 'violated-directive': 'img-src', 'blocked-uri': 'https://x.test/a.png', 'document-uri': 'https://s.test/' } })).toEqual([
      { directive: 'img-src', blocked: 'https://x.test/a.png', page: 'https://s.test/' },
    ]);
    expect(readReports([{ body: { effectiveDirective: 'script-src', blockedURL: 'inline', documentURL: 'https://s.test/p' } }])).toEqual([
      { directive: 'script-src', blocked: 'inline', page: 'https://s.test/p' },
    ]);
  });

  it('stores both shapes as csp events and answers 204', async () => {
    const f = posted();
    vi.stubGlobal('fetch', f);
    const res = fakeRes();
    await csp(fakeReq({ method: 'POST', headers: { 'x-forwarded-for': '4.4.4.4' }, body: [{ body: { effectiveDirective: 'img-src', blockedURL: 'https://x.test' } }] }), res);
    await csp(fakeReq({ method: 'POST', headers: { 'x-forwarded-for': '4.4.4.5' }, body: { 'csp-report': { 'violated-directive': 'font-src', 'blocked-uri': 'data' } } }), fakeRes());
    expect(res.statusCode).toBe(204);
    const bodies = f.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string));
    expect(bodies.map((b) => [b.source, b.name, b.message])).toEqual([
      ['csp', 'csp-violation', 'img-src https://x.test'],
      ['csp', 'csp-violation', 'font-src data'],
    ]);
  });
});
