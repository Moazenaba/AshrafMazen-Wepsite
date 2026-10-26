import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Calendar,
  Layers,
  ArrowLeft,
  Video,
  Headphones,
  FileText,
  Sparkles,
  Scroll
} from 'lucide-react';
import { getCategories, getLatestLessons, getAllSeries } from '../services/dataService';
import { formatArabicDate, getCategoryColorTheme } from '../utils/helpers';
import type { Category, Series } from '../types';

interface LessonWithSeries {
  id: string;
  series_id: string;
  lesson_number: number;
  title: string;
  youtube_url: string;
  audio_url: string;
  transcript: string;
  status: string;
  published_at: string | null;
  created_at: string;
  series?: Series | null;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestLessons, setLatestLessons] = useState<LessonWithSeries[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        setLoading(true);
        const [cats, latest, allSer] = await Promise.all([
          getCategories(),
          getLatestLessons(6),
          getAllSeries(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setLatestLessons(latest);
          setSeriesList(allSer);
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getSeriesCountForCategory = (catId: string) => {
    return seriesList.filter((s) => s.category_id === catId).length;
  };

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-20 bg-gradient-to-b from-emerald-950/10 via-emerald-900/5 to-transparent border-b border-stone-200/60 dark:border-stone-800/60">
        {/* Subtle decorative Islamic pattern background element */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none flex items-center justify-center">
          <Scroll className="w-[600px] h-[600px]" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          {/* Sheikh Name Badge & Header */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/10 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-800/20 dark:border-emerald-500/20 text-xs sm:text-sm font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>المكتبة العلمية والتأصيلية</span>
          </div>

          <h1 className="font-amiri text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100 drop-shadow-sm leading-tight sm:leading-snug">
            الشيخ أشرف مازن
          </h1>

          <p className="font-cairo text-lg sm:text-xl md:text-2xl text-stone-700 dark:text-stone-300 max-w-2xl mx-auto font-medium leading-relaxed">
            شروحات، خطب، ودروس علمية مرئية ومسموعة ومكتوبة
          </p>

          <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            مكتبة جامعة لنشر العلم الشرعي المؤصل، شروحات المتون في العقيدة والفقه والأصول، مع تفريغات مقروءة وتسجيلات عالية الجودة.
          </p>

          {/* Quick Search Bar */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان درس، باب، أو مسألة علمية..."
                className="w-full pl-28 pr-12 py-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 focus:border-transparent text-stone-800 dark:text-stone-100 placeholder-stone-400 shadow-lg text-sm sm:text-base transition-all"
              />
              <Search className="w-5 h-5 text-stone-400 absolute right-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute left-2.5 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
              >
                بحث
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section: "الجديد" (Latest Lessons) */}
        <section id="latest" className="space-y-8 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 dark:text-amber-400 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4" />
                <span>أحدث الإضافات</span>
              </div>
              <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
                الجديد من الدروس
              </h2>
            </div>
            <Link
              to="/search"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 dark:text-amber-400 hover:underline"
            >
              <span>تصفح جميع الدروس</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-stone-200 dark:bg-stone-800 animate-pulse"
                />
              ))}
            </div>
          ) : latestLessons.length === 0 ? (
            <div className="p-10 text-center text-stone-500 bg-stone-100 dark:bg-stone-900 rounded-2xl font-cairo">
              لا توجد مواد منشورة بعد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestLessons.map((lesson) => {
                const cat = lesson.series ? catMap.get(lesson.series.category_id) : null;
                const catTheme = getCategoryColorTheme(cat?.color);

                return (
                  <Link
                    key={lesson.id}
                    to={`/lesson/${lesson.id}`}
                    className={`group block p-6 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} shadow-xs hover:shadow-md transition-all relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-3">
                      <span className={`font-semibold px-2.5 py-1 rounded-lg border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                        {lesson.series?.title || 'سلسلة علمية'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatArabicDate(lesson.published_at || lesson.created_at)}
                      </span>
                    </div>

                    <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors line-clamp-2 mb-4 leading-snug">
                      {lesson.title}
                    </h3>

                    {/* Available Media Formats indicator */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-200/50 dark:border-stone-800/80 text-xs">
                      <div className="flex items-center gap-2">
                        {lesson.youtube_url && (
                          <span
                            title="مرئي (يوتيوب)"
                            className="p-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          >
                            <Video className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {lesson.audio_url && (
                          <span
                            title="مسموع (صوت)"
                            className="p-1.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                          >
                            <Headphones className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {lesson.transcript && (
                          <span
                            title="تفريغ مكتوب"
                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-emerald-800 dark:text-amber-400 font-semibold flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                        <span>عرض الدرس</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Section: "العلوم الشرعية" (Categories) */}
        <section id="categories" className="space-y-8 scroll-mt-24">
          <div className="border-b border-stone-200 dark:border-stone-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-amber-400 font-semibold text-xs mb-1">
              <Layers className="w-4 h-4" />
              <span>المتون والشروحات</span>
            </div>
            <h2 className="font-amiri text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
              العلوم الشرعية
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
              أبواب العلم المصنفة بحسب الفنون والمتون التأصيلية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const seriesCount = getSeriesCountForCategory(cat.id);
              const catTheme = getCategoryColorTheme(cat.color);

              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className={`group relative p-7 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} transition-all shadow-xs hover:shadow-md flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform border ${catTheme.iconBg} ${catTheme.badgeBorder}`}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <span className={`w-3 h-3 rounded-full ${catTheme.dot} shadow-xs ring-4 ring-white dark:ring-stone-900`} />
                    </div>

                    <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 transition-colors">
                      {cat.name}
                    </h3>
                  </div>

                  <div className="pt-6 mt-4 border-t border-stone-200/50 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span className="font-medium">
                      {seriesCount} {seriesCount === 1 ? 'سلسلة علمية' : 'سلاسل علمية'}
                    </span>
                    <span className="font-semibold text-emerald-800 dark:text-amber-400 flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform">
                      <span>تصفح السلاسل</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
