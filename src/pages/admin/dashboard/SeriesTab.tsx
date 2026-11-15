import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Layers, Eye } from 'lucide-react';
import { getCategoryColorTheme } from '../../../utils/helpers';
import { type Category, type Series } from '../../../types';
import { type LessonAdminItem } from './types';
import { MoveButtons } from '../../../components/admin/MoveButtons';

interface SeriesTabProps {
  seriesList: Series[];
  categories: Category[];
  lessons: LessonAdminItem[];
  onAdd: () => void;
  onEdit: (series: Series) => void;
  onDelete: (series: Series) => void;
  onMove: (series: Series, step: -1 | 1) => void;
  canMove: (series: Series, step: -1 | 1) => boolean;
  moving?: boolean;
}

export const SeriesTab: React.FC<SeriesTabProps> = ({ seriesList, categories, lessons, onAdd, onEdit, onDelete, onMove, canMove, moving }) => {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
              السلاسل والشروحات العلمية
            </h3>
            <p className="text-xs text-stone-500">
              تنظيم السلاسل العلمية وربطها بالأقسام الشرعية
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سلسلة جديدة</span>
          </button>
        </div>

        {seriesList.length === 0 ? (
          <div className="p-14 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
            <Layers className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
            <div className="space-y-1">
              <h4 className="font-amiri text-xl font-bold text-stone-800 dark:text-stone-200">
                لا توجد سلاسل علمية مضافة بعد.
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                ابدأ بإنشاء أول سلسلة علمية واربطها بأحد الأقسام الشرعية كالعقيدة أو الفقه.
              </p>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة سلسلة جديدة</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seriesList.map((series) => {
              const cat = categories.find((c) => c.id === series.category_id);
              const catTheme = getCategoryColorTheme(cat?.color);
              const seriesLessonCount = lessons.filter((l) => l.series_id === series.id).length;

              return (
                <div
                  key={series.id}
                  className={`p-6 ${catTheme.cardBg} rounded-2xl border ${catTheme.cardBorder} shadow-xs flex flex-col justify-between space-y-4 transition-all`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                        {cat?.name || 'قسم غير محدد'}
                      </span>
                      <span className="text-xs text-stone-500 font-mono">
                        {seriesLessonCount} دروس
                      </span>
                    </div>

                    <h4 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                      {series.title}
                    </h4>

                    {series.description && (
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {series.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                    <Link
                      to={`/series/${series.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-800 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة صفحة السلسلة</span>
                    </Link>

                    <div className="flex items-center gap-1">
                      <MoveButtons name={series.title} canUp={canMove(series, -1)} canDown={canMove(series, 1)} busy={moving} onMove={(step) => onMove(series, step)} />
                      <button
                        type="button"
                        onClick={() => onEdit(series)}
                        className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        title="تعديل السلسلة"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(series)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                        title="حذف السلسلة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
};
