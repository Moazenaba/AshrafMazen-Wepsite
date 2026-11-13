// Pure: turns the one answer of /api/site into what the pages show (the same lists the per-query functions build).
import type { Category, Lesson, Series, SiteSettings, SocialLink } from '../../types';
import { parseLessonExtras } from './extras';
import { isSermonCategory } from './lessonLists';
import type { CategoryWithPortalData } from './portal';
import { attachWith } from './relations';
import { DEFAULT_SITE_SETTINGS } from './settings';
import { parseContact, parseHero, parseQuotes, SITE_CONTENT_KEYS, type SiteContent } from './siteContentRules';
import { parseHomeFeature } from './homeFeatureRules';
import { parseSideMenu } from './sideMenuRules';
import { parseWelcomeSound } from './welcomeSoundRules';
import { DEFAULT_NAME_FONT } from '../../constants/nameFonts';
import type { LessonWithRelations } from './shared';

export interface SiteBundle {
  updatedAt: string;
  settings: { key: string; value: string | null }[];
  categories: Category[];
  series: Series[];
  // Published lessons only, newest first
  lessons: Lesson[];
  social: SocialLink[];
}

export interface HomeLists {
  categories: CategoryWithPortalData[];
  featuredList: LessonWithRelations[];
  latestList: LessonWithRelations[];
  viewedList: LessonWithRelations[];
  sermonList: LessonWithRelations[];
}

export const isSiteBundle = (value: unknown): value is SiteBundle => {
  const b = value as SiteBundle;
  return !!b && [b.settings, b.categories, b.series, b.lessons, b.social].every(Array.isArray);
};

const settingsMap = (bundle: SiteBundle) => new Map(bundle.settings.map((row) => [row.key, row.value ?? null]));

export function bundleSettings(bundle: SiteBundle): SiteSettings {
  const map = settingsMap(bundle);
  return {
    banner_name: map.get('banner_name') || DEFAULT_SITE_SETTINGS.banner_name,
    banner_logo_url: map.get('banner_logo_url') || '',
    about_sheikh: map.get('about_sheikh') || DEFAULT_SITE_SETTINGS.about_sheikh,
    banner_font: map.get('banner_font') || DEFAULT_NAME_FONT,
  };
}

export function bundleContent(bundle: SiteBundle): SiteContent {
  const map = settingsMap(bundle);
  return {
    quotes: parseQuotes(map.get(SITE_CONTENT_KEYS.quotes)),
    hero: parseHero(map.get(SITE_CONTENT_KEYS.hero)),
    contact: parseContact(map.get(SITE_CONTENT_KEYS.contact)),
    feature: parseHomeFeature(map.get(SITE_CONTENT_KEYS.feature)),
    menu: parseSideMenu(map.get(SITE_CONTENT_KEYS.menu)),
    welcome: parseWelcomeSound(map.get(SITE_CONTENT_KEYS.welcome)),
  };
}

// The same counts as getCategoriesWithPortalData(1), getFeaturedLessons(3), getLatestLessons(30),
// getTopViewedLessons(6) and getKhutabLessons(8)
export function buildHomeLists(bundle: SiteBundle, limits = { recent: 1, featured: 3, latest: 30, viewed: 6, sermons: 8 }): HomeLists {
  const { categories, series, lessons } = bundle;
  const attach = (list: Lesson[]) => attachWith(list, series, categories);
  const latest = (n: number) => attach(lessons.slice(0, n));

  const portal = categories.map((category) => {
    const own = series.filter((s) => s.category_id === category.id);
    const ids = new Set(own.map((s) => s.id));
    const ofCategory = lessons.filter((l) => ids.has(l.series_id));
    return {
      ...category,
      seriesCount: own.length,
      lessonCount: ofCategory.length,
      recentLessons: attachWith(ofCategory.slice(0, limits.recent), own, [category]),
    };
  });

  const pinnedIds = parseLessonExtras(settingsMap(bundle).get('lesson_extras') ?? null).featured.slice(0, limits.featured);
  const pinned = lessons
    .filter((l) => pinnedIds.includes(l.id))
    .sort((a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id))
    .map((l) => ({ ...l, featured: true }));

  const byViews = [...lessons].sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0)).slice(0, limits.viewed);

  const sermonCategory = categories.find(isSermonCategory);
  const sermonSeries = sermonCategory ? series.filter((s) => s.category_id === sermonCategory.id) : [];
  const sermonIds = new Set(sermonSeries.map((s) => s.id));
  const sermons = sermonCategory
    ? attachWith(lessons.filter((l) => sermonIds.has(l.series_id)).slice(0, limits.sermons), sermonSeries, [sermonCategory])
    : [];

  return {
    categories: portal,
    featuredList: pinned.length > 0 ? attach(pinned) : latest(limits.featured),
    latestList: latest(limits.latest),
    viewedList: byViews.length > 0 ? attach(byViews) : latest(limits.viewed),
    sermonList: sermons,
  };
}
