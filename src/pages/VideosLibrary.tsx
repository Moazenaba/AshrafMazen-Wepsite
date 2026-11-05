import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { LessonThumb } from '../components/LessonThumb';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// The video library: every playlist on the sheikh's channel, each opening with its videos played inside the site
export const VideosLibrary: React.FC = () => {
  const library = useYoutubeLibrary();
  const playlists = library.filter((p) => p.videos.length > 0);
  const total = playlists.reduce((sum, p) => sum + p.videos.length, 0);

  useEffect(() => {
    document.title = 'المرئيات - الشيخ أشرف مازن';
  }, []);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-ruqaa text-4xl sm:text-5xl text-mushaf dark:text-gold-soft">المرئيات</h1>
        <p className="text-stone-700 dark:text-stone-300">
          {playlists.length > 0
            ? `${arabicNumber(playlists.length)} سلسلة و${arabicNumber(total)} فيديو من قناة الشيخ، تُشاهد داخل الموقع.`
            : 'سلاسل الشيخ المرئية من قناته على يوتيوب، تُشاهد داخل الموقع.'}
        </p>
      </header>

      {playlists.length === 0 ? (
        <div className="min-h-[40vh]" aria-busy="true" />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-6 sm:gap-y-8">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link
                to={`/playlist/${playlist.id}`}
                className="group grid grid-cols-[112px_minmax(0,1fr)] sm:block items-center gap-3 p-2 sm:p-0 rounded-lg bg-white dark:bg-stone-800 sm:bg-transparent sm:dark:bg-transparent"
              >
                <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${playlist.latestVideoId}`} className="w-full" />
                <span className="block min-w-0 sm:mt-3 space-y-1">
                  <span className="block font-ruqaa text-xl sm:text-2xl leading-snug text-mushaf dark:text-gold-soft group-hover:text-gold-deep dark:group-hover:text-gold">
                    {playlist.title}
                  </span>
                  <span className="block text-sm text-stone-600 dark:text-stone-400">{arabicNumber(playlist.videos.length)} فيديو</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
