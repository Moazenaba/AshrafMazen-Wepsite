import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Sparkles,
  Layers,
  Calendar,
  Eye,
  User,
  ArrowLeft,
} from 'lucide-react';
import { PortalPanel } from './PortalPanel';
import {
  getCategories,
  getLatestLessons,
  getSiteSetting,
  type LessonWithRelations,
  type Category,
} from '../services/dataService';
import { formatArabicDate, formatArabicViews, getCategoryColorTheme } from '../utils/helpers';

interface PublicSidebarProps {
  categories?: Category[];
  latestLessons?: LessonWithRelations[];
  className?: string;
}

export const PublicSidebar: React.FC<PublicSidebarProps> = ({
  categories: initialCategories,
  latestLessons: initialLatest,
  className = '',
}) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [latest, setLatest] = useState<LessonWithRelations[]>(initialLatest || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [aboutText, setAboutText] = useState(
    'الشيخ أشرف مازن، من علماء وأساتذة العلوم الشرعية المعاصرين. يُعنى بنشر العلم الشرعي المؤصل، وشرح المتون العلمية في الفقه، والعقيدة، والحديث، والأصول وعلوم التزكية وفق منهج أهل السنة والجماعة.'
  );

  useEffect(() => {
    let isMounted = true;

    if (!initialCategories || initialCategories.length === 0) {
      getCategories().then((data) => {
        if (isMounted) setCategories(data);
      });
    }

    if (!initialLatest || initialLatest.length === 0) {
      getLatestLessons(5).then((data) => {
        if (isMounted) setLatest(data);
      });
    }

    getSiteSetting(
      'about_sheikh',
      'الشيخ أشرف مازن، من علماء وأساتذة العلوم الشرعية المعاصرين. يُعنى بنشر العلم الشرعي المؤصل، وشرح المتون العلمية في الفقه، والعقيدة، والحديث، والأصول وعلوم التزكية وفق منهج أهل السنة والجماعة.'
    ).then((text) => {
      if (isMounted && text) setAboutText(text);
    });

    return () => {
      isMounted = false;
    };
  }, [initialCategories, initialLatest]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <aside className={`space-y-6 ${className}`}>
      {/* Panel 1: البحث في المكتبة */}
      <PortalPanel
        title="البحث في المكتبة"
        icon={<Search className="w-4 h-4" />}
        headerBg="bg-emerald-900 dark:bg-[#12281d]"
      >
        <form onSubmit={handleSearch} className="space-y-3">
          <div>
            <label htmlFor="sidebar-search" className="sr-only">
              كلمة البحث
            </label>
            <input
              id="sidebar-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اكتب كلمة البحث أو اسم الدرس..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 dark:border-[#22302a] bg-stone-50 dark:bg-[#1a261f] text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400"
            />
          </div>

          <div>
            <label htmlFor="sidebar-cat-select" className="sr-only">
              اختر القسم
            </label>
            <select
              id="sidebar-cat-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-[#22302a] bg-stone-50 dark:bg-[#1a261f] text-xs sm:text-sm text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400"
            >
              <option value="">جميع العلوم الشرعية</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span>بحث في الدروس</span>
          </button>
        </form>
      </PortalPanel>

      {/* Panel 2: التصنيفات والعلوم */}
      <PortalPanel
        title="التصنيفات والعلوم"
        icon={<Layers className="w-4 h-4" />}
        headerBg="bg-emerald-900 dark:bg-[#12281d]"
        actionLink="/#categories"
        actionText="عرض الكل"
      >
        <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
          {categories.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">جاري تحميل الأقسام...</p>
          ) : (
            categories.map((cat) => {
              const theme = getCategoryColorTheme(cat.color);
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-emerald-50/50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dot} shrink-0`} />
                    <span className="font-amiri text-base font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                      {cat.name}
                    </span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600 group-hover:text-emerald-700 dark:group-hover:text-amber-400 transition-transform group-hover:translate-x-[-2px]" />
                </Link>
              );
            })
          )}
        </div>
      </PortalPanel>

      {/* Panel 3: آخر الإضافات */}
      <PortalPanel
        title="آخر الإضافات"
        icon={<Sparkles className="w-4 h-4" />}
        headerBg="bg-emerald-900 dark:bg-[#12281d]"
        actionLink="/search"
        actionText="كل الدروس"
      >
        <div className="divide-y divide-stone-100 dark:divide-[#22302a]/70 -mx-1">
          {latest.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">لا توجد مواد بعد.</p>
          ) : (
            latest.slice(0, 5).map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lesson/${lesson.id}`}
                className="block py-2.5 px-2 hover:bg-emerald-50/50 dark:hover:bg-[#1a261f] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500 mb-1">
                  {lesson.category && (
                    <span className="text-emerald-700 dark:text-amber-400 font-medium">
                      {lesson.category.name}
                    </span>
                  )}
                  {lesson.category && lesson.published_at && <span>•</span>}
                  {lesson.published_at && (
                    <span className="flex items-center gap-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatArabicDate(lesson.published_at)}
                    </span>
                  )}
                </div>

                <h4 className="font-amiri text-sm font-bold text-stone-800 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                  {lesson.title}
                </h4>

                {typeof lesson.views === 'number' && (
                  <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500 mt-1">
                    <Eye className="w-3 h-3 text-stone-400" />
                    <span>{formatArabicViews(lesson.views)} مشاهدة</span>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </PortalPanel>

      {/* Panel 4: عن الشيخ والموقع */}
      <PortalPanel
        title="عن الشيخ والموقع"
        icon={<User className="w-4 h-4" />}
        headerBg="bg-emerald-900 dark:bg-[#12281d]"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 dark:bg-emerald-700 text-amber-300 flex items-center justify-center border border-amber-500/25 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-amiri text-lg font-bold text-stone-900 dark:text-stone-100 leading-none">
                الشيخ أشرف مازن
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium mt-1">
                الموقع العلمي والرسمي
              </p>
            </div>
          </div>

          <p className="font-cairo text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
            {aboutText}
          </p>

          <div className="pt-2 border-t border-stone-100 dark:border-[#22302a] flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>نشر العلم النافع</span>
            <Link
              to="/#categories"
              className="text-emerald-800 dark:text-amber-400 font-semibold hover:underline"
            >
              تصفح العلوم
            </Link>
          </div>
        </div>
      </PortalPanel>
    </aside>
  );
};
