import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Music } from 'lucide-react';
import { DownloadDialog } from '../components/DownloadDialog';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { namedTitle, usePageMeta } from '../lib/pageMeta';
import { LessonThumb } from '../components/LessonThumb';
import { isLessonWatched } from '../services/progressService';

// One playlist: every video in it, each opening inside the site
export const PlaylistView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const library = useYoutubeLibrary();
  const playlist = library.find((p) => p.id === id);
  usePageMeta(playlist ? { title: namedTitle(playlist.title), description: `${playlist.title}: ${playlist.videos.length} فيديو للشيخ أشرف مازن.` } : null);
  const [downloading, setDownloading] = useState(false);

  // The library arrives a moment after the page; until then keep the space instead of saying "not found"
  if (!playlist && library.length === 0) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (!playlist) {
    return (
      <div className="w-full px-5 py-20 space-y-4">
        <h1 className="font-ruqaa text-4xl text-stone-900 dark:text-stone-100">القائمة غير موجودة</h1>
        <Link to="/" className="inline-flex items-center gap-2 min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-8">
      <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
        <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
          الرئيسية
        </Link>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span className="text-stone-800 dark:text-stone-200">{playlist.title}</span>
      </nav>

      <header className="space-y-2">
        <h1 className="font-ruqaa text-3xl sm:text-5xl text-stone-900 dark:text-stone-50">{playlist.title}</h1>
        <p className="text-stone-600 dark:text-stone-400">{playlist.videos.length} فيديو</p>
        <button type="button" onClick={() => setDownloading(true)} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-gold hover:bg-gold-soft text-mushaf-deep text-sm font-bold">
          <Download className="w-4 h-4" aria-hidden="true" />
          تحميل القائمة كاملة
        </button>
      </header>
      {downloading && <DownloadDialog title={playlist.title} videos={playlist.videos} onClose={() => setDownloading(false)} />}

      {/* Phone: a compact row per video, a small frame and the title; wider screens get the frame on top */}
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {playlist.videos.map((video) => (
          <li key={video.id}>
            <Link to={`/video/${video.id}?list=${playlist.id}`} className="group flex sm:block items-center gap-3 sm:gap-0 h-full p-2 sm:p-3 rounded-xl bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-stone-700 transition-colors">
              <div className="w-28 shrink-0 sm:w-full">
                {video.src ? (
                  <span className="flex items-center justify-center w-full aspect-video rounded-lg bg-mushaf text-gold-soft">
                    <Music className="w-8 h-8" aria-hidden="true" />
                  </span>
                ) : (
                  <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${video.id}`} className="w-full" />
                )}
              </div>
              <span className="min-w-0 flex-1 sm:mt-3 flex items-start justify-between gap-2">
                <span className="block text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 line-clamp-2 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                  {video.title}
                </span>
                {isLessonWatched(`yt:${video.id}`) && <span className="shrink-0 text-xs font-semibold text-emerald-800 dark:text-emerald-300">تمت المشاهدة</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
