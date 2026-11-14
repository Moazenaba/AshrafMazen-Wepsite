import React, { useEffect, useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { getSeriesBySlug, getCategory, getLessonsBySeries } from '../services/dataService';
import { formatArabicDate, formatArabicCount, COUNT_FORMS } from '../utils/helpers';
import { isLessonWatched } from '../services/progressService';
import { LessonThumb } from '../components/LessonThumb';
import { MediaIcons } from '../components/MediaIcons';
import type { Series, Category, Lesson } from '../types';

export const SeriesView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  usePageTitle(series?.title);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSeriesData() {
      if (!slug) return;
      try {
        setLoading(true);
        const s = await getSeriesBySlug(slug);
        if (!s) {
          if (isMounted) {
            setSeries(null);
            setLoading(false);
          }
          return;
        }

        const [cat, pubLessons] = await Promise.all([
          getCategory(s.category_id),
          getLessonsBySeries(s.id, false), // Visitors must NEVER see drafts
        ]);

        if (isMounted) {
          setSeries(s);
          setCategory(cat);
          setLessons(pubLessons);
        }
      } catch (err) {
        console.error('Failed to load series:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSeriesData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6" aria-busy="true">
        <div className="h-5 w-48 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="h-10 w-72 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="space-y-2 pt-4">
          <div className="h-16 bg-stone-200 dark:bg-stone-900 rounded-xl" />
          <div className="h-16 bg-stone-200 dark:bg-stone-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 space-y-4">
        <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">السلسلة غير موجودة</h1>
        <p className="text-stone-600 dark:text-stone-400">لم نجد هذه السلسلة، وربما تغيّر رابطها.</p>
        <Link to="/" className="inline-flex items-center min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const firstLesson = lessons[0];
  const watchedCount = lessons.filter((l) => isLessonWatched(l.id)).length;
  const watchedPercent = lessons.length ? Math.round((watchedCount / lessons.length) * 100) : 0;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <header data-reveal className="space-y-4">
        <nav aria-label="مسار التصفح" className="flex items-center flex-wrap gap-1 text-sm text-stone-600 dark:text-stone-400">
          <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            الرئيسية
          </Link>
          {category && (
            <>
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              <Link to={`/category/${category.slug}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
                {category.name}
              </Link>
            </>
          )}
        </nav>

        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-emerald-950 dark:text-stone-100">{series.title}</h1>

        {series.description?.trim() && (
          <p className="text-lg text-stone-700 dark:text-stone-300 max-w-2xl leading-loose">{series.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 pt-1">
          {firstLesson && (
            <Link
              to={`/lesson/${firstLesson.id}`}
              className="press inline-flex items-center h-12 px-7 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold"
            >
              ابدأ من الدرس الأول
            </Link>
          )}
          <span className="text-stone-600 dark:text-stone-400">{formatArabicCount(lessons.length, COUNT_FORMS.lesson)}</span>
        </div>
        {lessons.length > 0 && (
          <div className="max-w-md space-y-2">
            <div className="flex items-baseline justify-between gap-4 text-sm text-stone-600 dark:text-stone-400">
              <span>تمّت متابعة {formatArabicCount(watchedCount, COUNT_FORMS.lesson)}</span>
              <span className="tabular-nums">{new Intl.NumberFormat('ar-EG').format(watchedPercent)}٪</span>
            </div>
            <div
              role="progressbar"
              aria-label="تقدّم السلسلة"
              aria-valuemin={0}
              aria-valuemax={lessons.length}
              aria-valuenow={watchedCount}
              className="h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-gold transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${watchedPercent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      <section aria-labelledby="lessons-heading" className="space-y-4">
        <h2 id="lessons-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
          الدروس
        </h2>

        {lessons.length === 0 ? (
          <p className="text-stone-600 dark:text-stone-400">لم تُنشر دروس في هذه السلسلة بعد.</p>
        ) : (
          <ol data-reveal className="card p-2 sm:p-3">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  to={`/lesson/${lesson.id}`}
                  className="group flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <span className="w-8 shrink-0 text-lg font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                    {new Intl.NumberFormat('ar-EG').format(lesson.lesson_number)}
                  </span>
                  <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} imageUrl={lesson.image} className="w-24 sm:w-36 shrink-0" />
                  <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="flex items-center gap-2 text-lg font-semibold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                      <span className="min-w-0">{lesson.title}</span>
                      {isLessonWatched(lesson.id) && (
                        <Check className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="تمّت متابعته" />
                      )}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-stone-600 dark:text-stone-400">
                      <span>{formatArabicDate(lesson.published_at)}</span>
                      <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
};
