import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, Clock, Eye, Headphones, Loader2, RefreshCw, Users, Video, BookOpen } from 'lucide-react';
import { getAdminStats, type AdminStats } from '../../services/analytics';
import { getAllBooksAdmin } from '../../services/dataService';
import { useYoutubeLibrary } from '../../lib/youtubeLibrary';
import type { Lesson } from '../../types';

const nf = new Intl.NumberFormat('ar-EG');
const n = (value: number) => nf.format(Math.round(value));

// Seconds as hours and minutes, in words: "٣ ساعات و١٥ دقيقة", "٤٥ دقيقة", "أقل من دقيقة"
function duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return seconds > 0 ? 'أقل من دقيقة' : '٠';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${n(m)} دقيقة`;
  const hours = h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : h <= 10 ? `${n(h)} ساعات` : `${n(h)} ساعة`;
  return m ? `${hours} و${n(m)} دقيقة` : hours;
}

const hoursOnly = (seconds: number) => nf.format(Math.round((seconds / 3600) * 10) / 10);

type ItemRow = {
  key: string;
  title: string;
  kind: 'lesson' | 'yt' | 'book';
  views: number;
  video: number;
  audio: number;
  read: number;
};

type Sort = 'views' | 'time';
type ChartMetric = 'visitors' | 'views' | 'hours';

const KIND_LABEL: Record<ItemRow['kind'], string> = { lesson: 'درس', yt: 'فيديو القناة', book: 'كتاب' };

// The admin's "الإحصائيات" tab: who is here now, how much is watched, heard and read, and by which item
export const StatsPanel: React.FC<{ lessons: Pick<Lesson, 'id' | 'title'>[] }> = ({ lessons }) => {
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

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20 text-stone-500">
        <Loader2 className="w-6 h-6 animate-spin" aria-label="جارٍ التحميل" />
      </div>
    );
  }

  const t = stats?.totals || {};
  const totalViews = (t.views_video || 0) + (t.views_audio || 0) + (t.views_read || 0);
  const totalSeconds = (t.seconds_video || 0) + (t.seconds_audio || 0) + (t.seconds_read || 0);
  const max = Math.max(1, ...series.map((s) => s.value));

  const card = 'bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800';
  const label = 'text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1.5';
  const big = 'mt-2 font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100 tabular-nums';

  return (
    <div className="space-y-6">
      <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">الإحصائيات</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            أرقام مجهولة الهوية من زوار الموقع: لا حسابات ولا بيانات شخصية. تتحدث تلقائياً كل ٢٠ ثانية.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold"
        >
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          تحديث{updatedAt ? ` (${updatedAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })})` : ''}
        </button>
      </div>

      {error && (
        <p role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm font-semibold">
          {error}
        </p>
      )}

      {stats && (
        <>
          <section aria-label="الزوار" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`${card} bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900`}>
              <p className={label}>
                <Activity className="w-4 h-4" aria-hidden="true" />
                على الموقع الآن
              </p>
              <p className={big} aria-live="polite">{n(stats.live)}</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">نشطون خلال آخر دقيقتين</p>
            </div>
            <div className={card}>
              <p className={label}>
                <Users className="w-4 h-4" aria-hidden="true" />
                زوار اليوم
              </p>
              <p className={big}>{n(stats.visitors_today)}</p>
            </div>
            <div className={card}>
              <p className={label}>
                <Users className="w-4 h-4" aria-hidden="true" />
                آخر ٧ أيام
              </p>
              <p className={big}>{n(stats.visitors_7d)}</p>
            </div>
            <div className={card}>
              <p className={label}>
                <Users className="w-4 h-4" aria-hidden="true" />
                آخر ٣٠ يوماً
              </p>
              <p className={big}>{n(stats.visitors_30d)}</p>
            </div>
          </section>

          <section aria-label="المشاهدات وساعات المتابعة" className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className={card}>
              <p className={label}>
                <Eye className="w-4 h-4" aria-hidden="true" />
                إجمالي المشاهدات داخل الموقع
              </p>
              <p className={big}>{n(totalViews)}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {[
                  { name: 'مرئي', value: t.views_video, Icon: Video },
                  { name: 'صوتي', value: t.views_audio, Icon: Headphones },
                  { name: 'مكتوب', value: t.views_read, Icon: BookOpen },
                ].map(({ name, value, Icon }) => (
                  <div key={name} className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3">
                    <dt className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {name}
                    </dt>
                    <dd className="mt-1 font-bold tabular-nums text-stone-900 dark:text-stone-100">{n(value || 0)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
                فتح الصفحات: {n(t.pageviews || 0)} مرة. المشاهدة تُحسب مرة لكل متصفح في كل زيارة.
              </p>
            </div>

            <div className={card}>
              <p className={label}>
                <Clock className="w-4 h-4" aria-hidden="true" />
                إجمالي وقت المتابعة
              </p>
              <p className={big}>{duration(totalSeconds)}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
                {[
                  { name: 'مشاهدة', value: t.seconds_video, Icon: Video },
                  { name: 'استماع', value: t.seconds_audio, Icon: Headphones },
                  { name: 'قراءة', value: t.seconds_read, Icon: BookOpen },
                ].map(({ name, value, Icon }) => (
                  <div key={name} className="rounded-xl bg-stone-50 dark:bg-stone-800 p-3">
                    <dt className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {name}
                    </dt>
                    <dd className="mt-1 font-bold text-stone-900 dark:text-stone-100">{duration(value || 0)}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">
                الوقت الفعلي للتشغيل (القفز في الفيديو لا يُحسب). القراءة: الوقت الذي تبقى فيه صفحة النص أو الكتاب مفتوحة ومرئية.
              </p>
            </div>
          </section>

          <section aria-label="آخر ٣٠ يوماً" className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold text-stone-900 dark:text-stone-100">آخر ٣٠ يوماً</h3>
              <div role="group" aria-label="المقياس" className="inline-flex p-1 rounded-xl bg-stone-100 dark:bg-stone-800">
                {([
                  ['visitors', 'الزوار'],
                  ['views', 'المشاهدات'],
                  ['hours', 'الساعات'],
                ] as const).map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={metric === value}
                    onClick={() => setMetric(value)}
                    className={`h-9 px-4 rounded-lg text-sm font-semibold ${
                      metric === value ? 'bg-white dark:bg-stone-700 text-emerald-800 dark:text-emerald-300' : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-end gap-[3px] h-40" role="img" aria-label={`رسم بياني: ${series.reduce((a, s) => a + s.value, 0).toFixed(metric === 'hours' ? 1 : 0)} إجمالاً في آخر ٣٠ يوماً`}>
              {series.map((s) => (
                <div key={s.day} className="flex-1 h-full flex items-end" title={`${s.day}: ${metric === 'hours' ? hoursOnly(s.value * 3600) : n(s.value)}`}>
                  <div
                    className="w-full rounded-t bg-emerald-700 dark:bg-emerald-500"
                    style={{ height: `${Math.max(s.value > 0 ? 3 : 0, (s.value / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-stone-500 dark:text-stone-400 tabular-nums" aria-hidden="true">
              <span>{series[0]?.day.slice(5)}</span>
              <span>الأعلى: {metric === 'hours' ? hoursOnly(max * 3600) : n(max)}</span>
              <span>{series[series.length - 1]?.day.slice(5)}</span>
            </div>
            <table className="sr-only">
              <caption>القيم اليومية</caption>
              <tbody>
                {series.map((s) => (
                  <tr key={s.day}>
                    <th scope="row">{s.day}</th>
                    <td>{metric === 'hours' ? hoursOnly(s.value * 3600) : n(s.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section aria-labelledby="items-heading" className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="items-heading" className="font-semibold text-stone-900 dark:text-stone-100">
                كل محتوى على حدة ({n(rows.length)})
              </h3>
              <div className="flex flex-wrap gap-2">
                <label htmlFor="stats-query" className="sr-only">بحث</label>
                <input
                  id="stats-query"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث بالعنوان..."
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                />
                <label htmlFor="stats-sort" className="sr-only">ترتيب</label>
                <select
                  id="stats-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="h-10 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100"
                >
                  <option value="views">الأكثر مشاهدة</option>
                  <option value="time">الأطول وقتاً</option>
                </select>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="mt-4 text-stone-600 dark:text-stone-400">لا توجد مشاهدات مسجّلة بعد. ستظهر هنا فور أن يبدأ الزوار بالمتابعة.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm text-start min-w-[640px]">
                  <thead className="text-stone-600 dark:text-stone-400">
                    <tr>
                      <th scope="col" className="py-2 pe-3 text-start font-semibold">العنوان</th>
                      <th scope="col" className="py-2 px-3 text-start font-semibold">النوع</th>
                      <th scope="col" className="py-2 px-3 text-start font-semibold">المشاهدات</th>
                      <th scope="col" className="py-2 px-3 text-start font-semibold">مشاهدة</th>
                      <th scope="col" className="py-2 px-3 text-start font-semibold">استماع</th>
                      <th scope="col" className="py-2 ps-3 text-start font-semibold">قراءة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.slice(0, 200).map((r) => (
                      <tr key={r.key} className="border-t border-stone-100 dark:border-stone-800 text-stone-800 dark:text-stone-200">
                        <th scope="row" className="py-2.5 pe-3 text-start font-medium max-w-xs truncate" title={r.title}>{r.title}</th>
                        <td className="py-2.5 px-3 whitespace-nowrap">{KIND_LABEL[r.kind]}</td>
                        <td className="py-2.5 px-3 tabular-nums font-bold">{n(r.views)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{r.video ? duration(r.video) : '—'}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{r.audio ? duration(r.audio) : '—'}</td>
                        <td className="py-2.5 ps-3 whitespace-nowrap">{r.read ? duration(r.read) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {shown.length > 200 && <p className="mt-3 text-xs text-stone-600 dark:text-stone-400">يُعرض أول ٢٠٠ نتيجة؛ استخدم البحث للوصول إلى غيرها.</p>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
