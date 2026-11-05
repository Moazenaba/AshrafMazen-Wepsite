import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Layers, Eye } from 'lucide-react';
import { getCategoryColorTheme } from '../../../utils/helpers';
import { type Category, type Series } from '../../../types';
import { MoveButtons } from '../../../components/admin/MoveButtons';

interface CategoriesTabProps {
  categories: Category[];
  seriesList: Series[];
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onMove: (category: Category, step: -1 | 1) => void;
  canMove: (category: Category, step: -1 | 1) => boolean;
  moving?: boolean;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({ categories, seriesList, onAdd, onEdit, onDelete, onMove, canMove, moving }) => {
  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
              الأقسام الشرعية الرئيسية
            </h3>
            <p className="text-xs text-stone-500">
              الفنون والمتون الكبرى (العقيدة، الفقه، أصول الفقه، المصطلح، الخطب...)
            </p>
          </div>

          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
              <tr>
                <th className="py-3 px-4 font-bold">الترتيب</th>
                <th className="py-3 px-4 font-bold">اسم القسم</th>
                <th className="py-3 px-4 font-bold">اللون المميز</th>
                <th className="py-3 px-4 font-bold">الرابط اللطيف (Slug)</th>
                <th className="py-3 px-4 font-bold">السلاسل المندرجة</th>
                <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                      <Layers className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                      <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                        لا توجد أقسام شرعية مضافة بعد.
                      </p>
                      <button
                        type="button"
                        onClick={onAdd}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة قسم جديد</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                const count = seriesList.filter((s) => s.category_id === cat.id).length;
                const catTheme = getCategoryColorTheme(cat.color);
                return (
                  <tr key={cat.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold">{cat.sort_order}</td>
                    <td className="py-3.5 px-4 font-amiri text-xl font-bold text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                        <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} />
                        <span>{catTheme.name}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500" dir="ltr">
                      {cat.slug}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                      {count} سلاسل
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <MoveButtons name={cat.name} canUp={canMove(cat, -1)} canDown={canMove(cat, 1)} busy={moving} onMove={(step) => onMove(cat, step)} />
                        <Link
                          to={`/category/${cat.slug}`}
                          target="_blank"
                          title="معاينة في الموقع"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onEdit(cat)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400"
                          title="تعديل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(cat)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-red-600"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
  );
};
