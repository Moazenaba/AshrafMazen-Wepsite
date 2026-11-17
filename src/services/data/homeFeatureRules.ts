// Pure rules for the home page's featured card the admin controls: its own picture, its texts, and the video
// the "شاهد واستمع الآن" button opens (the picture may differ from the video). No database or screen here.
import { getYouTubeId, getYouTubeThumbnail } from '../../lib/youtube';

export interface HomeFeature {
  enabled: boolean;
  title: string;
  subtitle: string;
  imageUrl: string;
  // Where the button leads: any published page of the site (lesson, book, channel video), picked by the admin
  videoUrl: string;
  // The name of that content, shown in the admin screen only
  targetLabel: string;
  // A video link used only to take a still picture from (never played from the card)
  imageFrom: string;
  // A sound that plays quietly in the background on the visitor's first tap (optional, independent of the picture and video)
  audioUrl: string;
  buttonLabel: string;
}

export const DEFAULT_BUTTON_LABEL = 'شاهد واستمع الآن';

export const EMPTY_FEATURE: HomeFeature = { enabled: false, title: '', subtitle: '', imageUrl: '', videoUrl: '', targetLabel: '', imageFrom: '', audioUrl: '', buttonLabel: '' };

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export function cleanHomeFeature(data: Partial<HomeFeature> | undefined): HomeFeature {
  return {
    enabled: !!data?.enabled,
    title: text(data?.title, 200),
    subtitle: text(data?.subtitle, 200),
    imageUrl: text(data?.imageUrl, 1000),
    videoUrl: text(data?.videoUrl, 1000),
    targetLabel: text(data?.targetLabel, 200),
    imageFrom: text(data?.imageFrom, 1000),
    audioUrl: text(data?.audioUrl, 1000),
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

// Shown when the admin turned it on and gave it a picture; the video link is optional (without one there is no button)
// The picture the card shows: the admin's own, else the first frame (thumbnail) of the video when it is a YouTube link
export const featureImage = (f: HomeFeature): string => f.imageUrl || getYouTubeThumbnail(f.imageFrom) || getYouTubeThumbnail(f.videoUrl) || '';

export const isFeatureShown = (f: HomeFeature) => f.enabled && !!featureImage(f);

export const hasFeatureVideo = (f: HomeFeature) => !!f.videoUrl.trim();

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
  if (!featureImage(f)) return 'ارفع صورة، أو الصق رابط فيديو من يوتيوب ليظهر أول إطار منه.';
  return null;
}

// Why the featured card does or does not show on the home page, so the admin screen can say it plainly
export type FeatureStatus = 'shown' | 'off' | 'no-image';

export function featureStatus(f: HomeFeature): FeatureStatus {
  if (!f.enabled) return 'off';
  if (!featureImage(f)) return 'no-image';
  return 'shown';
}

export const FEATURE_STATUS_TEXT: Record<FeatureStatus, string> = {
  shown: 'الحالة: ستظهر البطاقة بالصورة في الصفحة الرئيسية بعد الحفظ.',
  off: 'الحالة: البطاقة مطفأة، فلن تظهر الصورة. يظهر مكانها الدرس المميز. علّم مربع «إظهار هذه البطاقة» لتظهر.',
  'no-image': 'الحالة: ناقصة الصورة. ارفع صورة، أو ضع رابط فيديو من يوتيوب.',
};

// A new picture means the admin wants the card shown: it is switched on with it
export const withUploadedImage = (f: HomeFeature, imageUrl: string): HomeFeature => ({ ...f, imageUrl, enabled: true });

// What YouTube knows about a video (its oEmbed answer), as far as the card needs it
export interface VideoInfo {
  title: string;
  author: string;
}

// Fills the title and the line under it from the video, only where the admin has not written anything (never overwrites)
export function autoFillFromVideo(f: HomeFeature, info: VideoInfo): HomeFeature {
  return {
    ...f,
    title: f.title.trim() ? f.title : text(info.title, 200),
    subtitle: f.subtitle.trim() ? f.subtitle : text(info.author, 200),
  };
}
