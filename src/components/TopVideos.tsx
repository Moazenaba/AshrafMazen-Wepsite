import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { COUNT_FORMS, formatArabicCount } from '../utils/helpers';
import { LessonThumb } from './LessonThumb';

// The channel's most watched videos on this site, from the site's own statistics (hidden videos never appear)
export const TopVideos: React.FC = () => {
  const library = useYoutubeLibrary();
  const [rows, setRows] = useState<{ key: string; views: number }[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.resolve(
      supabase.from('content_stats').select('key,views').like('key', 'yt:%').gt('views', 0).order('views', { ascending: false }).limit(12)
    )
      .then(({ data }) => active && setRows((data || []).map((r: any) => ({ key: r.key, views: Number(r.views) || 0 }))))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const top = useMemo(() => {
    const index = new Map<string, { title: string; playlistId: string }>();
    library.forEach((p) => p.videos.forEach((v) => index.set(v.id, { title: v.title, playlistId: p.id })));
    return rows
      .map((r) => ({ ...r, id: r.key.slice(3), info: index.get(r.key.slice(3)) }))
      .filter((r) => r.info)
      .slice(0, 4);
  }, [rows, library]);

  if (top.length === 0) return null;

  return (
    <section aria-labelledby="top-videos-heading" className="rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
      <h2 id="top-videos-heading" className="px-4 py-2.5 sm:px-5 sm:py-3 bg-mushaf text-gold-soft font-ruqaa text-xl sm:text-2xl border-b-2 border-gold">
        الأكثر مشاهدة من القناة
      </h2>
      <ul className="p-3 sm:p-5 space-y-2">
        {top.map((video) => (
          <li key={video.id}>
            <Link
              to={`/video/${video.id}?list=${video.info!.playlistId}`}
              className="group flex items-center gap-3 p-2 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
            >
              <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${video.id}`} className="w-24 sm:w-32 shrink-0" />
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-sm sm:text-base font-semibold leading-snug text-stone-900 dark:text-stone-100 line-clamp-2">{video.info!.title}</span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                  <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatArabicCount(video.views, COUNT_FORMS.view)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};
