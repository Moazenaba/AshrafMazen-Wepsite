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
  Layers,
  Eye,
} from 'lucide-react';
import { getSeriesBySlug, getCategory, getLessonsBySeries } from '../services/dataService';
import {
  getArabicLessonOrdinal,
  formatArabicDate,
  formatArabicViews,
  getCategoryColorTheme,
} from '../utils/helpers';
import { PublicSidebar } from '../components/PublicSidebar';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="h-6 w-56 bg-stone-200 dark:bg-[#151f1a] rounded animate-pulse" />
        <div className="h-32 bg-stone-200 dark:bg-[#151f1a] rounded-2xl animate-pulse" />
        <div className="space-y-4 pt-6">
          <div className="h-20 bg-stone-200 dark:bg-[#151f1a] rounded-xl animate-pulse" />
          <div className="h-20 bg-stone-200 dark:bg-[#151f1a] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-12 rounded-3xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] shadow-sm space-y-4">
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

  const catTheme = getCategoryColorTheme(category?.color);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
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

      {/* Series Hero Info with Solid Color and Gold Accent Line */}
      <div className="rounded-2xl overflow-hidden border border-stone-200/90 dark:border-[#22302a] shadow-sm">
        <div className={`${catTheme.headerBg} p-6 sm:p-9 relative text-white border-b-4 border-amber-400`}>
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)`,
              backgroundSize: '16px 16px',
            }}
          />

          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              {category && (
                <Link
                  to={`/category/${category.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/20 hover:bg-white/30 transition-all font-cairo"
                >
                  <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} />
                  <Layers className="w-3.5 h-3.5" />
                  <span>{category.name}</span>
                </Link>
              )}
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-cairo">
                {lessons.length} {lessons.length === 1 ? 'درس منشور' : 'دروس منشورة'}
              </span>
            </div>

            <h1 className="font-amiri text-3xl sm:text-5xl font-bold text-white drop-shadow-xs">
              {series.title}
            </h1>

            {series.description && (
              <p className="text-xs sm:text-base text-white/85 font-cairo max-w-3xl leading-relaxed">
                {series.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Content (8 cols) + Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#22302a] pb-3">
            <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800 dark:text-amber-400" />
              <span>دروس السلسلة بالترتيب</span>
            </h2>
            <span className="text-xs text-stone-500 font-cairo">مرتبة من البداية للختام</span>
          </div>

          {lessons.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151f1a] border border-stone-200 dark:border-[#22302a] text-stone-500 font-cairo">
              لا توجد دروس في هذه السلسلة بعد.
            </div>
          ) : (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  to={`/lesson/${lesson.id}`}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl ${catTheme.cardBg} border ${catTheme.cardBorder} hover:shadow-md transition-all`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    {/* Arabic Ordinal Badge */}
                    <div
                      className={`shrink-0 px-3 py-1.5 rounded-lg ${catTheme.badgeBg} border ${catTheme.badgeBorder} ${catTheme.badgeText} text-xs sm:text-sm font-bold font-amiri text-center min-w-[90px]`}
                    >
                      {getArabicLessonOrdinal(lesson.lesson_number)}
                    </div>

                    {/* Title and date & views */}
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500 font-cairo">
                        {lesson.published_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatArabicDate(lesson.published_at)}</span>
                          </span>
                        )}
                        {typeof lesson.views === 'number' && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-stone-400" />
                              <span>{formatArabicViews(lesson.views)} مشاهدة</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Media indicators & CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/50 dark:border-[#22302a] shrink-0">
                    <div className="flex items-center gap-1.5">
                      {lesson.youtube_url && (
                        <span
                          title="يتوفر فيديو مرئي"
                          className="p-1.5 rounded-md bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                        >
                          <Video className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {lesson.audio_url && (
                        <span
                          title="يتوفر تسجيل صوتي"
                          className="p-1.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {lesson.transcript && (
                        <span
                          title="يتوفر تفريغ مكتوب"
                          className="p-1.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-amber-400 group-hover:translate-x-[-3px] transition-transform">
                      <span>متابعة الدرس</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <PublicSidebar />
        </div>
      </div>
    </div>
  );
};
