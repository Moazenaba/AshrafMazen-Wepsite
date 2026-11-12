// Pure rules for the home page's featured card the admin controls: its own picture, its texts, and the video
// the "شاهد واستمع الآن" button opens (the picture may differ from the video). No database or screen here.
import { getYouTubeId } from '../../lib/youtube';

export interface HomeFeature {
  enabled: boolean;
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl: string;
  buttonLabel: string;
}

export const DEFAULT_BUTTON_LABEL = 'شاهد واستمع الآن';

export const EMPTY_FEATURE: HomeFeature = { enabled: false, title: '', subtitle: '', imageUrl: '', videoUrl: '', buttonLabel: '' };

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function cleanHomeFeature(data: Partial<HomeFeature> | undefined): HomeFeature {
  return {
    enabled: !!data?.enabled,
    title: text(data?.title, 200),
    subtitle: text(data?.subtitle, 200),
    imageUrl: text(data?.imageUrl, 1000),
    videoUrl: text(data?.videoUrl, 1000),
    buttonLabel: text(data?.buttonLabel, 40),
  };
}

export function parseHomeFeature(raw: string | null | undefined): HomeFeature {
  if (!raw) return EMPTY_FEATURE;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? cleanHomeFeature(data) : EMPTY_FEATURE;
  } catch {
    return EMPTY_FEATURE;
  }
}

// Shown only when the admin turned it on and gave it a picture and a video
export const isFeatureShown = (f: HomeFeature) => f.enabled && !!f.imageUrl && !!f.videoUrl;

// Where the button leads: a YouTube video plays inside the site, a site address stays in the site, anything else opens outside
export function featureTarget(f: HomeFeature): { kind: 'internal' | 'external'; href: string } {
  const url = f.videoUrl.trim();
  const id = getYouTubeId(url);
  if (id) return { kind: 'internal', href: `/video/${id}${f.title ? `?t=${encodeURIComponent(f.title)}` : ''}` };
  if (url.startsWith('/')) return { kind: 'internal', href: url };
  try {
    const parsed = new URL(url);
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return { kind: 'internal', href: parsed.pathname + parsed.search + parsed.hash };
    }
  } catch {
    // not a full address: treated as given
  }
  return { kind: 'external', href: url };
}

export function validateHomeFeature(f: HomeFeature): string | null {
  if (!f.enabled) return null;
  if (!f.imageUrl) return 'ارفع صورة للواجهة أو الصق رابطها.';
  if (!f.videoUrl) return 'الصق رابط الفيديو الذي يفتحه زر «شاهد واستمع الآن».';
  return null;
}
