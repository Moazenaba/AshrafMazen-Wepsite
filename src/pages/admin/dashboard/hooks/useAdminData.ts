// Loads what the dashboard shows (categories, series, lessons) and reloads it after any change.
import { useCallback, useEffect, useState } from 'react';
import { getAllLessonsAdmin, getAllSeries, getCategories } from '../../../../services/dataService';
import type { Category, Series } from '../../../../types';
import type { LessonAdminItem } from '../types';

export function useAdminData() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [lessons, setLessons] = useState<LessonAdminItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [cats, series, allLessons] = await Promise.all([getCategories(), getAllSeries(), getAllLessonsAdmin()]);
      setCategories(cats);
      setSeriesList(series);
      setLessons(allLessons);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err?.message || 'تعذّر تحميل البيانات من قاعدة البيانات.');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, seriesList, lessons, error, reload };
}
