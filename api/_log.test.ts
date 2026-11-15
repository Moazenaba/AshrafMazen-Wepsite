import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logEvent } from './_log';

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://db.test');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('logEvent', () => {
  it('writes one JSON line without secret-looking keys', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    await logEvent('info', 'fn', 'hello', { ok: 1, apiKey: 'x', Authorization: 'y', token: 'z' });
    expect(info).toHaveBeenCalledTimes(1);
    const line = JSON.parse(info.mock.calls[0][0] as string);
    expect(line).toMatchObject({ level: 'info', fn: 'fn', msg: 'hello', ok: 1 });
    expect(JSON.stringify(line)).not.toMatch(/apiKey|Authorization|token/);
  });

  it('posts an error to the database with the service key', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const f = vi.fn(async (..._a: unknown[]) => new Response('', { status: 201 }));
    vi.stubGlobal('fetch', f);
    await logEvent('error', 'live', 'x'.repeat(900), { a: 1 });
    expect(String(f.mock.calls[0][0])).toBe('https://db.test/rest/v1/error_events');
    const init = f.mock.calls[0][1] as RequestInit;
    expect((init.headers as Record<string, string>).apikey).toBe('service');
    const body = JSON.parse(init.body as string);
    expect(body.source).toBe('function');
    expect(body.message).toHaveLength(500);
  });

  it('does not throw when the insert fails or the key is missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    await expect(logEvent('error', 'x', 'y')).resolves.toBeUndefined();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await logEvent('error', 'x', 'y');
    expect(f).not.toHaveBeenCalled();
  });

  it('posts nothing for info and warn', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await logEvent('info', 'x', 'y');
    await logEvent('warn', 'x', 'y');
    expect(f).not.toHaveBeenCalled();
  });
});
