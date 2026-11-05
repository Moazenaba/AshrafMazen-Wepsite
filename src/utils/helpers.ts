/**
 * Small formatting helpers shared by the public pages and the admin.
 */

/**
 * "الدرس الأول", "الدرس الثاني"... for a lesson number
 */
export function getArabicLessonOrdinal(num: number | null | undefined): string {
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

  return ordinals[num] ? ordinals[num] : `الدرس رقم ${num}`;
}

/**
 * A date in Arabic: "٣ نوفمبر ٢٠٢٦"
 */
export function formatArabicDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Seconds as a clock: "05:30" or "1:05:30"
 */
export function formatAudioTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * The colours a category can take in the admin (its badges, dots and cards)
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
  headerBg: string;
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
    headerBg: 'bg-emerald-800 dark:bg-[#12281d]',
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
    headerBg: 'bg-amber-800 dark:bg-[#2b1f0c]',
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
    headerBg: 'bg-sky-800 dark:bg-[#0c2233]',
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
    headerBg: 'bg-indigo-800 dark:bg-[#181a38]',
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
    headerBg: 'bg-teal-800 dark:bg-[#0d2624]',
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
    headerBg: 'bg-rose-800 dark:bg-[#301019]',
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
    headerBg: 'bg-violet-800 dark:bg-[#201236]',
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
    headerBg: 'bg-slate-800 dark:bg-[#1a2128]',
  },
};

export function getCategoryColorTheme(colorKey: string | null | undefined): CategoryColorTheme {
  if (colorKey && CATEGORY_PALETTES[colorKey]) {
    return CATEGORY_PALETTES[colorKey];
  }
  return CATEGORY_PALETTES.emerald;
}

/**
 * A number in Arabic-Indic digits: "١٢٣٤"
 */
export function formatArabicViews(views: number | null | undefined): string {
  const safe = typeof views === 'number' && !isNaN(views) ? views : 0;
  return new Intl.NumberFormat('ar-EG').format(safe);
}

/**
 * The grammatical forms of the words that are counted
 */
export const COUNT_FORMS = {
  lesson: { one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درسًا' },
  series: { one: 'سلسلة واحدة', two: 'سلسلتان', few: 'سلاسل', many: 'سلسلة' },
  view: { one: 'مشاهدة واحدة', two: 'مشاهدتان', few: 'مشاهدات', many: 'مشاهدة' },
};

/**
 * A counted noun with Arabic number agreement: "درس واحد" / "درسان" / "٥ دروس" / "١١ درسًا"
 */
export function formatArabicCount(
  count: number,
  forms: { one: string; two: string; few: string; many: string }
): string {
  const n = Math.max(0, Math.floor(count || 0));
  if (n === 1) return forms.one;
  if (n === 2) return forms.two;
  const formatted = new Intl.NumberFormat('ar-EG').format(n);
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return `${formatted} ${forms.few}`;
  if (lastTwo >= 11 && lastTwo <= 99) return `${formatted} ${forms.many}`;
  return `${formatted} ${forms.one.split(' ')[0]}`;
}
