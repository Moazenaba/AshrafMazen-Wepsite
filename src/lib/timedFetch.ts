// Same as api/_fetch.ts, for the browser: gives up after `ms` (default 12000) and rejects with Error("timeout")
export async function timedFetch(url: RequestInfo | URL, init: RequestInit = {}, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) throw new Error('timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
