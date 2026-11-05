// Development only: serves the Vercel functions in api/ from the Vite dev server, so /api/r2 and
// /api/youtube-library work locally the way they do once deployed. Production never loads this file.
import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// The small part of Vercel's request and response helpers that the functions use
function vercelResponse(res: ServerResponse) {
  const out = res as ServerResponse & { status: (code: number) => typeof out; send: (body: unknown) => void; json: (body: unknown) => void };
  out.status = (code: number) => {
    res.statusCode = code;
    return out;
  };
  out.send = (body: unknown) => res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
  out.json = (body: unknown) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  };
  return out;
}

export function apiDevServer(): Plugin {
  return {
    name: 'api-dev-server',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const match = url.pathname.match(/^\/api\/([a-z0-9-]+)\/?$/i);
        if (!match) return next();
        let mod: { default?: (req: unknown, res: unknown) => unknown };
        try {
          mod = await server.ssrLoadModule(`/api/${match[1]}.ts`);
        } catch {
          return next();
        }
        if (typeof mod.default !== 'function') return next();
        const raw = req.method === 'POST' || req.method === 'PUT' ? await readBody(req) : '';
        let body: unknown = raw;
        if (raw && String(req.headers['content-type'] || '').includes('application/json')) {
          try {
            body = JSON.parse(raw);
          } catch {
            body = raw;
          }
        }
        const request = Object.assign(req, { query: Object.fromEntries(url.searchParams), body });
        try {
          await mod.default(request, vercelResponse(res));
        } catch (err) {
          server.config.logger.error(`[api] ${match[1]}: ${String(err)}`);
          if (!res.headersSent) res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}
