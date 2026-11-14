// The window to add or edit a book: its details, its PDF and its cover.
import React, { useState } from 'react';
import { FileUp, Loader2, X } from 'lucide-react';
import { createBook, updateBook, uploadBookFile, type BookWithCategory } from '../../../services/dataService';
import { type Book, type Category } from '../../../types';
import { BookCover } from '../../BookCover';
import { field, label } from './styles';

export const BookModal: React.FC<{
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
              // text, not url: an uploaded PDF is a site link (/api/r2?file=...), which a url field refuses (it blocked saving)
              type="text"
              inputMode="url"
              autoComplete="off"
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
