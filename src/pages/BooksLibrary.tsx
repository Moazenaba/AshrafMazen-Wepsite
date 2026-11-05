import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublishedBooks, type BookWithCategory } from '../services/dataService';
import { BookCover } from '../components/BookCover';
import { EmptyState } from '../components/EmptyState';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// The library: the sheikh's books and written works, each opening in a reader with a download
export const BooksLibrary: React.FC = () => {
  const [books, setBooks] = useState<BookWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    document.title = 'المكتبة - الشيخ أشرف مازن';
    getPublishedBooks()
      .then(setBooks)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    books.forEach((b) => b.category && seen.set(b.category.id, b.category.name));
    return [...seen.entries()];
  }, [books]);

  const shown = useMemo(() => {
    const q = query.trim();
    return books.filter(
      (b) => (!category || b.category_id === category) && (!q || b.title.includes(q) || b.author.includes(q) || b.description.includes(q))
    );
  }, [books, query, category]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-ruqaa text-4xl sm:text-5xl text-mushaf dark:text-gold-soft">المكتبة</h1>
        <p className="text-stone-700 dark:text-stone-300">كتب الشيخ ورسائله مكتوبة: اقرأها في الموقع أو حمّلها بصيغة PDF.</p>
      </header>

      {books.length > 3 && (
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:gap-3 sm:max-w-2xl">
          <label htmlFor="books-query" className="sr-only">ابحث في المكتبة</label>
          <input
            id="books-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بعنوان الكتاب أو المؤلف..."
            className="h-12 px-4 rounded-lg bg-white dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-mushaf"
          />
          {categories.length > 0 && (
            <>
              <label htmlFor="books-category" className="sr-only">القسم</label>
              <select
                id="books-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-12 px-3 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-mushaf"
              >
                <option value="">كل الأقسام</option>
                {categories.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </>
          )}
        </form>
      )}

      {loading ? (
        <div className="min-h-[40vh]" aria-busy="true" />
      ) : failed ? (
        <p className="text-stone-700 dark:text-stone-300">تعذّر تحميل المكتبة الآن. حاول مرة أخرى بعد قليل.</p>
      ) : books.length === 0 ? (
        <EmptyState
          title="المكتبة قيد التجهيز"
          text="ستجد هنا كتب الشيخ ورسائله بصيغة PDF تقرؤها في الموقع أو تحمّلها. يمكنك اقتراح كتاب يُضاف بعد مراجعة الإدارة."
          actions={[
            { to: '/contribute?type=book', label: 'اقترح كتاباً' },
            { to: '/videos', label: 'شاهد السلاسل المرئية' },
          ]}
        />
      ) : (
        <section aria-label={`الكتب (${arabicNumber(shown.length)})`}>
          {shown.length === 0 ? (
            <p className="text-stone-700 dark:text-stone-300">لا يوجد ما يطابق البحث.</p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6">
              {shown.map((book) => (
                <li key={book.id}>
                  <Link to={`/book/${book.id}`} className="group block space-y-3">
                    <BookCover book={book} className="transition-transform duration-300 group-hover:-translate-y-1" />
                    <span className="block space-y-1">
                      <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold line-clamp-2">
                        {book.title}
                      </span>
                      <span className="block text-sm text-stone-600 dark:text-stone-400">
                        {[book.author, book.pages ? `${arabicNumber(book.pages)} صفحة` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
