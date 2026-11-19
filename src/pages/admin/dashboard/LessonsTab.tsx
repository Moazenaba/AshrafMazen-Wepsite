import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen, FileText, Video, Headphones, Search, CheckCircle2, Clock, Eye } from 'lucide-react';
import { formatArabicDate, getCategoryColorTheme } from '../../../utils/helpers';
import { type Series, type Lesson } from '../../../types';
import { type LessonAdminItem } from './types';
import { FeaturedOrderPanel } from '../../../components/admin/FeaturedOrderPanel';

interface LessonsTabProps {
  lessons: LessonAdminItem[];
  seriesList: Series[];
  onAdd: () => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

export const LessonsTab: React.FC<LessonsTabProps> = ({ lessons, seriesList, onAdd, onEdit, onDelete }) => {
  // Lesson filters
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLessons = lessons.filter((l) => {
    if (seriesFilter !== 'all' && l.series_id !== seriesFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchSeries = l.series?.title.toLowerCase().includes(q);
      if (!matchTitle && !matchSeries) return false;
    }
    return true;
  });
  const totalPublished = lessons.filter((l) => l.status === 'published').length;
  const totalDrafts = lessons.filter((l) => l.status === 'draft').length;

  return (
      <div className="space-y-6">
        <FeaturedOrderPanel lessons={lessons} />

        {/* Action Bar & Filters */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Series filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">السلسلة:</span>
              <select
                value={seriesFilter}
                onChange={(e) => setSeriesFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200"
              >
                <option value="all">كل السلاسل ({lessons.length})</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-500">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200"
              >
                <option value="all">كل الحالات</option>
                <option value="published">المنشور فقط ({totalPublished})</option>
                <option value="draft">المسودات فقط ({totalDrafts})</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في عنوان الدرس..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200"
              />
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة درس جديد</span>
          </button>
        </div>

        {/* Lessons Table */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                <tr>
                  <th className="py-3 px-4 font-bold">الرقم</th>
                  <th className="py-3 px-4 font-bold">عنوان الدرس</th>
                  <th className="py-3 px-4 font-bold">السلسلة والقسم</th>
                  <th className="py-3 px-4 font-bold">الوسائط</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold">تاريخ النشر</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                {filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                        <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                        <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                          {lessons.length === 0
                            ? 'لا توجد دروس مضافة بعد.'
                            : 'لا توجد دروس مطابقة للمعايير المحددة.'}
                        </p>
                        <p className="text-xs text-stone-400">
                          {lessons.length === 0 && 'ابدأ بإضافة أول درس علمي مرئي أو صوتي أو تفريغ مكتوب.'}
                        </p>
                        <button
                          type="button"
                          onClick={onAdd}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>إضافة درس جديد</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-stone-700 dark:text-stone-300">
                        #{lesson.lesson_number}
                      </td>
                      <td className="py-3.5 px-4 font-amiri text-base font-bold text-stone-900 dark:text-stone-100">
                        {lesson.title}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-semibold text-stone-900 dark:text-stone-100">
                          {lesson.series?.title || 'غير محدد'}
                        </span>
                        {lesson.category && (() => {
                          const catTheme = getCategoryColorTheme(lesson.category.color);
                          return (
                            <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dot}`} />
                              <span>{lesson.category.name}</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {lesson.youtube_url ? (
                            <span title="يوجد فيديو" className="p-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                              <Video className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-700">—</span>
                          )}
                          {lesson.audio_url ? (
                            <span title="يوجد صوت" className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                              <Headphones className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-700">—</span>
                          )}
                          {lesson.transcript ? (
                            <span title="يوجد تفريغ" className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                              <FileText className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <span className="text-stone-300 dark:text-stone-700">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {lesson.status === 'published' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>منشور</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>مسودة</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 font-cairo">
                        {lesson.published_at ? formatArabicDate(lesson.published_at) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {(
                            <Link
                              to={`/lesson/${lesson.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={lesson.status === 'published' ? 'معاينة في الموقع' : 'معاينة المسودة (لا يراها الزوار)'}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => onEdit(lesson)}
                            title="تعديل الدرس"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(lesson)}
                            title="حذف الدرس"
                            className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};
