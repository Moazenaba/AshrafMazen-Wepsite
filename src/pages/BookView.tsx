import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, Download, ExternalLink } from 'lucide-react';
import { bookDownloadUrl, getBook, type BookWithCategory } from '../services/dataService';
import { BookCover } from '../components/BookCover';
import { ReportLink } from '../components/ReportLink';
import { BookmarkButton } from '../components/BookmarkButton';
import { getViewCount, trackReading, trackView } from '../services/analytics';
import { COUNT_FORMS, formatArabicCount, formatArabicDate } from '../utils/helpers';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// Desktop browsers show a PDF inside the page; phone browsers (Android's in particular) cannot, so on a
// phone the book opens in the device's own reader instead
const EMBED_QUERY = '(min-width: 768px) and (pointer: fine)';

function useCanEmbedPdf(): boolean {
  const [can, setCan] = useState(() => typeof window !== 'undefined' && window.matchMedia(EMBED_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia(EMBED_QUERY);
    const onChange = () => setCan(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return can;
}

// One book: its details, a reader for the PDF, and a download
export const BookView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const canEmbed = useCanEmbedPdf();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // A published book for everyone; failing that, a draft, which only an admin can read (a preview)
    getBook(id)
      .then((found) => found ?? getBook(id, true).catch(() => null))
      .then(setBook)
      .catch(() => setBook(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Statistics: one view per visit, and the time the book is open and in view counts as reading time
  const [views, setViews] = useState<number | null>(null);
  useEffect(() => {
    if (!book || book.status !== 'published') return;
    const key = `book:${book.id}`;
    trackView('read', key);
    let active = true;
    getViewCount(key).then((count) => active && setViews(count));
    const stop = trackReading(key);
    return () => {
      active = false;
      stop();
    };
  }, [book?.id]);

  useEffect(() => {
    if (!book) return;
    const previous = document.title;
    document.title = `${book.title} - المكتبة - الشيخ أشرف مازن`;
    return () => {
      document.title = previous;
    };
  }, [book]);

  if (loading) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 space-y-4">
        <h1 className="font-ruqaa text-4xl text-mushaf dark:text-gold-soft">الكتاب غير موجود</h1>
        <p className="text-stone-700 dark:text-stone-300">ربما حُذف هذا الكتاب أو تغيّر رابطه.</p>
        <Link to="/books" className="inline-flex items-center gap-2 min-h-11 font-semibold text-mushaf dark:text-gold hover:underline">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          العودة إلى المكتبة
        </Link>
      </div>
    );
  }

  const facts = [
    book.author,
    book.pages ? `${arabicNumber(book.pages)} صفحة` : null,
    book.category?.name,
    book.published_at ? formatArabicDate(book.published_at) : null,
    views ? formatArabicCount(views, COUNT_FORMS.view) : null,
  ].filter(Boolean);

  const primary =
    'press inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-mushaf hover:bg-mushaf-deep text-gold-soft font-bold';
  const secondary =
    'press inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep font-bold';

  return (
    <article className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
        <Link to="/" className="inline-flex items-center min-h-11 hover:text-mushaf dark:hover:text-gold">الرئيسية</Link>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <Link to="/books" className="inline-flex items-center min-h-11 hover:text-mushaf dark:hover:text-gold">المكتبة</Link>
      </nav>

      <header className="grid grid-cols-[112px_minmax(0,1fr)] sm:grid-cols-[180px_minmax(0,1fr)] gap-4 sm:gap-8 items-start">
        <BookCover book={book} />
        <div className="min-w-0 space-y-3 sm:space-y-4">
          <h1 className="font-ruqaa text-3xl sm:text-5xl leading-snug text-mushaf dark:text-gold-soft text-balance">{book.title}</h1>
          {facts.length > 0 && <p className="text-sm sm:text-base text-stone-600 dark:text-stone-400">{facts.join(' · ')}</p>}
          {book.description && (
            <p className="hidden sm:block max-w-[65ch] leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">{book.description}</p>
          )}
          <div className="hidden sm:flex flex-wrap gap-3 pt-1">
            <BookmarkButton id={`book:${book.id}`} className="h-12" />
            <a href={bookDownloadUrl(book)} download className={secondary}>
              <Download className="w-5 h-5" aria-hidden="true" />
              تحميل PDF
            </a>
            <a href={book.file_url} target="_blank" rel="noopener noreferrer" className={primary}>
              <ExternalLink className="w-5 h-5" aria-hidden="true" />
              فتح في نافذة جديدة
            </a>
          </div>
        </div>
      </header>

      {/* Phone: the two actions full width under the cover, then the description */}
      <div className="sm:hidden space-y-4">
        <BookmarkButton id={`book:${book.id}`} className="w-full justify-center h-12" />
        <div className="grid grid-cols-2 gap-2">
          <a href={book.file_url} target="_blank" rel="noopener noreferrer" className={primary}>
            <BookOpen className="w-5 h-5" aria-hidden="true" />
            اقرأ الكتاب
          </a>
          <a href={bookDownloadUrl(book)} download className={secondary}>
            <Download className="w-5 h-5" aria-hidden="true" />
            تحميل PDF
          </a>
        </div>
        {book.description && <p className="leading-relaxed text-stone-800 dark:text-stone-200 whitespace-pre-line">{book.description}</p>}
      </div>

      {canEmbed ? (
        <section aria-label="قراءة الكتاب" className="space-y-2">
          <iframe
            src={`${book.file_url}#view=FitH`}
            title={`قراءة: ${book.title}`}
            className="block w-full h-[85vh] rounded-xl bg-white dark:bg-stone-800"
          />
          <p className="text-sm text-stone-600 dark:text-stone-400">
            إن لم يظهر الكتاب هنا،{' '}
            <a href={book.file_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-mushaf dark:text-gold hover:underline">
              افتحه في نافذة جديدة
            </a>
            .
          </p>
        </section>
      ) : (
        <a
          href={book.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center justify-center gap-3 h-40 rounded-xl bg-white dark:bg-stone-800 text-mushaf dark:text-gold font-bold text-lg"
        >
          <BookOpen className="w-6 h-6" aria-hidden="true" />
          اقرأ الكتاب في قارئ الجهاز
        </a>
      )}

      <ReportLink />
    </article>
  );
};
