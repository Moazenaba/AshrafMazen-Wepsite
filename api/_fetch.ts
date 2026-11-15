// fetch that gives up after `ms` (default 8000) and rejects with Error('timeout') instead of waiting forever
export async function fetchWithTimeout(url: RequestInfo | URL, init: RequestInit = {}, ms = 8000): Promise<Response> {
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
