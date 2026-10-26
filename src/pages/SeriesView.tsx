import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Video,
  Headphones,
  FileText,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Layers
} from 'lucide-react';
import { getSeriesBySlug, getCategory, getLessonsBySeries } from '../services/dataService';
import { getArabicLessonOrdinal, formatArabicDate, getCategoryColorTheme } from '../utils/helpers';
import type { Series, Category, Lesson } from '../types';

export const SeriesView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-56 bg-stone-200 dark:bg-stone-800 rounded animate-pulse" />
        <div className="h-28 bg-stone-200 dark:bg-stone-800 rounded-3xl animate-pulse" />
        <div className="space-y-4 pt-6">
          <div className="h-20 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
          <div className="h-20 bg-stone-200 dark:bg-stone-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <h2 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">
            السلسلة غير موجودة
          </h2>
          <p className="text-stone-500 dark:text-stone-400">
            عذراً، لم نتمكن من العثور على السلسلة العلمية المطلوبة.
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
      <nav className="flex items-center flex-wrap gap-2 text-xs text-stone-500 dark:text-stone-400">
        <Link to="/" className="hover:text-emerald-700 dark:hover:text-amber-300">
          الرئيسية
        </Link>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        {category && (
          <>
            <Link
              to={`/category/${category.slug}`}
              className="hover:text-emerald-700 dark:hover:text-amber-300"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </>
        )}
        <span className="text-emerald-800 dark:text-amber-400 font-semibold">{series.title}</span>
      </nav>

      {/* Series Hero Info */}
      {(() => {
        const catTheme = getCategoryColorTheme(category?.color);
        return (
          <div className={`p-8 sm:p-10 rounded-3xl ${catTheme.cardBg} border ${catTheme.cardBorder} space-y-4`}>
            <div className="flex flex-wrap items-center gap-3">
              {category && (
                <Link
                  to={`/category/${category.slug}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${catTheme.badgeBg} ${catTheme.badgeText} border ${catTheme.badgeBorder} hover:scale-105 transition-all`}
                >
                  <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} />
                  <Layers className="w-3.5 h-3.5" />
                  <span>{category.name}</span>
                </Link>
              )}
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                {lessons.length} {lessons.length === 1 ? 'درس منشور' : 'دروس منشورة'}
              </span>
            </div>

            <h1 className="font-amiri text-4xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
              {series.title}
            </h1>

            {series.description && (
              <p className="text-base sm:text-lg text-stone-700 dark:text-stone-300 font-cairo max-w-3xl leading-relaxed">
                {series.description}
              </p>
            )}
          </div>
        );
      })()}

      {/* Lessons List with Arabic Ordinals */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <h2 className="font-amiri text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            دروس السلسلة بالترتيب
          </h2>
          <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            مرتبة من البداية إلى الختام
          </span>
        </div>

        {lessons.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-500 font-cairo">
            لا توجد دروس في هذه السلسلة بعد.
          </div>
        ) : (
          <div className="space-y-3.5">
            {lessons.map((lesson) => {
              const catTheme = getCategoryColorTheme(category?.color);

              return (
                <Link
                  key={lesson.id}
                  to={`/lesson/${lesson.id}`}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl ${catTheme.cardBg} border ${catTheme.cardBorder} shadow-xs hover:shadow transition-all`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Arabic Ordinal Badge */}
                    <div className={`shrink-0 px-3.5 py-2 rounded-xl ${catTheme.badgeBg} border ${catTheme.badgeBorder} ${catTheme.badgeText} text-sm font-bold font-amiri text-center min-w-[100px]`}>
                      {getArabicLessonOrdinal(lesson.lesson_number)}
                    </div>

                  {/* Title and date */}
                  <div className="space-y-1">
                    <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                      {lesson.title}
                    </h3>
                    {lesson.published_at && (
                      <p className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1 font-cairo">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>نُشر في: {formatArabicDate(lesson.published_at)}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Media indicators & CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100 dark:border-stone-800/80 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {lesson.youtube_url && (
                      <span
                        title="يتوفر فيديو مرئي"
                        className="p-1.5 rounded-lg bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                      >
                        <Video className="w-4 h-4" />
                      </span>
                    )}
                    {lesson.audio_url && (
                      <span
                        title="يتوفر تسجيل صوتي"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                      >
                        <Headphones className="w-4 h-4" />
                      </span>
                    )}
                    {lesson.transcript && (
                      <span
                        title="يتوفر تفريغ مكتوب"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      >
                        <FileText className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-amber-400 group-hover:translate-x-[-3px] transition-transform">
                    <span>متابعة الدرس</span>
                    <ArrowLeft className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
