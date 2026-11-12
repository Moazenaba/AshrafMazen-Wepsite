// The sheikh's YouTube channel, to listen to as sound only: a list per playlist (or a search over all of them).
// A tap opens the video's page already on "استمع فقط" (?mode=listen): the same player as everywhere, with download.
// Its sound starts at once and then goes on with the screen off and in the phone's notifications (YoutubeAudioBar).
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Headphones } from 'lucide-react';
import { useYoutubeLibrary } from '../../lib/youtubeLibrary';
import type { SiteVideo } from '../../lib/libraryOverrides';
import { siteAudioOf, youtubeTrackId } from '../../lib/youtubeAudio';
import { getLessonProgress, isLessonWatched } from '../../services/progressService';
import { formatAudioTime, normalizeArabic } from '../../utils/helpers';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const PAGE = 40;

type Item = { video: SiteVideo; playlist: string; playlistId: string };

// A video can be heard if the site has its sound, or it is a YouTube video (an uploaded video file has no sound of its own here)
const listenable = (v: SiteVideo) => !!siteAudioOf(v) || (!v.src && YOUTUBE_ID.test(v.id));

const listenHref = ({ video, playlistId }: Item) => `/video/${video.id}?list=${playlistId}&mode=listen`;

export const ChannelAudio: React.FC = () => {
  const library = useYoutubeLibrary();
  const [playlistId, setPlaylistId] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  const playlists = useMemo(() => library.filter((p) => p.videos.some(listenable)), [library]);
  const chosen = playlists.find((p) => p.id === playlistId) ?? playlists[0];

  const items = useMemo<Item[]>(() => {
    const q = normalizeArabic(query.trim());
    if (q) {
      // A search looks through every playlist; a video in several lists shows once
      const seen = new Set<string>();
      return playlists.flatMap((p) =>
        p.videos.filter((v) => listenable(v) && !seen.has(v.id) && normalizeArabic(v.title).includes(q) && seen.add(v.id)).map((video) => ({ video, playlist: p.title, playlistId: p.id }))
      );
    }
    return (chosen?.videos ?? []).filter(listenable).map((video) => ({ video, playlist: chosen!.title, playlistId: chosen!.id }));
  }, [playlists, chosen, query]);

  if (playlists.length === 0) return null;

  return (
    <section aria-labelledby="channel-audio-heading" className="rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
      <div className="px-4 py-3 sm:px-5 bg-mushaf border-b-2 border-gold space-y-3">
        <h2 id="channel-audio-heading" className="text-gold-soft font-ruqaa text-xl sm:text-2xl">
          من قناة الشيخ على يوتيوب
        </h2>
        <p className="text-sm text-white/85">اضغط على أي درس يفتح على «استمع فقط»: صوت بدون فيديو، يفضل شغال لو قفلت الشاشة أو خرجت من الموقع، ومعاه زرار التحميل.</p>
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
          <label htmlFor="channel-playlist" className="sr-only">القائمة</label>
          <select
            id="channel-playlist"
            value={chosen?.id ?? ''}
            onChange={(e) => {
              setPlaylistId(e.target.value);
              setQuery('');
              setLimit(PAGE);
            }}
            className="h-12 px-3 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({arabicNumber(p.videos.filter(listenable).length)})
              </option>
            ))}
          </select>
          <label htmlFor="channel-query" className="sr-only">ابحث في كل القناة</label>
          <input
            id="channel-query"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="ابحث في كل القناة..."
            className="h-12 px-4 rounded-lg bg-white dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="p-5 text-stone-700 dark:text-stone-300">لا يوجد ما يطابق البحث.</p>
      ) : (
        <ul className="p-2 sm:p-3 space-y-1">
          {items.slice(0, limit).map((item) => {
            const id = youtubeTrackId(item.video.id);
            const progress = getLessonProgress(id);
            const watched = isLessonWatched(id);
            const resumeAt = !watched && progress && progress.seconds > 5 ? progress.seconds : 0;
            const searching = !!query.trim();
            return (
              <li key={item.video.id}>
                <Link
                  to={listenHref(item)}
                  className="press flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors hover:bg-stone-50 dark:hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mushaf"
                >
                  <span aria-hidden="true" className="shrink-0 w-12 h-12 rounded-full bg-mushaf text-gold-soft flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100">{item.video.title}</span>
                    {(searching || resumeAt > 0) && (
                      <span className="block text-sm text-stone-600 dark:text-stone-400">
                        {[searching ? item.playlist : '', resumeAt ? `توقفت عند ${formatAudioTime(resumeAt)}` : ''].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </span>
                  {watched && <Check className="w-5 h-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="تم الاستماع" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > limit && (
        <div className="p-3 pt-0 text-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE)} className="press min-h-11 px-5 rounded-xl bg-stone-100 dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-semibold">
            عرض المزيد ({arabicNumber(items.length - limit)})
          </button>
        </div>
      )}
    </section>
  );
};
