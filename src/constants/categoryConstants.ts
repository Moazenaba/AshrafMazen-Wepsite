import React from 'react';
import {
  BookOpen,
  Book,
  BookMarked,
  Scroll,
  Library,
  GraduationCap,
  Mic,
  Landmark,
  Scale,
  Star,
  Heart,
  Moon,
  type LucideIcon,
} from 'lucide-react';

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
  accentText: string;
}

export const CATEGORY_PALETTES: Record<string, CategoryColorTheme> = {
  emerald: {
    id: 'emerald',
    name: 'أخضر زمردي',
    previewBg: '#059669',
    cardBg: 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.08]',
    cardBorder: 'border-emerald-500/20 dark:border-emerald-500/30 hover:border-emerald-600/50',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200/80 dark:border-emerald-800/60',
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    accentText: 'text-emerald-700 dark:text-emerald-400',
  },
  amber: {
    id: 'amber',
    name: 'ذهبي عنبري',
    previewBg: '#d97706',
    cardBg: 'bg-amber-500/[0.04] dark:bg-amber-500/[0.08]',
    cardBorder: 'border-amber-500/25 dark:border-amber-500/30 hover:border-amber-600/50',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/70',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200/80 dark:border-amber-800/60',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-100/80 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    accentText: 'text-amber-700 dark:text-amber-400',
  },
  sky: {
    id: 'sky',
    name: 'أزرق سماوي',
    previewBg: '#0284c7',
    cardBg: 'bg-sky-500/[0.04] dark:bg-sky-500/[0.08]',
    cardBorder: 'border-sky-500/20 dark:border-sky-500/30 hover:border-sky-600/50',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/70',
    badgeText: 'text-sky-800 dark:text-sky-300',
    badgeBorder: 'border-sky-200/80 dark:border-sky-800/60',
    dot: 'bg-sky-500',
    iconBg: 'bg-sky-100/80 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    accentText: 'text-sky-700 dark:text-sky-400',
  },
  indigo: {
    id: 'indigo',
    name: 'نيلي وقور',
    previewBg: '#4f46e5',
    cardBg: 'bg-indigo-500/[0.04] dark:bg-indigo-500/[0.08]',
    cardBorder: 'border-indigo-500/20 dark:border-indigo-500/30 hover:border-indigo-600/50',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200/80 dark:border-indigo-800/60',
    dot: 'bg-indigo-500',
    iconBg: 'bg-indigo-100/80 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
    accentText: 'text-indigo-700 dark:text-indigo-400',
  },
  teal: {
    id: 'teal',
    name: 'تركوازي هادئ',
    previewBg: '#0d9488',
    cardBg: 'bg-teal-500/[0.04] dark:bg-teal-500/[0.08]',
    cardBorder: 'border-teal-500/20 dark:border-teal-500/30 hover:border-teal-600/50',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/70',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-200/80 dark:border-teal-800/60',
    dot: 'bg-teal-500',
    iconBg: 'bg-teal-100/80 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    accentText: 'text-teal-700 dark:text-teal-400',
  },
  rose: {
    id: 'rose',
    name: 'قرمزي دافئ',
    previewBg: '#e11d48',
    cardBg: 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08]',
    cardBorder: 'border-rose-500/20 dark:border-rose-500/30 hover:border-rose-600/50',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/70',
    badgeText: 'text-rose-800 dark:text-rose-300',
    badgeBorder: 'border-rose-200/80 dark:border-rose-800/60',
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-100/80 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    accentText: 'text-rose-700 dark:text-rose-400',
  },
  violet: {
    id: 'violet',
    name: 'بنفسجي ملكي',
    previewBg: '#7c3aed',
    cardBg: 'bg-purple-500/[0.04] dark:bg-purple-500/[0.08]',
    cardBorder: 'border-purple-500/20 dark:border-purple-500/30 hover:border-purple-600/50',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-200/80 dark:border-purple-800/60',
    dot: 'bg-purple-500',
    iconBg: 'bg-purple-100/80 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    accentText: 'text-purple-700 dark:text-purple-400',
  },
  slate: {
    id: 'slate',
    name: 'رمادي رصين',
    previewBg: '#475569',
    cardBg: 'bg-slate-500/[0.04] dark:bg-slate-500/[0.08]',
    cardBorder: 'border-slate-500/20 dark:border-slate-500/30 hover:border-slate-600/50',
    badgeBg: 'bg-slate-100 dark:bg-slate-900/80',
    badgeText: 'text-slate-800 dark:text-slate-200',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    dot: 'bg-slate-500',
    iconBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    accentText: 'text-slate-700 dark:text-slate-300',
  },
};

export const ALLOWED_CATEGORY_COLORS = Object.keys(CATEGORY_PALETTES);

export function getCategoryColorTheme(colorKey?: string): CategoryColorTheme {
  if (colorKey && CATEGORY_PALETTES[colorKey]) {
    return CATEGORY_PALETTES[colorKey];
  }
  return CATEGORY_PALETTES.emerald;
}

/**
 * Fixed Icons List for Categories
 */
export const CATEGORY_ICONS: Record<string, { label: string; icon: LucideIcon }> = {
  BookOpen: { label: 'كتاب مفتوح', icon: BookOpen },
  Book: { label: 'كتاب مؤصل', icon: Book },
  BookMarked: { label: 'متن محفوظ', icon: BookMarked },
  Scroll: { label: 'مخطوطة', icon: Scroll },
  Library: { label: 'خزانة كتب', icon: Library },
  GraduationCap: { label: 'طلب العلم', icon: GraduationCap },
  Mic: { label: 'خطابة وموعظة', icon: Mic },
  Landmark: { label: 'صرح ومنارة', icon: Landmark },
  Scale: { label: 'ميزان الفقه', icon: Scale },
  Star: { label: 'درّة علمية', icon: Star },
  Heart: { label: 'تزكية وسلوك', icon: Heart },
  Moon: { label: 'هلال وشريعة', icon: Moon },
};

export const ALLOWED_CATEGORY_ICONS = Object.keys(CATEGORY_ICONS);

export function renderCategoryIcon(iconName?: string, className: string = 'w-6 h-6'): React.ReactElement {
  const IconComponent = (iconName && CATEGORY_ICONS[iconName]?.icon) || BookOpen;
  return React.createElement(IconComponent, { className });
}
