// Home page: The channel's playlists: one row per playlist, each with its newest video.
import React from 'react';
import { Link } from 'react-router-dom';
import { LessonThumb } from '../../components/LessonThumb';
import { bandHeading } from './Panel';
import { type LibraryPlaylist } from '../../data/youtube-library';

export const ChannelPlaylists = ({ visibleLibrary }: { visibleLibrary: LibraryPlaylist[] }) => (
  <>
        {visibleLibrary.length > 0 && (
          <section data-reveal aria-labelledby="channel-heading" className="rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
            <h2 id="channel-heading" className={bandHeading}>
              من قناة الشيخ على يوتيوب
            </h2>
            <ul className="p-3 sm:p-5 space-y-2 sm:space-y-3">
              {visibleLibrary.map((playlist, index) => {
                const newest = playlist.videos[0];
                return (
                  <li key={playlist.id} data-reveal style={{ '--reveal-delay': `${Math.min(index, 6) * 70}ms` } as React.CSSProperties}>
                    <Link
                      to={`/playlist/${playlist.id}`}
                      className="group grid grid-cols-[92px_minmax(0,1fr)] sm:grid-cols-[280px_minmax(0,1fr)] gap-3 sm:gap-5 items-center p-2 sm:p-3 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
                    >
                      <LessonThumb youtubeUrl={`https://www.youtube.com/watch?v=${playlist.latestVideoId}`} className="w-full" />
                      <span className="min-w-0 space-y-1 sm:space-y-2">
                        <span className="block font-ruqaa text-xl sm:text-3xl leading-snug text-mushaf dark:text-gold-soft">{playlist.title}</span>
                        <span className="block text-xs sm:text-sm text-stone-600 dark:text-stone-400">{playlist.videos.length} فيديو</span>
                        {newest && (
                          <span className="hidden sm:block text-stone-800 dark:text-stone-200 leading-relaxed line-clamp-2">
                            <span className="text-gold-deep dark:text-gold font-semibold">أحدث فيديو: </span>
                            {newest.title}
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
  </>
);
