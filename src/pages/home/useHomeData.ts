// Loads what the home page shows: the sciences, the featured, latest, most viewed and sermon lessons, and the site settings.
import { useEffect, useState } from 'react';
import {
  DEFAULT_SITE_SETTINGS,
  getCategoriesWithPortalData,
  getFeaturedLessons,
  getKhutabLessons,
  getLatestLessons,
  getSiteSettings,
  getTopViewedLessons,
  type CategoryWithPortalData,
  type LessonWithRelations,
} from '../../services/dataService';
import type { SiteSettings } from '../../types';

export function useHomeData() {
  const [categories, setCategories] = useState<CategoryWithPortalData[]>([]);
  const [featuredList, setFeaturedList] = useState<LessonWithRelations[]>([]);
  const [latestList, setLatestList] = useState<LessonWithRelations[]>([]);
  const [viewedList, setViewedList] = useState<LessonWithRelations[]>([]);
  const [sermonList, setSermonList] = useState<LessonWithRelations[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let isMounted = true;
    getSiteSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch(() => {});

    Promise.all([getCategoriesWithPortalData(1), getFeaturedLessons(3), getLatestLessons(30), getTopViewedLessons(6), getKhutabLessons(8)])
      .then(([cats, featured, latest, viewed, sermons]) => {
        if (!isMounted) return;
        setCategories(cats);
        setFeaturedList(featured);
        setLatestList(latest);
        setViewedList(viewed);
        setSermonList(sermons);
      })
      .catch((err) => console.error('Error loading home data:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  return { categories, featuredList, latestList, viewedList, sermonList, settings };
}
