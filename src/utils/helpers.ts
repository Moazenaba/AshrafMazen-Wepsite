/**
 * Arabic Ordinals generator for lesson numbers:
 * 1 -> الدرس الأول
 * 2 -> الدرس الثاني
 * ...
 */
export function getArabicLessonOrdinal(num: number): string {
  if (!num || isNaN(num)) return 'الدرس';
  const ordinals: Record<number, string> = {
    1: 'الدرس الأول',
    2: 'الدرس الثاني',
    3: 'الدرس الثالث',
    4: 'الدرس الرابع',
    5: 'الدرس الخامس',
    6: 'الدرس السادس',
    7: 'الدرس السابع',
    8: 'الدرس الثامن',
    9: 'الدرس التاسع',
    10: 'الدرس العاشر',
    11: 'الدرس الحادي عشر',
    12: 'الدرس الثاني عشر',
    13: 'الدرس الثالث عشر',
    14: 'الدرس الرابع عشر',
    15: 'الدرس الخامس عشر',
    16: 'الدرس السادس عشر',
    17: 'الدرس السابع عشر',
    18: 'الدرس الثامن عشر',
    19: 'الدرس التاسع عشر',
    20: 'الدرس العشرون',
    21: 'الدرس الحادي والعشرون',
    22: 'الدرس الثاني والعشرون',
    23: 'الدرس الثالث والعشرون',
    24: 'الدرس الرابع والعشرون',
    25: 'الدرس الخامس والعشرون',
    26: 'الدرس السادس والعشرون',
    27: 'الدرس السابع والعشرون',
    28: 'الدرس الثامن والعشرون',
    29: 'الدرس التاسع والعشرون',
    30: 'الدرس الثلاثون',
    31: 'الدرس الحادي والثلاثون',
    32: 'الدرس الثاني والثلاثون',
    33: 'الدرس الثالث والثلاثون',
    34: 'الدرس الرابع والثلاثون',
    35: 'الدرس الخامس والثلاثون',
    36: 'الدرس السادس والثلاثون',
    37: 'الدرس السابع والثلاثون',
    38: 'الدرس الثامن والثلاثون',
    39: 'الدرس التاسع والثلاثون',
    40: 'الدرس الأربعون',
    50: 'الدرس الخمسون',
    60: 'الدرس الستون',
    70: 'الدرس السبعون',
    80: 'الدرس الثمانون',
    90: 'الدرس التسعون',
    100: 'الدرس المائة',
  };

  if (ordinals[num]) {
    return ordinals[num];
  }

  // Fallback for higher numbers
  return `الدرس رقم ${num}`;
}

/**
 * Converts any standard YouTube URL (watch?v=, youtu.be, shorts, embed) into an embeddable URL
 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  try {
    // Check if it's already an embed URL
    if (cleanUrl.includes('youtube.com/embed/')) {
      const match = cleanUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}?rel=0`;
      }
      return cleanUrl;
    }

    // youtu.be/VIDEO_ID
    const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch && shortMatch[1]) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0`;
    }

    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch && watchMatch[1]) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?rel=0`;
    }

    // youtube.com/shorts/VIDEO_ID
    const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch && shortsMatch[1]) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}?rel=0`;
    }

    // Direct 11 character ID provided
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
      return `https://www.youtube.com/embed/${cleanUrl}?rel=0`;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Format date in Arabic locale
 */
export function formatArabicDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
export function formatAudioTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrs}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Category Color Palette definitions for distinct visual organizing
 */
export interface CategoryColorTheme {
  id: string;
  name: string;
  previewBg: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dot: string;
  iconBg: string;
}

