// Sends one failure to /api/log so the owner can read it later. At most 5 per page load; never throws.
const ENDPOINT = '/api/log';
const MAX_PER_LOAD = 5;
let sent = 0;

export function reportError(name: string, error: unknown, detail?: Record<string, unknown>): void {
  try {
    if (sent >= MAX_PER_LOAD) return;
    sent += 1;
    const message = error instanceof Error ? error.message : String(error ?? '');
    const body = JSON.stringify({ name, message, detail, path: typeof location !== 'undefined' ? location.pathname : '' });
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else if (typeof fetch === 'function') {
      void fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // reporting must never cause a failure of its own
  }
}
