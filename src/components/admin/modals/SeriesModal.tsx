import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { type Category, type Series } from '../../../types';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { category_id: string; title: string; slug: string; description: string; sort_order: number }) => Promise<void>;
  categories: Category[];
  initialData?: Series | null;
}

export const SeriesModal: React.FC<SeriesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialData,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setCategoryId(initialData.category_id);
      setTitle(initialData.title);
      setSlug(initialData.slug);
      setDescription(initialData.description || '');
      setSortOrder(initialData.sort_order);
    } else {
      setCategoryId(categories[0]?.id || '');
      setTitle('');
      setSlug('');
      setDescription('');
      setSortOrder(1);
    }
    setError('');
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان السلسلة');
      return;
    }
    if (!categoryId) {
      setError('يرجى اختيار القسم التابع له السلسلة');
      return;
    }
    try {
      setLoading(true);
      await onSave({
        category_id: categoryId,
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        sort_order: Number(sortOrder) || 1,
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
      <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
          <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
            {initialData ? 'تعديل السلسلة العلمية' : 'إضافة سلسلة علمية جديدة'}
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
              القسم الشرعي <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              عنوان السلسلة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: شرح كتاب التوحيد، شرح الورقات..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              وصف السلسلة وموضوعها
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة موجزة عن السلسلة وموضوع الشرح..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                الاسم في رابط الصفحة (اتركه فارغاً ليُكتب تلقائياً)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="اختياري - يولد تلقائياً"
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
              {loading ? 'جاري الحفظ...' : 'حفظ السلسلة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
