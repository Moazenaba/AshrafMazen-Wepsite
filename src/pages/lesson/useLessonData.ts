// Loads a lesson with its series, category and the published lessons of the series.
// Drafts are asked for too: the database returns them only to an admin, so the admin can preview before publishing.
import { useEffect, useState } from 'react';
import { getCategory, getLesson, getLessonsBySeries, getSeries, incrementLessonViews } from '../../services/dataService';
import { getResumeSeconds } from '../../services/progressService';
import { saveRecentLesson } from '../../services/recentLessonService';
import type { Category, Lesson, Series } from '../../types';

export function useLessonData(id: string | undefined, linkedSecond: number) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [series, setSeries] = useState<Series | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [seriesLessons, setSeriesLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumeAt, setResumeAt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!id) return;
      try {
        setLoading(true);
        const l = await getLesson(id, true);
        if (!l) {
          if (isMounted) {
            setLesson(null);
            setLoading(false);
          }
          return;
        }

        // Counted once per browser session, and only for a lesson that exists and is published
        if (l.status === 'published') incrementLessonViews(l.id);

        const [s, published] = await Promise.all([getSeries(l.series_id), getLessonsBySeries(l.series_id, false)]);
        const cat = s ? await getCategory(s.category_id) : null;

        if (isMounted) {
          setLesson(l);
          setSeries(s);
          setCategory(cat);
          setSeriesLessons(published);
          setResumeAt(linkedSecond || getResumeSeconds(l.id));
          saveRecentLesson({ id: l.id, title: l.title, seriesTitle: s?.title });
        }
      } catch (err) {
        console.error('Failed to load lesson:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
    // linkedSecond only matters for the lesson being opened, so it is not a reason to load again
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return { lesson, series, category, seriesLessons, loading, resumeAt };
}
