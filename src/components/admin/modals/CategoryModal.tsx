import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen } from 'lucide-react';
import { type Category } from '../../../types';
import { CATEGORY_PALETTES } from '../../../utils/helpers';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; slug: string; sort_order: number; color: string; icon?: string }) => Promise<void>;
  initialData?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [color, setColor] = useState('emerald');
  const [icon, setIcon] = useState('BookOpen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSlug(initialData.slug);
      setSortOrder(initialData.sort_order);
      setColor(initialData.color || 'emerald');
      setIcon(initialData.icon || 'BookOpen');
    } else {
      setName('');
      setSlug('');
      setSortOrder(1);
      setColor('emerald');
      setIcon('BookOpen');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم القسم');
      return;
    }
    try {
      setLoading(true);
      await onSave({
        name: name.trim(),
        slug: slug.trim(),
        sort_order: Number(sortOrder) || 1,
        color,
        icon,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
            {initialData ? 'تعديل القسم' : 'إضافة قسم شرعي جديد'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              اسم القسم <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: العقيدة، الفقه، أصول الفقه..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Distinct Category Color Selection */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-2">
              اللون المميز للقسم (يظهر كخلفية خفيفة في بطاقات السلاسل والدروس)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {Object.values(CATEGORY_PALETTES).map((pal) => {
                const isSelected = color === pal.id;
                return (
                  <button
                    key={pal.id}
                    type="button"
                    onClick={() => setColor(pal.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-700 dark:border-amber-400 bg-emerald-50/70 dark:bg-emerald-950/50 shadow-xs ring-2 ring-emerald-700/20 dark:ring-amber-400/20'
                        : 'border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600 bg-stone-50/50 dark:bg-stone-800/40'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: pal.previewBg }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </span>
                    <span className="truncate text-stone-700 dark:text-stone-200">
                      {pal.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              الاسم اللطيف في الرابط (Slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="اختياري (مثال: aqeedah) - يولد تلقائياً"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono text-xs"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              ترتيب الظهور
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ القسم'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
