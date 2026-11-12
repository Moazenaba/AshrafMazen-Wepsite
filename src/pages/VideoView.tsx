import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import type { SitePlaylist, SiteVideo } from '../lib/libraryOverrides';
import { DownloadDialog } from '../components/DownloadDialog';
import { MediaStage } from '../components/media/MediaStage';
import { stageOfVideo } from '../components/media/stageMedia';
import { ReportLink } from '../components/ReportLink';
import { BookmarkButton } from '../components/BookmarkButton';
import { saveRecentLesson } from '../services/recentLessonService';
import { getResumeSeconds, isLessonWatched, markLessonWatched, saveLessonPosition } from '../services/progressService';
import { createPlaybackMeter, getViewCount, trackView } from '../services/analytics';
import { formatArabicCount, formatAudioTime, COUNT_FORMS } from '../utils/helpers';

// Progress and "continue watching" use the key "yt:<videoId>", so a playlist video is remembered like a lesson
const progressKey = (videoId: string) => `yt:${videoId}`;

// One video, played inside the site, with its playlist beside it
export const VideoView: React.FC = () => {
  const { videoId = '' } = useParams<{ videoId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const listId = params.get('list');

  const library = useYoutubeLibrary();
  const found = useMemo(() => {
    for (const playlist of library) {
      const video = playlist.videos.find((v) => v.id === videoId);
      if (video) return { video, playlist };
    }
    return null;
  }, [library, videoId]);

  // A YouTube video outside the library (for example the one the home page's featured card opens) still plays here
  const loose: SiteVideo | null = !found && library.length > 0 && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? { id: videoId, title: params.get('t') || '' } : null;
  const video: SiteVideo | null = found?.video ?? loose;
  const [downloading, setDownloading] = useState(false);
  const playlist: SitePlaylist | null = library.find((p) => p.id === listId) ?? found?.playlist ?? null;
  const index = playlist && video ? playlist.videos.findIndex((v) => v.id === video.id) : -1;
  const next = playlist && index >= 0 && index < playlist.videos.length - 1 ? playlist.videos[index + 1] : null;
  const resumeAt = useMemo(() => getResumeSeconds(progressKey(videoId)), [videoId]);

  // Statistics: seconds actually played (a jump forward or back adds nothing), and how often it was watched
  const statsKey = `yt:${videoId}`;
  const meter = useMemo(() => createPlaybackMeter('video', statsKey), [statsKey]);
  const [views, setViews] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    getViewCount(statsKey).then((count) => active && setViews(count));
    return () => {
      active = false;
    };
  }, [statsKey]);

  // Remember the video as the one the visitor last opened
  useEffect(() => {
    if (!video) return;
    saveRecentLesson({ id: progressKey(video.id), title: video.title, seriesTitle: playlist?.title });
  }, [video, playlist]);

  // The library arrives a moment after the page; until then keep the space instead of saying "not found"
  if (!video && library.length === 0) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (!video) {
    return (
      <div className="w-full px-5 py-20 space-y-4">
        <h1 className="font-ruqaa text-4xl text-stone-900 dark:text-stone-100">الفيديو غير متاح</h1>
        <Link to="/" className="inline-flex items-center gap-2 min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {playlist && (
        <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
          <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            الرئيسية
          </Link>
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          <Link to={`/playlist/${playlist.id}`} className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
            {playlist.title}
          </Link>
        </nav>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <MediaStage
            key={video.id}
            media={stageOfVideo(video, playlist?.title)}
            onDownload={() => setDownloading(true)}
            startAt={resumeAt}
            onTimeUpdate={(seconds, duration, from) => {
              // Listening is counted by the site's audio player; watching here
              if (from === 'video') {
                trackView('video', statsKey);
                meter.update(seconds);
              }
              saveLessonPosition(progressKey(video.id), seconds, duration);
            }}
            onEnded={() => {
              markLessonWatched(progressKey(video.id));
              if (next && playlist) navigate(`/video/${next.id}?list=${playlist.id}`);
            }}
          />

          {downloading && <DownloadDialog title={video.title} videos={[video]} onClose={() => setDownloading(false)} />}

          {video.title && <h1 className="font-semibold text-xl sm:text-2xl leading-snug text-stone-900 dark:text-stone-100 text-balance">{video.title}</h1>}

          {views !== null && views > 0 && (
            <p className="text-sm text-stone-600 dark:text-stone-400">{formatArabicCount(views, COUNT_FORMS.view)}</p>
          )}

          {resumeAt > 0 && (
            <p className="text-sm text-emerald-800 dark:text-emerald-300 tabular-nums">متابعة من {formatAudioTime(resumeAt)}</p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <BookmarkButton id={statsKey} />
            <ReportLink />
          </div>

          {next && (
            <Link
              to={`/video/${next.id}?list=${playlist?.id ?? ''}`}
              className="inline-flex items-center gap-2 min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              الفيديو التالي: {next.title}
            </Link>
          )}
        </div>

        {playlist && (
          <aside aria-label={`فيديوهات ${playlist.title}`} className="min-w-0 space-y-3">
            <h2 className="font-ruqaa text-2xl text-stone-900 dark:text-stone-100">{playlist.title}</h2>
            <ol className="space-y-1 max-h-[70vh] overflow-y-auto pe-2">
              {playlist.videos.map((item, i) => {
                const current = item.id === video.id;
                return (
                  <li key={item.id}>
                    <Link
                      to={`/video/${item.id}?list=${playlist.id}`}
                      aria-current={current ? 'true' : undefined}
                      className={`flex items-start gap-3 p-3 rounded-lg text-sm leading-snug transition-colors ${
                        current
                          ? 'bg-emerald-900 text-white'
                          : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-stone-700'
                      }`}
                    >
                      <span className="shrink-0 tabular-nums font-bold">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        {item.title}
                        {isLessonWatched(progressKey(item.id)) && <span className="block text-xs opacity-75 mt-0.5">تمت المشاهدة</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>
        )}
      </div>
    </div>
  );
};
