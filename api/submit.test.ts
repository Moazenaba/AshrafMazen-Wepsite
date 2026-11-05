import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from './submit';

// A minimal response object: records the status and the JSON body the function sends
function makeRes() {
  const res: any = { code: 0, body: null, headers: {} };
  res.setHeader = (k: string, v: string) => (res.headers[k] = v);
  res.status = (code: number) => ((res.code = code), res);
  res.send = (text: string) => (res.body = JSON.parse(text));
  return res;
}

let ipCounter = 0;
// Each request comes from its own address, so the hourly limit of one test never affects another
const request = (body: Record<string, unknown>, over: Record<string, unknown> = {}) => ({
  method: 'POST',
  headers: { 'x-forwarded-for': `10.0.0.${++ipCounter}` },
  body: { kind: 'correction', title: 'خطأ في عنوان', details: 'الشرح بجملة كاملة', t: Date.now() - 10_000, ...body },
  ...over,
});

const call = async (req: any) => {
  const res = makeRes();
  await handler(req, res);
  return res;
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.SUPABASE_URL = 'https://project.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-key';
  fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' });
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api/submit (a visitor request)', () => {
  it('accepts only POST', async () => {
    expect((await call({ method: 'GET', headers: {} })).code).toBe(405);
  });

  it('says it is not set up when there is no database address or key', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    expect((await call(request({}))).code).toBe(503);
  });

  it('pretends to accept a bot that filled the hidden field, and saves nothing', async () => {
    const res = await call(request({ website: 'http://spam.example' }));
    expect(res.code).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses an unknown kind of request', async () => {
    expect((await call(request({ kind: 'nonsense' }))).code).toBe(400);
  });

  it('refuses a request that did not come from the form (no time stamp)', async () => {
    expect((await call(request({ t: undefined }))).code).toBe(429);
  });

  it('refuses a form sent faster than a person could fill it', async () => {
    expect((await call(request({ t: Date.now() }))).code).toBe(429);
  });

  it('needs a title of at least two letters', async () => {
    expect((await call(request({ title: 'ا' }))).code).toBe(400);
  });

  it('refuses a link that is not http or https', async () => {
    expect((await call(request({ kind: 'book', title: 'كتاب', url: 'javascript:alert(1)' }))).code).toBe(400);
  });

  it('needs a link for a suggested book, audio or video', async () => {
    for (const kind of ['book', 'audio', 'video']) {
      expect((await call(request({ kind, title: 'عنوان', url: '' }))).code).toBe(400);
    }
  });

  it('needs an explanation for a correction or a removal', async () => {
    expect((await call(request({ kind: 'correction', details: 'خطأ' }))).code).toBe(400);
    expect((await call(request({ kind: 'removal', details: '' }))).code).toBe(400);
  });

  it('saves a good request with the server key and says it was created', async () => {
    const res = await call(request({ kind: 'book', title: 'كتاب جيد', url: 'https://example.com/book.pdf', author: 'مؤلف' }));
    expect(res.code).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://project.supabase.co/rest/v1/submissions');
    expect(init.headers.Authorization).toBe('Bearer server-key');
    expect(JSON.parse(init.body)).toMatchObject({ kind: 'book', title: 'كتاب جيد', url: 'https://example.com/book.pdf', author: 'مؤلف' });
  });

  it('cuts text to its limit and removes control characters before saving', async () => {
    await call(request({ kind: 'correction', title: 'عنوان\u0000طويل', details: 'ش'.repeat(5000) }));
    const saved = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(saved.title).toBe('عنوانطويل');
    expect(saved.details).toHaveLength(2000);
  });

  it('allows five requests an hour from one address and refuses the sixth', async () => {
    const headers = { 'x-forwarded-for': '203.0.113.9' };
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await call(request({}, { headers }))).code);
    expect(codes).toEqual([201, 201, 201, 201, 201, 429]);
  });

  it('tells the visitor the queue is full when the database says too many are waiting', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, text: async () => 'too many pending requests' });
    const res = await call(request({}));
    expect(res.code).toBe(502);
    expect(res.body.error).toContain('الحد الأقصى');
  });

  it('gives a general error for any other database refusal', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const res = await call(request({}));
    expect(res.code).toBe(502);
    expect(res.body.error).not.toContain('الحد الأقصى');
  });
});
