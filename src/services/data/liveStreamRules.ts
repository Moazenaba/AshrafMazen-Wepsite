// Pure rules for the live broadcast banner. Two sources, and only these two:
//   - YouTube: the Sheikh's own channel, found automatically (api/live.ts); nothing to switch on, and a live of any
//     other channel can never show. It plays inside the site (page /live).
//   - Telegram: cannot be detected or embedded, so the admin switches it on and gives its link; it opens Telegram.
// No database or screen here.

// What the admin saves (the Telegram broadcast). An old saved copy may still carry a youtubeUrl: it is ignored and
// dropped on the next save.
export interface LiveStream {
  enabled: boolean;
  title: string;
  telegramUrl: string;
}

export const EMPTY_LIVE: LiveStream = { enabled: false, title: '', telegramUrl: '' };

// The answer of /api/live when the Sheikh's channel is broadcasting
export interface AutoLive {
  videoId: string;
  title: string;
}

// What a visitor is shown
export interface LiveView {
  youtubeId: string | null;
  telegram: string | null;
  title: string;
}

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function cleanLiveStream(data: Partial<LiveStream> | undefined): LiveStream {
  return {
    enabled: !!data?.enabled,
    title: text(data?.title, 120),
    telegramUrl: text(data?.telegramUrl, 500),
  };
}

export function parseLiveStream(raw: string | null | undefined): LiveStream {
  if (!raw) return EMPTY_LIVE;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? cleanLiveStream(data) : EMPTY_LIVE;
  } catch {
    return EMPTY_LIVE;
  }
}

const TELEGRAM_HOSTS = new Set(['t.me', 'telegram.me', 'telegram.dog']);

// A Telegram address as a safe https link, or null (only Telegram's own hosts are accepted)
export function telegramHref(url: string | null | undefined): string | null {
  const raw = (url ?? '').trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return TELEGRAM_HOSTS.has(host) && parsed.pathname.length > 1 ? `https://${host}${parsed.pathname}${parsed.search}` : null;
  } catch {
    return null;
  }
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// The broadcasts to show: the Sheikh's YouTube live when /api/live found one, and the Telegram one when the admin has it on
export function liveView(auto: AutoLive | null | undefined, manual: LiveStream): LiveView {
  const youtubeId = auto && VIDEO_ID.test(auto.videoId) ? auto.videoId : null;
  const telegram = manual.enabled ? telegramHref(manual.telegramUrl) : null;
  return { youtubeId, telegram, title: text(youtubeId ? auto?.title || manual.title : manual.title, 150) };
}

export const isLiveShown = (v: LiveView) => !!v.youtubeId || !!v.telegram;

export function validateLiveStream(l: LiveStream): string | null {
  if (!l.enabled) return null;
  if (!l.telegramUrl) return 'ضع رابط البث على تليجرام.';
  if (!telegramHref(l.telegramUrl)) return 'رابط تليجرام غير صحيح. يجب أن يبدأ بـ t.me/';
  return null;
}
