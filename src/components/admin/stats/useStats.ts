// The statistics screen's data: loading it (and refreshing it while the tab is open), naming each item, sorting, filtering and the daily chart series.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminStats, type AdminStats } from '../../../services/analytics';
import { getAllBooksAdmin } from '../../../services/dataService';
import { useYoutubeLibrary } from '../../../lib/youtubeLibrary';
import { type Lesson } from '../../../types';
import { type ItemRow, type Sort, type ChartMetric } from './types';

export function useStats(lessons: Pick<Lesson, 'id' | 'title'>[]) {
  const library = useYoutubeLibrary();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [books, setBooks] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [sort, setSort] = useState<Sort>('views');
  const [query, setQuery] = useState('');
  const [metric, setMetric] = useState<ChartMetric>('visitors');

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      setError(null);
      setStats(await getAdminStats(30));
      setUpdatedAt(new Date());
    } catch (err: any) {
      setError(
        /admins only|function|does not exist|schema cache/i.test(err?.message || '')
          ? `تعذّر قراءة الإحصائيات: ${err.message}. تأكد أن ملف docs/migrations/2026-11-04-analytics.sql شُغّل، وأنك داخل بحساب الإدارة.`
          : err?.message || 'تعذّر تحميل الإحصائيات.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    getAllBooksAdmin()
      .then((list) => setBooks(list.map((b) => ({ id: b.id, title: b.title }))))
      .catch(() => {});
    // The live number and the totals stay current while the tab is open
    const timer = window.setInterval(() => document.visibilityState === 'visible' && load(true), 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const titles = useMemo(() => {
    const map = new Map<string, string>();
    lessons.forEach((l) => map.set(`lesson:${l.id}`, l.title));
    books.forEach((b) => map.set(`book:${b.id}`, b.title));
    library.forEach((p) => p.videos.forEach((v) => map.set(`yt:${v.id}`, v.title)));
    return map;
  }, [lessons, books, library]);

  const rows = useMemo<ItemRow[]>(() => {
    if (!stats) return [];
    return stats.items.map((item) => ({
      key: item.key,
      kind: item.key.split(':')[0] as ItemRow['kind'],
      title: titles.get(item.key) || '(محتوى محذوف أو غير معروف)',
      views: Number(item.views) || 0,
      video: Number(item.video_seconds) || 0,
      audio: Number(item.audio_seconds) || 0,
      read: Number(item.read_seconds) || 0,
    }));
  }, [stats, titles]);

  const shown = useMemo(() => {
    const q = query.trim();
    const list = rows.filter((r) => !q || r.title.includes(q));
    return list.sort((a, b) => (sort === 'views' ? b.views - a.views : b.video + b.audio + b.read - (a.video + a.audio + a.read)));
  }, [rows, query, sort]);

  // One value per day for the chart, with the days that had nothing shown as zero
  const series = useMemo(() => {
    if (!stats) return [];
    const days: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const byDay = new Map<string, number>();
    const add = (day: string, value: number) => byDay.set(day, (byDay.get(day) || 0) + value);
    if (metric === 'visitors') stats.daily_visitors.forEach((v) => add(String(v.day).slice(0, 10), Number(v.visitors)));
    else
      stats.daily.forEach((d) => {
        const day = String(d.day).slice(0, 10);
        if (metric === 'views' && d.metric.startsWith('views_')) add(day, Number(d.value));
        if (metric === 'hours' && d.metric.startsWith('seconds_')) add(day, Number(d.value) / 3600);
      });
    return days.map((day) => ({ day, value: byDay.get(day) || 0 }));
  }, [stats, metric]);

  return { stats, error, loading, updatedAt, sort, setSort, query, setQuery, metric, setMetric, rows, shown, series, load };
}
