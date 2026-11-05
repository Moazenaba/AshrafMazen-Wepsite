import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { getPublishedBooks, type BookWithCategory } from '../services/dataService';
import { LessonThumb } from './LessonThumb';
import { BookCover } from './BookCover';

const MAX_VIDEOS = 24;

// Arabic search ignores the marks above and below letters and the stretching line, so "الأصول" finds "الاصول"
const normalize = (text: string) =>
  text
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();

// Search results beyond the lessons: the channel's videos and the library's books, found by the same words
export const SiteSearchExtras: React.FC<{ query: string; highlight: (text: string, q: string) => React.ReactNode }> = ({ query, highlight }) => {
  const library = useYoutubeLibrary();
  const [books, setBooks] = useState<BookWithCategory[]>([]);

  useEffect(() => {
    getPublishedBooks()
      .then(setBooks)
      .catch(() => {});
  }, []);

  const needle = normalize(query.trim());

  const videos = useMemo(() => {
    if (!needle) return [];
    const found: { id: string; title: string; playlistId: string; playlist: string }[] = [];
    for (const playlist of library) {
      for (const video of playlist.videos) {
        if (normalize(video.title).includes(needle)) found.push({ id: video.id, title: video.title, playlistId: playlist.id, playlist: playlist.title });
      }
    }
    return found;
  }, [library, needle]);

  const matchedBooks = useMemo(
    () => (needle ? books.filter((b) => normalize(`${b.title} ${b.author} ${b.description}`).includes(needle)) : []),
    [books, needle]
  );

  if (!needle || (videos.length === 0 && matchedBooks.length === 0)) return null;

  return (
    <>
      {matchedBooks.length > 0 && (
        <section aria-labelledby="search-books-heading" className="space-y-4">
          <h2 id="search-books-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
            من المكتبة ({new Intl.NumberFormat('ar-EG').format(matchedBooks.length)})
          </h2>
          <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {matchedBooks.map((book) => (
              <li key={book.id}>
                <Link to={`/book/${book.id}`} className="group block space-y-2">
                  <BookCover book={book} />
                  <span className="block text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold line-clamp-2">
                    {highlight(book.title, query)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {videos.length > 0 && (
        <section aria-labelledby="search-videos-heading" className="space-y-4">
          <h2 id="search-videos-heading" className="font-amiri text-2xl sm:text-3xl font-bold text-emerald-950 dark:text-stone-100">
            من فيديوهات القناة ({new Intl.NumberFormat('ar-EG').format(videos.length)})
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {videos.slice(0, MAX_VIDEOS).map((video) => (
              <li key={video.id}>
                <Link
                  to={`/video/${video.id}?list=${video.playlistId}`}
                  className="group flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
                >
                  <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${video.id}`} className="w-28 shrink-0" />
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 line-clamp-2">
                      {highlight(video.title, query)}
                    </span>
                    <span className="block text-xs text-stone-600 dark:text-stone-400">{video.playlist}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {videos.length > MAX_VIDEOS && (
            <p className="text-sm text-stone-600 dark:text-stone-400">
              يُعرض أول {new Intl.NumberFormat('ar-EG').format(MAX_VIDEOS)} نتيجة. اجعل البحث أدق لتضييق النتائج.
            </p>
          )}
        </section>
      )}
    </>
  );
};
