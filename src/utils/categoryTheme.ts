// The colour theme of each category (cards, badges, dots).
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
