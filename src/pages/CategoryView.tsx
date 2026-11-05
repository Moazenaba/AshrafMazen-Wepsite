import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { getCategoryBySlug, getSeriesByCategory, getLessonsBySeries } from '../services/dataService';
import { formatArabicCount, COUNT_FORMS } from '../utils/helpers';
import type { Category, Series } from '../types';

interface SeriesWithCount extends Series {
  lessonCount: number;
}

export const CategoryView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [seriesList, setSeriesList] = useState<SeriesWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!slug) return;
      try {
        setLoading(true);
        const cat = await getCategoryBySlug(slug);
        if (!cat) {
          if (isMounted) {
            setCategory(null);
            setLoading(false);
          }
          return;
        }

        const series = await getSeriesByCategory(cat.id);
        const seriesWithCounts = await Promise.all(
          series.map(async (s) => {
            const publishedLessons = await getLessonsBySeries(s.id, false);
            return {
              ...s,
              lessonCount: publishedLessons.length,
            };
          })
        );

        if (isMounted) {
          setCategory(cat);
          setSeriesList(seriesWithCounts);
        }
      } catch (err) {
        console.error('Failed to load category:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6" aria-busy="true">
        <div className="h-5 w-40 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="h-10 w-64 bg-stone-200 dark:bg-stone-900 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
          <div className="h-32 bg-stone-200 dark:bg-stone-900 rounded-xl" />
          <div className="h-32 bg-stone-200 dark:bg-stone-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-20 space-y-4">
        <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">القسم غير موجود</h1>
        <p className="text-stone-600 dark:text-stone-400">لم نجد هذا القسم، وربما تغيّر رابطه.</p>
        <Link to="/" className="inline-flex items-center min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const publishedSeries = seriesList.filter((s) => s.lessonCount > 0);
  const totalLessons = publishedSeries.reduce((sum, s) => sum + s.lessonCount, 0);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      <header data-reveal className="space-y-4">
        <nav aria-label="مسار التصفح" className="flex items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            الرئيسية
          </Link>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <Link to={{ pathname: '/', hash: '#categories' }} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            الأقسام
          </Link>
        </nav>

        <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-emerald-950 dark:text-stone-100">{category.name}</h1>

        {category.description?.trim() && (
          <p className="text-lg text-stone-700 dark:text-stone-300 max-w-2xl leading-loose">{category.description}</p>
        )}

        {publishedSeries.length > 0 && (
          <p className="text-stone-600 dark:text-stone-400">
            {formatArabicCount(publishedSeries.length, COUNT_FORMS.series)} ·{' '}
            {formatArabicCount(totalLessons, COUNT_FORMS.lesson)}
          </p>
        )}
      </header>

      <section aria-labelledby="series-heading" className="space-y-4">
        <h2 id="series-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
          السلاسل
        </h2>

        {publishedSeries.length === 0 ? (
          <p className="text-stone-600 dark:text-stone-400">
            لم تُنشر سلاسل في هذا القسم بعد.{' '}
            <Link to="/search" className="font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
              تصفح كل الدروس
            </Link>
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedSeries.map((s, i) => (
              <li key={s.id} data-reveal style={{ '--reveal-delay': `${Math.min(i, 6) * 70}ms` } as React.CSSProperties}>
                <Link
                  to={`/series/${s.slug}`}
                  className="card group block h-full p-6 space-y-2"
                >
                  <span className="block font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                    {s.title}
                  </span>
                  {s.description?.trim() && (
                    <span className="block text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-2">
                      {s.description}
                    </span>
                  )}
                  <span className="block text-sm text-stone-600 dark:text-stone-400">
                    {formatArabicCount(s.lessonCount, COUNT_FORMS.lesson)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
