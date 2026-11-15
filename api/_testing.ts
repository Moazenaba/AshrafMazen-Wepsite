// Test helpers for the server functions: a fake request and a response that records what was sent.
export interface FakeRes {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  setHeader(name: string, value: string): void;
  status(code: number): FakeRes;
  send(body?: string): FakeRes;
  end(body?: string): FakeRes;
}

export function fakeRes(): FakeRes {
  const res: FakeRes = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) {
      res.headers[name.toLowerCase()] = value;
    },
    status(code) {
      res.statusCode = code;
      return res;
    },
    send(body = '') {
      res.body = body;
      return res;
    },
    end(body = '') {
      res.body = body;
      return res;
    },
  };
  return res;
}

export function fakeReq({ method = 'GET', query = {}, body, headers = {} }: { method?: string; query?: Record<string, string>; body?: unknown; headers?: Record<string, string> } = {}) {
  return { method, query, body, headers };
}

export const json = (res: FakeRes) => JSON.parse(res.body || 'null');
