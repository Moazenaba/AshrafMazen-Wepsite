import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ArrowLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { getCategoryBySlug, getSeriesByCategory, getLessonsBySeries } from '../services/dataService';
import { getCategoryColorTheme } from '../utils/helpers';
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
        // Get published lesson count for each series
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-48 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
        <div className="h-16 w-80 bg-stone-200 dark:bg-stone-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="h-44 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
          <div className="h-44 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h2 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">
            القسم غير موجود
          </h2>
          <p className="text-stone-500 dark:text-stone-400">
            عذراً، لم يتم العثور على القسم المطلوب أو ربما تم نقله.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 text-white font-semibold text-sm"
          >
            <span>العودة للرئيسية</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Link to="/" className="hover:text-emerald-700 dark:hover:text-amber-300">
          الرئيسية
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-emerald-800 dark:text-amber-400 font-semibold">{category.name}</span>
      </nav>

      {/* Category Header */}
      {(() => {
        const catTheme = getCategoryColorTheme(category.color);
        return (
          <>
            <div className={`p-8 sm:p-10 rounded-3xl ${catTheme.cardBg} border ${catTheme.cardBorder} relative overflow-hidden`}>
              <div className="max-w-3xl space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${catTheme.badgeBg} ${catTheme.badgeText} border ${catTheme.badgeBorder}`}>
                  <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} />
                  <span>قسم علمي</span>
                </div>
                <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
                  {category.name}
                </h1>
                <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                  تصفح السلاسل العلمية والشروحات المندرجة تحت هذا الباب من أبواب العلم الشرعي.
                </p>
              </div>
            </div>

            {/* Series Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <h2 className="font-amiri text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  السلاسل العلمية المتاحة ({seriesList.length})
                </h2>
              </div>

              {seriesList.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 font-cairo">
                  لا توجد سلاسل في هذا القسم بعد.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {seriesList.map((series) => (
                    <Link
                      key={series.id}
                      to={`/series/${series.slug}`}
                      className={`group p-7 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} transition-all shadow-xs hover:shadow-md flex flex-col justify-between`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${catTheme.iconBg} ${catTheme.badgeBorder}`}>
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                            {series.lessonCount} {series.lessonCount === 1 ? 'درس' : 'دروس'}
                          </span>
                        </div>

                        <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                          {series.title}
                        </h3>

                        {series.description && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {series.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-6 mt-4 border-t border-stone-200/50 dark:border-stone-800/80 flex items-center justify-between text-xs">
                        <span className="text-stone-400 font-medium">مكتملة ومتاحة للمتابعة</span>
                        <span className="font-semibold text-emerald-800 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                          <span>عرض الدروس</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
};
