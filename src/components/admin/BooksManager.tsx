import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Edit3, ExternalLink, FileUp, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
  createBook,
  deleteBook,
  getAllBooksAdmin,
  updateBook,
  uploadBookFile,
  type BookWithCategory,
} from '../../services/dataService';
import type { Book, Category } from '../../types';
import { BookCover } from '../BookCover';

const field =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';
const label = 'block font-semibold text-stone-700 dark:text-stone-300 mb-1.5';

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
            <li key={book.id} className="flex items-center gap-4 p-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
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
              <div className="flex items-center gap-1 shrink-0">
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
const BookModal: React.FC<{
  initial: BookWithCategory | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ initial, categories, onClose, onSaved }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [author, setAuthor] = useState(initial?.author || 'الشيخ أشرف مازن');
  const [description, setDescription] = useState(initial?.description || '');
  const [categoryId, setCategoryId] = useState(initial?.category_id || '');
  const [fileUrl, setFileUrl] = useState(initial?.file_url || '');
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url || '');
  const [pages, setPages] = useState(initial?.pages ? String(initial.pages) : '');
  const [status, setStatus] = useState<Book['status']>(initial?.status || 'published');
  const [uploading, setUploading] = useState<'pdf' | 'cover' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const upload = async (file: File | undefined, kind: 'pdf' | 'cover') => {
    if (!file) return;
    try {
      setError('');
      setUploading(kind);
      const url = await uploadBookFile(file, kind);
      if (kind === 'pdf') {
        setFileUrl(url);
        if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''));
      } else {
        setCoverUrl(url);
      }
    } catch (err: any) {
      setError(err?.message || 'تعذّر رفع الملف.');
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('يرجى إدخال عنوان الكتاب.');
    if (!fileUrl.trim()) return setError('يرجى رفع ملف PDF أو لصق رابطه.');
    try {
      setSaving(true);
      setError('');
      const data: Partial<Book> = {
        title,
        author,
        description,
        category_id: categoryId || null,
        file_url: fileUrl,
        cover_url: coverUrl || null,
        pages: pages ? Number(pages) : null,
        status,
        published_at: initial?.published_at || null,
      };
      if (initial) await updateBook(initial.id, data);
      else await createBook(data);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'تعذّر حفظ الكتاب.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60" role="dialog" aria-modal="true" aria-labelledby="book-modal-title">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-6">
        <div className="flex items-center justify-between">
          <h3 id="book-modal-title" className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
            {initial ? 'تعديل الكتاب' : 'إضافة كتاب إلى المكتبة'}
          </h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 flex items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 text-sm font-semibold">
            {error}
          </p>
        )}

        <form onSubmit={submit} className="space-y-5 text-sm">
          <div>
            <span className={label}>
              ملف الكتاب (PDF) <span className="text-red-500">*</span>
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold cursor-pointer">
                {uploading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileUp className="w-4 h-4" aria-hidden="true" />}
                {uploading === 'pdf' ? 'جارٍ الرفع...' : fileUrl ? 'استبدال الملف' : 'رفع ملف PDF'}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  disabled={!!uploading}
                  onChange={(e) => upload(e.target.files?.[0], 'pdf')}
                  aria-describedby="book-pdf-hint"
                />
              </label>
              {fileUrl && (
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-800 dark:text-emerald-300 font-semibold hover:underline">
                  معاينة الملف
                </a>
              )}
            </div>
            <p id="book-pdf-hint" className="mt-1.5 text-xs text-stone-600 dark:text-stone-400">حتى ٢٠٠ ميجابايت. أو الصق رابط ملف PDF منشور في مكان آخر:</p>
            <input
              type="url"
              dir="ltr"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              aria-label="رابط ملف PDF"
              className={`${field} mt-1.5`}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="book-title" className={label}>
                العنوان <span className="text-red-500">*</span>
              </label>
              <input id="book-title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} required />
            </div>
            <div>
              <label htmlFor="book-author" className={label}>المؤلف</label>
              <input id="book-author" value={author} onChange={(e) => setAuthor(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="book-category" className={label}>القسم</label>
              <select id="book-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={field}>
                <option value="">بدون قسم</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="book-pages" className={label}>عدد الصفحات</label>
              <input id="book-pages" type="number" min={1} inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} className={field} />
            </div>
          </div>

          <div>
            <label htmlFor="book-description" className={label}>نبذة عن الكتاب</label>
            <textarea
              id="book-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <div className="flex items-start gap-4">
            <BookCover book={{ title: title || 'عنوان الكتاب', author, cover_url: coverUrl || null }} className="w-20 shrink-0" />
            <div className="space-y-2">
              <span className={label}>صورة الغلاف (اختيارية)</span>
              <p className="text-xs text-stone-600 dark:text-stone-400" id="book-cover-hint">
                بدون صورة يُصمَّم غلاف بلون الموقع وعنوان الكتاب كما في المعاينة. jpg أو png أو webp حتى ٥ ميجابايت.
              </p>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold cursor-pointer">
                  {uploading === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <FileUp className="w-4 h-4" aria-hidden="true" />}
                  {coverUrl ? 'تغيير الصورة' : 'رفع صورة'}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,image/*" className="sr-only" disabled={!!uploading} onChange={(e) => upload(e.target.files?.[0], 'cover')} aria-describedby="book-cover-hint" />
                </label>
                {coverUrl && (
                  <button type="button" onClick={() => setCoverUrl('')} className="h-10 px-4 rounded-xl text-red-700 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-950/40">
                    إزالة الصورة
                  </button>
                )}
              </div>
            </div>
          </div>

          <fieldset>
            <legend className={label}>الحالة</legend>
            <div className="flex gap-4">
              {(['published', 'draft'] as const).map((value) => (
                <label key={value} className="inline-flex items-center gap-2 min-h-11 cursor-pointer text-stone-800 dark:text-stone-200">
                  <input type="radio" name="book-status" value={value} checked={status === value} onChange={() => setStatus(value)} className="w-4 h-4 accent-emerald-700" />
                  {value === 'published' ? 'منشور للزوار' : 'مسودة (لا تظهر للزوار)'}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="h-11 px-5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold">
              إلغاء
            </button>
            <button type="submit" disabled={saving || !!uploading} className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold disabled:opacity-60">
              {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {initial ? 'حفظ التعديلات' : 'إضافة الكتاب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
