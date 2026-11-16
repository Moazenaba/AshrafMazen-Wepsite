// Pure rules for the welcome sound the admin sets: a short recording played once per visit, on the visitor's first
// tap (browsers never let a page start sound by itself). No database or screen here.

export interface WelcomeSound {
  enabled: boolean;
  url: string;
  // 5..100 (%)
  volume: number;
  // The recording's length, measured by the admin screen when it was saved; absent in older records
  seconds?: number;
}

export const DEFAULT_VOLUME = 30;
export const EMPTY_WELCOME: WelcomeSound = { enabled: false, url: '', volume: DEFAULT_VOLUME };

const volumeOf = (value: unknown) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(100, Math.max(5, n)) : DEFAULT_VOLUME;
};

export function cleanWelcomeSound(data: Partial<WelcomeSound> | undefined): WelcomeSound {
  const url = String(data?.url ?? '').trim().slice(0, 1000);
  const seconds = Number(data?.seconds);
  return {
    enabled: !!data?.enabled,
    url,
    volume: volumeOf(data?.volume),
    // A length only means something next to its recording
    ...(url && Number.isFinite(seconds) && seconds > 0 ? { seconds: Math.round(seconds * 10) / 10 } : {}),
  };
}

export function parseWelcomeSound(raw: string | null | undefined): WelcomeSound {
  if (!raw) return EMPTY_WELCOME;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? cleanWelcomeSound(data) : EMPTY_WELCOME;
  } catch {
    return EMPTY_WELCOME;
  }
}

export function validateWelcomeSound(sound: WelcomeSound): string | null {
  if (!sound.enabled) return null;
  if (!sound.url) return 'ارفع ملف الصوت أو ضع رابطه قبل تفعيل الصوت الترحيبي.';
  if (!/^(https:\/\/|\/api\/r2\?)/.test(sound.url)) return 'رابط الصوت يجب أن يبدأ بـ https://';
  return null;
}

// Pages where a visitor came for a recording or video of their own, or works: the welcome stays silent there
const QUIET = /^\/(lesson|video|reels|admin|dev)(\/|$)/;

// Whether this visit plays the welcome: switched on, not played yet this visit, and not on a page that plays
// something itself (judged by the page the visit opened on, and the page at the moment of the tap)
export function shouldWelcome(sound: WelcomeSound, playedThisVisit: boolean, firstPath: string, path: string): boolean {
  return sound.enabled && !!sound.url && !playedThisVisit && !QUIET.test(firstPath) && !QUIET.test(path);
}

export const isQuietPage = (path: string) => QUIET.test(path);

// A welcome is a short greeting, never a lesson: a recording longer than this is refused by the admin screen and never
// played to visitors (a 23-minute lesson saved here once played to every visitor on their first tap).
export const MAX_WELCOME_SECONDS = 30;

export const isShortWelcome = (seconds: number) => Number.isFinite(seconds) && seconds > 0 && seconds <= MAX_WELCOME_SECONDS;

export function welcomeTooLongMessage(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  const length = seconds >= 90 ? `${minutes} دقيقة` : `${Math.round(seconds)} ثانية`;
  return `الصوت الترحيبي يجب أن يكون قصيراً (${MAX_WELCOME_SECONDS} ثانية أو أقل)، وهذا الملف مدته ${length}. إن كان تسجيل درس فارفعه من «إدارة الدروس».`;
}

// Whether the visitor's browser should fetch the recording at all: not when its saved length says it would be refused.
// A record without a length (saved before the length was kept) is loaded as before and measured on arrival.
export const shouldLoadWelcome = (seconds: number | undefined) => seconds === undefined || isShortWelcome(seconds);