export const CATEGORY_PALETTES: Record<string, CategoryColorTheme> = {
  emerald: {
    id: 'emerald',
    name: 'أخضر زمردي',
    previewBg: '#059669',
    cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.12]',
    cardBorder: 'border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-600/50 dark:hover:border-emerald-400/50',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200/80 dark:border-emerald-800/80',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    iconBg: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
  amber: {
    id: 'amber',
    name: 'ذهبي عنبري',
    previewBg: '#d97706',
    cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.12]',
    cardBorder: 'border-amber-500/25 dark:border-amber-500/30 hover:border-amber-600/50 dark:hover:border-amber-400/50',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200/80 dark:border-amber-800/80',
    dot: 'bg-amber-500 dark:bg-amber-400',
    iconBg: 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  },
  sky: {
    id: 'sky',
    name: 'أزرق سماوي',
    previewBg: '#0284c7',
    cardBg: 'bg-sky-500/[0.04] dark:bg-sky-500/[0.12]',
    cardBorder: 'border-sky-500/20 dark:border-sky-500/30 hover:border-sky-600/50 dark:hover:border-sky-400/50',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/80',
    badgeText: 'text-sky-800 dark:text-sky-300',
    badgeBorder: 'border-sky-200/80 dark:border-sky-800/80',
    dot: 'bg-sky-500 dark:bg-sky-400',
    iconBg: 'bg-sky-100/80 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
  },
  indigo: {
    id: 'indigo',
    name: 'نيلي وقور',
    previewBg: '#4f46e5',
    cardBg: 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.12]',
    cardBorder: 'border-indigo-500/20 dark:border-indigo-500/30 hover:border-indigo-600/50 dark:hover:border-indigo-400/50',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200/80 dark:border-indigo-800/80',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    iconBg: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
  },
  teal: {
    id: 'teal',
    name: 'تركوازي هادئ',
    previewBg: '#0d9488',
    cardBg: 'bg-teal-500/[0.04] dark:bg-teal-500/[0.12]',
    cardBorder: 'border-teal-500/20 dark:border-teal-500/30 hover:border-teal-600/50 dark:hover:border-teal-400/50',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/80',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-200/80 dark:border-teal-800/80',
    dot: 'bg-teal-500 dark:bg-teal-400',
    iconBg: 'bg-teal-100/80 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  },
  rose: {
    id: 'rose',
    name: 'قرمزي دافئ',
    previewBg: '#e11d48',
    cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.12]',
    cardBorder: 'border-rose-500/20 dark:border-rose-500/30 hover:border-rose-600/50 dark:hover:border-rose-400/50',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/80',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-200/80 dark:border-rose-800/80',
    dot: 'bg-rose-500 dark:bg-rose-400',
    iconBg: 'bg-rose-100/80 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
  },
  violet: {
    id: 'violet',
    name: 'بنفسجي ملكي',
    previewBg: '#7c3aed',
    cardBg: 'bg-violet-500/[0.04] dark:bg-violet-500/[0.12]',
    cardBorder: 'border-violet-500/20 dark:border-violet-500/30 hover:border-violet-600/50 dark:hover:border-violet-400/50',
    badgeBg: 'bg-violet-50 dark:bg-violet-950/80',
    badgeText: 'text-violet-800 dark:text-violet-300',
    badgeBorder: 'border-violet-200/80 dark:border-violet-800/80',
    dot: 'bg-violet-500 dark:bg-violet-400',
    iconBg: 'bg-violet-100/80 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
  },
  slate: {
    id: 'slate',
    name: 'رمادي وقور',
    previewBg: '#64748b',
    cardBg: 'bg-slate-500/[0.04] dark:bg-slate-500/[0.12]',
    cardBorder: 'border-slate-500/20 dark:border-slate-500/30 hover:border-slate-600/50 dark:hover:border-slate-400/50',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/80',
    badgeText: 'text-slate-800 dark:text-slate-300',
    badgeBorder: 'border-slate-200/80 dark:border-slate-700/80',
    dot: 'bg-slate-500 dark:bg-slate-400',
    iconBg: 'bg-slate-100/80 text-slate-800 dark:bg-slate-800/60 dark:text-slate-300',
  },
};

export function getCategoryColorTheme(colorKey?: string): CategoryColorTheme {
  if (colorKey && CATEGORY_PALETTES[colorKey]) {
    return CATEGORY_PALETTES[colorKey];
  }
  return CATEGORY_PALETTES.emerald;
}
