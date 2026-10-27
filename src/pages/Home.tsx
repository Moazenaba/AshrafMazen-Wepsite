import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Calendar,
  Layers,
  ArrowLeft,
  Sparkles,
  Eye,
  Flame,
  Mic,
  Video,
  Headphones,
  FileText,
} from 'lucide-react';
import {
  getLatestLessons,
  getFeaturedLessons,
  getTopViewedLessons,
  getKhutabLessons,
  getCategoriesWithPortalData,
  getCategories,
  type LessonWithRelations,
  type CategoryWithPortalData,
  type Category,
} from '../services/dataService';
import { formatArabicDate, formatArabicViews, getCategoryColorTheme } from '../utils/helpers';
import { PortalPanel } from '../components/PortalPanel';
import { FeaturedCarousel } from '../components/FeaturedCarousel';
import { PublicSidebar } from '../components/PublicSidebar';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [portalCategories, setPortalCategories] = useState<CategoryWithPortalData[]>([]);
  const [featuredLessons, setFeaturedLessons] = useState<LessonWithRelations[]>([]);
  const [latestLessons, setLatestLessons] = useState<LessonWithRelations[]>([]);
  const [topViewedLessons, setTopViewedLessons] = useState<LessonWithRelations[]>([]);
  const [khutabLessons, setKhutabLessons] = useState<LessonWithRelations[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPortalData() {
      try {
        setLoading(true);
        const [cats, pCats, feat, latest, top, khutab] = await Promise.all([
          getCategories(),
          getCategoriesWithPortalData(5),
          getFeaturedLessons(5),
          getLatestLessons(8),
          getTopViewedLessons(8),
          getKhutabLessons(8),
        ]);

        if (isMounted) {
          setCategories(cats);
          setPortalCategories(pCats);
          setFeaturedLessons(feat);
          setLatestLessons(latest);
          setTopViewedLessons(top);
          setKhutabLessons(khutab);
        }
      } catch (err) {
        console.error('Failed to load portal home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPortalData();
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

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* 1. HERO BAND (Compact Islamic Portal Header - Intro & Search) */}
      <section className="relative overflow-hidden pt-4 sm:pt-6 pb-6 sm:pb-8 bg-gradient-to-b from-emerald-950/10 via-emerald-900/5 to-transparent border-b border-stone-200/80 dark:border-[#22302a]">
        {/* Subtle Islamic Geometric Star Lattice */}
        <div
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07] pointer-events-none select-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, rgba(5,150,105,0.8) 1.5px, transparent 1.5px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-3">
          <p className="font-cairo text-base sm:text-lg text-emerald-900 dark:text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed px-2">
            شروحات، خطب، ودروس علمية مرئية ومسموعة ومكتوبة
          </p>

          {/* Compact Prominent Search Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center shadow-md rounded-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان درس، باب، أو مسألة علمية..."
                className="w-full pl-24 sm:pl-28 pr-11 sm:pr-12 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-[#151f1a] border border-stone-300 dark:border-[#22302a] focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 focus:border-transparent text-stone-900 dark:text-stone-100 placeholder-stone-400 text-sm sm:text-base transition-all"
              />
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 absolute right-3.5 sm:right-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute left-1.5 sm:left-2 px-4 sm:px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center min-h-[36px]"
              >
                بحث
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Grid (Desktop: Main Column + Sidebar; Mobile: Single Column) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column (8 cols in 12-col grid) */}
          <div className="order-1 lg:col-span-8 space-y-10 sm:space-y-12">
            {/* 2. FEATURED STRIP "اخترنا لك" */}
            <FeaturedCarousel lessons={featuredLessons} loading={loading} />

            {/* 3. THREE-PANEL ROW WITH SOLID COLORED HEADERS */}
            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Panel 1: "الجديد" */}
                <PortalPanel
                  title="الجديد من الدروس"
                  icon={<Sparkles className="w-4 h-4" />}
                  headerBg="bg-emerald-900 dark:bg-[#12281d]"
                  footerLink="/search"
                  footerText="عرض جميع الدروس"
                >
                  <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 bg-stone-100 dark:bg-[#1a261f] rounded my-1 animate-pulse" />
                      ))
                    ) : latestLessons.length === 0 ? (
                      <p className="text-xs text-stone-400 py-6 text-center">لا توجد مواد بعد.</p>
                    ) : (
                      latestLessons.slice(0, 8).map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center justify-between py-2 px-1.5 hover:bg-stone-50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-amiri text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                              {lesson.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 font-cairo">
                              {lesson.series?.title && (
                                <span className="truncate max-w-[110px]">{lesson.series.title}</span>
                              )}
                              {lesson.series?.title && lesson.published_at && <span>•</span>}
                              {lesson.published_at && (
                                <span>{formatArabicDate(lesson.published_at)}</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-stone-400 dark:text-stone-500 text-xs font-cairo">
                            {typeof lesson.views === 'number' && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Eye className="w-3 h-3" />
                                <span>{formatArabicViews(lesson.views)}</span>
                              </span>
                            )}
                            <ArrowLeft className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-700 dark:group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-transform" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </PortalPanel>

                {/* Panel 2: "الأكثر مشاهدة" */}
                <PortalPanel
                  title="الأكثر مشاهدة"
                  icon={<Flame className="w-4 h-4" />}
                  headerBg="bg-emerald-900 dark:bg-[#12281d]"
                  footerLink="/search"
                  footerText="عرض المزيد"
                >
                  <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 bg-stone-100 dark:bg-[#1a261f] rounded my-1 animate-pulse" />
                      ))
                    ) : topViewedLessons.length === 0 ? (
                      <p className="text-xs text-stone-400 py-6 text-center">لا توجد مواد بعد.</p>
                    ) : (
                      topViewedLessons.slice(0, 8).map((lesson, idx) => (
                        <Link
                          key={lesson.id}
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center justify-between py-2 px-1.5 hover:bg-stone-50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-5 h-5 rounded-md bg-amber-400/20 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <h4 className="font-amiri text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 font-cairo">
                                {lesson.series?.title && (
                                  <span className="truncate max-w-[100px]">{lesson.series.title}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-stone-400 dark:text-stone-500 text-xs font-cairo">
                            {typeof lesson.views === 'number' && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-amber-300">
                                <Eye className="w-3 h-3" />
                                <span>{formatArabicViews(lesson.views)}</span>
                              </span>
                            )}
                            <ArrowLeft className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-700 dark:group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-transform" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </PortalPanel>

                {/* Panel 3: "الخطب والمواعظ" */}
                <PortalPanel
                  title="الخطب والمواعظ"
                  icon={<Mic className="w-4 h-4" />}
                  headerBg="bg-emerald-900 dark:bg-[#12281d]"
                  footerLink="/category/khutab"
                  footerText="عرض كافة الخطب"
                >
                  <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-12 bg-stone-100 dark:bg-[#1a261f] rounded my-1 animate-pulse" />
                      ))
                    ) : khutabLessons.length === 0 ? (
                      <div className="py-6 text-center space-y-1">
                        <p className="text-xs text-stone-400">لا توجد خطب منشورة حالياً.</p>
                        <Link to="/search" className="text-xs text-emerald-700 dark:text-amber-400 font-semibold hover:underline">
                          تصفح الدروس البديلة
                        </Link>
                      </div>
                    ) : (
                      khutabLessons.slice(0, 8).map((lesson) => (
                        <Link
                          key={lesson.id}
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center justify-between py-2 px-1.5 hover:bg-stone-50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-amiri text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                              {lesson.title}
                            </h4>
                            {lesson.published_at && (
                              <p className="text-[11px] text-stone-400 dark:text-stone-500 font-cairo">
                                {formatArabicDate(lesson.published_at)}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-stone-400 dark:text-stone-500 text-xs font-cairo">
                            {typeof lesson.views === 'number' && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Eye className="w-3 h-3" />
                                <span>{formatArabicViews(lesson.views)}</span>
                              </span>
                            )}
                            <ArrowLeft className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-700 dark:group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-transform" />
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </PortalPanel>
              </div>
            </section>

            {/* 4. CATEGORIES BLOCK "العلوم الشرعية" (Compact Grid: 4 per row desktop, 2 mobile) */}
            <section id="categories" className="space-y-4 scroll-mt-24">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#22302a] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-800 text-amber-300 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                    العلوم الشرعية والمتون
                  </h2>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-cairo">
                  {categories.length} تخصصات علمية
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
                {portalCategories.map((cat) => {
                  const catTheme = getCategoryColorTheme(cat.color);

                  return (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      className={`group p-4 rounded-xl ${catTheme.cardBg} border ${catTheme.cardBorder} hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center border ${catTheme.iconBg} ${catTheme.badgeBorder}`}
                          >
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full ${catTheme.dot}`} />
                        </div>

                        <h3 className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-400 transition-colors">
                          {cat.name}
                        </h3>
                      </div>

                      <div className="pt-3 mt-3 border-t border-stone-200/50 dark:border-[#22302a] flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-cairo">
                        <span>
                          {cat.seriesCount} سلاسل • {cat.lessonCount} درس
                        </span>
                        <ArrowLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-emerald-700 dark:group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-transform" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* 5. PER-CATEGORY PANELS (2-Column Grid of Categories with Recent Lessons) */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-[#22302a] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                    أقسام العلم والدروس التابعة لها
                  </h2>
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-cairo hidden sm:inline">
                  أحدث المواد في كل فن شرعي
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {portalCategories
                  .filter((cat) => cat.recentLessons.length > 0)
                  .map((cat) => {
                    const theme = getCategoryColorTheme(cat.color);

                    return (
                      <PortalPanel
                        key={cat.id}
                        title={cat.name}
                        icon={<BookOpen className="w-4 h-4" />}
                        headerBg={theme.headerBg}
                        actionLink={`/category/${cat.slug}`}
                        actionText="عرض القسم"
                        footerLink={`/category/${cat.slug}`}
                        footerText={`عرض كافة دروس ${cat.name} (${cat.lessonCount} درس)`}
                      >
                        <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
                          {cat.recentLessons.map((lesson) => (
                            <Link
                              key={lesson.id}
                              to={`/lesson/${lesson.id}`}
                              className="flex items-center justify-between py-2 px-1.5 hover:bg-stone-50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="font-amiri text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors truncate">
                                  {lesson.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 font-cairo">
                                  {lesson.series?.title && (
                                    <span className="truncate max-w-[130px]">{lesson.series.title}</span>
                                  )}
                                  {lesson.published_at && (
                                    <span>• {formatArabicDate(lesson.published_at)}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-stone-400 dark:text-stone-500 text-xs font-cairo">
                                {typeof lesson.views === 'number' && (
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Eye className="w-3 h-3" />
                                    <span>{formatArabicViews(lesson.views)}</span>
                                  </span>
                                )}
                                <ArrowLeft className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-700 dark:group-hover:text-amber-400 group-hover:translate-x-[-2px] transition-transform" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </PortalPanel>
                    );
                  })}
              </div>
            </section>
          </div>

          {/* 6. SIDEBAR (4 cols in 12-col grid; right in RTL, stacks below on mobile) */}
          <div className="order-2 lg:col-span-4">
            <PublicSidebar categories={categories} latestLessons={latestLessons} />
          </div>
        </div>
      </div>
    </div>
  );
};
