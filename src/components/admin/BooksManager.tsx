// The admin's library tab: every book with its status, and the window to add, edit or remove one.
import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Edit3, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { deleteBook, getAllBooksAdmin, updateBook, type BookWithCategory } from '../../services/dataService';
import { useReorder } from '../../pages/admin/dashboard/hooks/useReorder';
import { MoveButtons } from './MoveButtons';
import { type Category } from '../../types';
import { BookCover } from '../BookCover';
import { BookModal } from './books/BookModal';
import { label } from './books/styles';

// The admin's "المكتبة" tab: every book with its status, and a form to add, edit or remove one
export const BooksManager: React.FC<{ categories: Category[]; onCountChange?: (count: number) => void }> = ({ categories, onCountChange }) => {
  const [books, setBooks] = useState<BookWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BookWithCategory | 'new' | null>(null);
  const [deleting, setDeleting] = useState<BookWithCategory | null>(null);
  const [busyDelete, setBusyDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await getAllBooksAdmin();
      setBooks(list);
      onCountChange?.(list.length);
    } catch (err: any) {
      setError(err?.message || 'تعذّر تحميل الكتب.');
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const order = useReorder({ items: books, save: (id, sort_order) => updateBook(id, { sort_order }), reload: load });

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      setBusyDelete(true);
      await deleteBook(deleting);
      setDeleting(null);
      await load();
    } catch (err: any) {
      setError(err?.message || 'تعذّر حذف الكتاب.');
    } finally {
      setBusyDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">المكتبة</h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            الكتب والرسائل بصيغة PDF. تظهر للزوار في صفحة «المكتبة» ويمكنهم قراءتها وتحميلها. التسجيلات الصوتية تُرفع من نموذج الدرس.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing('new')}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          إضافة كتاب
        </button>
      </div>

      {error && (
        <p role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm font-semibold">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="جارٍ التحميل" />
        </div>
      ) : books.length === 0 && !error ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <BookOpen className="w-8 h-8 mx-auto text-stone-400" aria-hidden="true" />
          <p className="text-stone-600 dark:text-stone-400">لا توجد كتب بعد. أضف أول كتاب بزر «إضافة كتاب».</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {books.map((book) => (
            <li key={book.id} className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-2 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              <BookCover book={book} className="w-14 shrink-0" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{book.title}</p>
                <p className="text-xs text-stone-600 dark:text-stone-400 truncate">
                  {[book.author, book.category?.name, book.pages ? `${book.pages} صفحة` : null].filter(Boolean).join(' · ') || '—'}
                </p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                    book.status === 'published'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {book.status === 'published' ? 'منشور' : 'مسودة'}
                </span>
              </div>
              {/* Phones: the buttons take their own line under the book */}
              <div className="flex items-center justify-end gap-1 shrink-0 w-full sm:w-auto">
                <MoveButtons name={book.title} canUp={order.canMove(book, -1)} canDown={order.canMove(book, 1)} busy={order.busy} onMove={(step) => order.move(book, step)} />
                <a href={book.file_url} target="_blank" rel="noopener noreferrer" aria-label={`فتح ملف ${book.title}`} title="فتح الملف" className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
                  <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setEditing(book)} aria-label={`تعديل ${book.title}`} title="تعديل" className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800">
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => setDeleting(book)} aria-label={`حذف ${book.title}`} title="حذف" className="w-10 h-10 flex items-center justify-center rounded-lg text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40">
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <BookModal
          initial={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60" role="dialog" aria-modal="true" aria-labelledby="delete-book-title">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 space-y-4 border border-stone-200 dark:border-stone-800">
            <h3 id="delete-book-title" className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">حذف الكتاب</h3>
            <p className="text-stone-700 dark:text-stone-300">
              سيُحذف «{deleting.title}» من المكتبة، ومعه ملف PDF وصورة الغلاف إن كانا مرفوعين على الموقع. لا يمكن التراجع عن هذا.
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleting(null)} className="h-11 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold">
                إلغاء
              </button>
              <button type="button" onClick={confirmDelete} disabled={busyDelete} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold disabled:opacity-60">
                {busyDelete && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                حذف نهائي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add or edit one book. The PDF and the cover are uploaded to the site the moment they are chosen,
// or a link to a PDF hosted elsewhere can be pasted instead
