import { supabase, supabaseAnonKey, supabaseUrl } from '../lib/supabase';

// Anonymous usage statistics: who is here now, what is watched, heard or read, and for how long.
// There are no accounts and no personal data: a visitor is a random id kept in this browser.
// Every function here swallows its errors, so analytics can never get in the way of the site.

export type ContentKind = 'video' | 'audio' | 'read';

const VISITOR_KEY = 'sheikh_mazen_visitor';
const PING_EVERY_MS = 60_000;
const FLUSH_EVERY_MS = 30_000;
// A report never carries more than this many seconds of one item at once (the database also caps it)
const MAX_SECONDS_PER_REPORT = 600;

function visitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = (crypto.randomUUID?.() || `${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // Storage blocked: a fresh id per page load still counts the visit once
    return `anon${Math.random().toString(36).slice(2, 12)}`;
  }
}

// Seconds waiting to be reported, by "kind|key"
const pending = new Map<string, number>();
const countedViews = new Set<string>();
let flushTimer: number | undefined;

function send(kind: string, key: string | null, seconds: number, view: boolean, keepalive = false) {
  const body = JSON.stringify({ p_kind: kind, p_key: key, p_seconds: Math.round(seconds), p_view: view });
  if (keepalive && supabaseUrl) {
    // Used when the page is closing: a normal request would be cancelled with it
    fetch(`${supabaseUrl}/rest/v1/rpc/record_event`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` },
      body,
    }).catch(() => {});
    return;
  }
  void Promise.resolve(supabase.rpc('record_event', { p_kind: kind, p_key: key, p_seconds: Math.round(seconds), p_view: view })).catch(() => {});
}

function flush(closing = false) {
  for (const [id, seconds] of pending) {
    const [kind, key] = id.split('|');
    let left = seconds;
    while (left >= 1) {
      const part = Math.min(left, MAX_SECONDS_PER_REPORT);
      send(kind, key, part, false, closing);
      left -= part;
    }
  }
  pending.clear();
}

function scheduleFlush() {
  if (flushTimer !== undefined) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = undefined;
    flush();
  }, FLUSH_EVERY_MS);
}

// Counts one view of an item, once per browser tab session. key: 'lesson:<id>', 'yt:<video id>' or 'book:<id>'
export function trackView(kind: ContentKind, key: string): void {
  try {
    const once = `${kind}|${key}`;
    if (countedViews.has(once)) return;
    countedViews.add(once);
    send(kind, key, 0, true);
  } catch {
    // never let statistics break a page
  }
}

// Adds seconds of watching, hearing or reading an item; they are sent in batches
export function trackSeconds(kind: ContentKind, key: string, seconds: number): void {
  try {
    if (!(seconds > 0) || seconds > MAX_SECONDS_PER_REPORT) return;
    const id = `${kind}|${key}`;
    pending.set(id, (pending.get(id) || 0) + seconds);
    scheduleFlush();
  } catch {
    // ignore
  }
}

// Turns a stream of playback positions into the seconds actually played: a jump (seeking) adds nothing
export function createPlaybackMeter(kind: ContentKind, key: string) {
  let last: number | null = null;
  return {
    update(position: number) {
      if (last !== null) {
        const delta = position - last;
        // Normal playback moves forward by about the reporting interval; a seek is far larger or negative
        if (delta > 0 && delta <= 8) trackSeconds(kind, key, delta);
      }
      last = position;
    },
    reset() {
      last = null;
    },
  };
}

// Counts the seconds a page is open and visible, for reading. Returns a function that stops it.
export function trackReading(key: string): () => void {
  let timer: number | undefined;
  const tick = () => {
    if (document.visibilityState === 'visible') trackSeconds('read', key, 5);
  };
  timer = window.setInterval(tick, 5000);
  return () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };
}

// Says "I am here" every minute while the site is open and in view, and counts a page view per page
let presenceStarted = false;
export function startPresence(): void {
  if (presenceStarted || typeof window === 'undefined') return;
  presenceStarted = true;
  const id = visitorId();
  const ping = () => {
    if (document.visibilityState !== 'visible') return;
    void Promise.resolve(supabase.rpc('ping_visitor', { p_vid: id })).catch(() => {});
  };
  ping();
  window.setInterval(ping, PING_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ping();
    else flush(true);
  });
  window.addEventListener('pagehide', () => flush(true));
}

export function trackPageView(): void {
  try {
    send('page', null, 0, false);
  } catch {
    // ignore
  }
}

// What the admin sees ----------------------------------------------------

export interface AdminStats {
  live: number;
  visitors_today: number;
  visitors_7d: number;
  visitors_30d: number;
  totals: Record<string, number>;
  daily: { day: string; metric: string; value: number }[];
  daily_visitors: { day: string; visitors: number }[];
  items: { key: string; views: number; video_seconds: number; audio_seconds: number; read_seconds: number }[];
}

export async function getAdminStats(days = 30): Promise<AdminStats> {
  const { data, error } = await supabase.rpc('admin_stats', { p_days: days });
  if (error) throw new Error(error.message);
  const stats = data as AdminStats;
  // Postgres sums arrive as numbers or strings depending on size; the page wants numbers
  Object.keys(stats.totals).forEach((k) => (stats.totals[k] = Number(stats.totals[k]) || 0));
  return stats;
}

// How many times an item was viewed; public, so any page may show it
export async function getViewCount(key: string): Promise<number> {
  try {
    const { data } = await supabase.from('content_stats').select('views').eq('key', key).maybeSingle();
    return Number(data?.views) || 0;
  } catch {
    return 0;
  }
}
