import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { getPublishedBooks, type BookWithCategory } from '../services/dataService';
import { LessonThumb } from './LessonThumb';
import { BookCover } from './BookCover';

// The saved channel videos ("yt:<id>") and books ("book:<id>") on the bookmarks page, beside the saved lessons
export const SavedExtras: React.FC<{ ids: string[]; onRemove: (id: string) => void }> = ({ ids, onRemove }) => {
  const library = useYoutubeLibrary();
  const [books, setBooks] = useState<BookWithCategory[]>([]);

  const wantsBooks = ids.some((id) => id.startsWith('book:'));
  useEffect(() => {
    if (!wantsBooks) return;
    getPublishedBooks()
      .then(setBooks)
      .catch(() => {});
  }, [wantsBooks]);

  const videos = useMemo(() => {
    const index = new Map<string, { title: string; playlistId: string; playlist: string }>();
    library.forEach((p) => p.videos.forEach((v) => index.set(v.id, { title: v.title, playlistId: p.id, playlist: p.title })));
    return ids
      .filter((id) => id.startsWith('yt:'))
      .map((id) => ({ id, videoId: id.slice(3), info: index.get(id.slice(3)) }));
  }, [ids, library]);

  const savedBooks = useMemo(
    () =>
      ids
        .filter((id) => id.startsWith('book:'))
        .map((id) => ({ id, book: books.find((b) => `book:${b.id}` === id) })),
    [ids, books]
  );

  const remove = 'w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-stone-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors';

  return (
    <>
      {videos.length > 0 && (
        <section aria-labelledby="saved-videos-heading" className="space-y-3">
          <h2 id="saved-videos-heading" className="text-stone-600 dark:text-stone-400">
            فيديوهات محفوظة ({new Intl.NumberFormat('ar-EG').format(videos.length)})
          </h2>
          <ul className="card p-2 sm:p-3">
            {videos.map(({ id, videoId, info }) => (
              <li key={id} className="flex items-center gap-1">
                <Link
                  to={`/video/${videoId}${info ? `?list=${info.playlistId}` : ''}`}
                  className="group flex-1 min-w-0 flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${videoId}`} className="w-28 sm:w-40 shrink-0" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                      {info?.title || 'فيديو من القناة'}
                    </span>
                    {info && <span className="block text-sm text-stone-600 dark:text-stone-400">{info.playlist}</span>}
                  </span>
                </Link>
                <button type="button" onClick={() => onRemove(id)} aria-label={`إزالة «${info?.title || 'الفيديو'}» من المحفوظات`} className={remove}>
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {savedBooks.length > 0 && (
        <section aria-labelledby="saved-books-heading" className="space-y-3">
          <h2 id="saved-books-heading" className="text-stone-600 dark:text-stone-400">
            كتب محفوظة ({new Intl.NumberFormat('ar-EG').format(savedBooks.length)})
          </h2>
          <ul className="card p-2 sm:p-3">
            {savedBooks.map(({ id, book }) => (
              <li key={id} className="flex items-center gap-1">
                {book ? (
                  <Link to={`/book/${book.id}`} className="group flex-1 min-w-0 flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                    <BookCover book={book} className="w-14 shrink-0" />
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-300">
                        {book.title}
                      </span>
                      {book.author && <span className="block text-sm text-stone-600 dark:text-stone-400">{book.author}</span>}
                    </span>
                  </Link>
                ) : (
                  <p className="flex-1 px-3 py-3 text-stone-600 dark:text-stone-400">كتاب لم يعد متاحاً</p>
                )}
                <button type="button" onClick={() => onRemove(id)} aria-label={`إزالة «${book?.title || 'الكتاب'}» من المحفوظات`} className={remove}>
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
};
