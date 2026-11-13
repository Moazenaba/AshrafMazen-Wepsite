// Pure rules for the live broadcast the admin switches on and off: a YouTube live plays inside the site (page /live),
// a Telegram broadcast cannot be embedded, so it is a button that opens Telegram. No database or screen here.
import { getYouTubeId } from '../../lib/youtube';

export interface LiveStream {
  enabled: boolean;
  title: string;
  youtubeUrl: string;
  telegramUrl: string;
}

export const EMPTY_LIVE: LiveStream = { enabled: false, title: '', youtubeUrl: '', telegramUrl: '' };

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function cleanLiveStream(data: Partial<LiveStream> | undefined): LiveStream {
  return {
    enabled: !!data?.enabled,
    title: text(data?.title, 120),
    youtubeUrl: text(data?.youtubeUrl, 500),
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

export const liveYoutubeId = (l: LiveStream) => getYouTubeId(l.youtubeUrl);

// Shown only when switched on and at least one working link is there
export const isLiveShown = (l: LiveStream) => l.enabled && (!!liveYoutubeId(l) || !!telegramHref(l.telegramUrl));

export function validateLiveStream(l: LiveStream): string | null {
  if (!l.enabled) return null;
  if (l.youtubeUrl && !liveYoutubeId(l)) return 'رابط يوتيوب غير صحيح. الصق رابط البث كما يظهر في المتصفح.';
  if (l.telegramUrl && !telegramHref(l.telegramUrl)) return 'رابط تليجرام غير صحيح. يجب أن يبدأ بـ t.me/';
  if (!liveYoutubeId(l) && !telegramHref(l.telegramUrl)) return 'ضع رابط البث على يوتيوب أو على تليجرام (أو الاثنين).';
  return null;
}
