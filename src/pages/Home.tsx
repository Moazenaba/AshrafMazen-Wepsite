import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronLeft, Eye, Headphones, Play, Video } from 'lucide-react';
import {
  getCategoriesWithPortalData,
  getFeaturedLessons,
  getKhutabLessons,
  getLatestLessons,
  getSiteSettings,
  getTopViewedLessons,
  DEFAULT_SITE_SETTINGS,
  type CategoryWithPortalData,
  type LessonWithRelations,
} from '../services/dataService';
import { getRecentLesson } from '../services/recentLessonService';
import { getLessonProgress, getResumeSeconds } from '../services/progressService';
import { useYoutubeLibrary } from '../lib/youtubeLibrary';
import { LessonThumb } from '../components/LessonThumb';
import { MediaIcons } from '../components/MediaIcons';
import { QuoteTicker } from '../components/QuoteTicker';
import { TopVideos } from '../components/TopVideos';
import { LatestSearch, type LatestCategory, type LatestItem } from '../components/LatestSearch';
import { TICKER_QUOTES } from '../constants/tickerQuotes';
import {
  formatArabicCount,
  formatArabicDate,
  formatArabicViews,
  formatAudioTime,
  COUNT_FORMS,
} from '../utils/helpers';
import type { SiteSettings } from '../types';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

// The Friday sermons: the admin category "الخطب" and the channel playlist are the same content,
// so they show as one category named خطب الجمعة, and that playlist is not listed a second time
const JUMUAH_PLAYLIST_ID = 'PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_';
const JUMUAH_LABEL = 'خطب الجمعة';
const isSermonCategory = (name: string) => name === 'الخطب' || name === JUMUAH_LABEL;

// A section heading in the manner of a mushaf's surah band: mushaf green, a gold rule beneath
const bandHeading = 'px-4 py-2.5 sm:px-5 sm:py-3 bg-mushaf text-gold-soft font-ruqaa text-xl sm:text-2xl border-b-2 border-gold';

// A titled block on the page: the band, then its content
// `anchor` is the section's own id, for links such as /#categories from the top bar and the footer
const Panel: React.FC<{ title: string; id: string; anchor?: string; className?: string; children: React.ReactNode }> = ({
  title,
  id,
  anchor,
  className = '',
  children,
}) => (
  <section data-reveal id={anchor} aria-labelledby={id} className={`rounded-xl bg-white dark:bg-stone-800 overflow-hidden ${className}`}>
    <h2 id={id} className={bandHeading}>
      {title}
    </h2>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

// One lesson in a numbered list
const LessonRow: React.FC<{ lesson: LessonWithRelations; rank: number }> = ({ lesson, rank }) => (
  <li>
    <Link
      to={`/lesson/${lesson.id}`}
      className="group flex items-start gap-4 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
    >
      <span className="shrink-0 w-8 h-8 rounded-full bg-mushaf text-gold-soft text-sm font-bold flex items-center justify-center tabular-nums">
        {arabicNumber(rank)}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
          {lesson.title}
        </span>
        <span className="block text-sm text-stone-600 dark:text-stone-400">
          {[lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
        </span>
        <span className="flex flex-wrap items-center gap-3 text-xs text-stone-600 dark:text-stone-400">
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            {formatArabicViews(lesson.views)} مشاهدة
          </span>
          <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
        </span>
      </span>
    </Link>
  </li>
);

// The three ways into the content: watch, listen, read. One bar split in three by tone, not three cards
const CONTENT_KINDS = [
  { to: '/videos', label: 'شاهد', name: 'المرئيات', note: 'سلاسل الشيخ المصوّرة', Icon: Video },
  { to: '/audio', label: 'استمع', name: 'الصوتيات', note: 'يستمر التشغيل أثناء التصفح', Icon: Headphones },
  { to: '/books', label: 'اقرأ', name: 'المكتبة', note: 'كتب ورسائل بصيغة PDF', Icon: BookOpen },
];

const ContentKinds: React.FC = () => (
  <nav aria-label="أنواع المحتوى" className="rounded-xl overflow-hidden bg-mushaf-deep">
    <ul className="grid grid-cols-3 gap-1">
      {CONTENT_KINDS.map(({ to, label, name, note, Icon }) => (
        <li key={to}>
          <Link
            to={to}
            className="group flex h-full flex-col items-center sm:items-start gap-1 sm:gap-2 px-2 py-4 sm:px-6 sm:py-5 text-center sm:text-start bg-mushaf text-gold-soft hover:bg-[#0c4232] focus-visible:bg-[#0c4232] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-gold" aria-hidden="true" />
              <span className="font-ruqaa text-2xl sm:text-3xl leading-none">{label}</span>
            </span>
            <span className="text-sm font-semibold text-white">{name}</span>
            <span className="hidden sm:block text-sm text-gold-soft/80">{note}</span>
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

// The featured lesson: large, with its frame and the one action
const FeaturedCard: React.FC<{ lesson: LessonWithRelations }> = ({ lesson }) => (
  <article className="rounded-xl bg-mushaf text-white overflow-hidden border-b-4 border-gold">
    <div className="grid grid-cols-[84px_minmax(0,1fr)] min-[360px]:grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 p-4 sm:p-7 items-center">
      <div className="order-2 sm:order-none min-w-0 space-y-2 sm:space-y-4">
        <h3 className="font-sans text-base min-[360px]:text-lg sm:text-3xl font-bold leading-snug text-balance line-clamp-3 sm:line-clamp-none">
          <Link to={`/lesson/${lesson.id}`} className="hover:text-gold-soft transition-colors">
            {lesson.title}
          </Link>
        </h3>
        <p className="-mt-1 sm:-mt-2 text-xs sm:text-sm text-gold-soft">
          {[lesson.series?.title && `من: ${lesson.series.title}`, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
        </p>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link
            to={`/lesson/${lesson.id}`}
            className="press inline-flex items-center whitespace-nowrap gap-1.5 min-[360px]:gap-2 h-11 sm:h-12 px-2.5 min-[360px]:px-4 sm:px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep text-[13px] min-[360px]:text-sm sm:text-base font-bold"
          >
            <Play className="w-4 h-4 fill-current" aria-hidden="true" />
            شاهد واستمع الآن
          </Link>
          <span className="hidden sm:inline-flex">
            <MediaIcons youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} transcript={lesson.transcript} />
          </span>
        </div>
      </div>
      <div className="order-1 sm:order-none">
        <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} className="w-full" />
      </div>
    </div>
  </article>
);

// Where "continue watching" goes: a lesson, or a playlist video stored with the "yt:" prefix
// The continue-watching block: its own band, the title, how far the visitor got, and one clear action
const ContinueCard: React.FC<{
  href: string;
  title: string;
  seriesTitle?: string;
  seconds: number;
  duration: number;
}> = ({ href, title, seriesTitle, seconds, duration }) => {
  const percent = duration > 0 ? Math.min(100, Math.round((seconds / duration) * 100)) : 0;
  return (
    <section data-reveal aria-labelledby="continue-heading" className="rounded-xl bg-gold text-mushaf-deep overflow-hidden">
      <h2 id="continue-heading" className="px-5 pt-5 font-ruqaa text-3xl">
        تابع من حيث توقفت
      </h2>
      <p className="px-5 text-sm font-semibold">تعالى كمّل من آخر نقطة وقفتها</p>
      <div className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold text-lg leading-snug">{title}</p>
          {seriesTitle && <p className="text-sm opacity-80">{seriesTitle}</p>}
          {seconds > 0 && (
            <div className="space-y-1.5">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label="ما شاهدته من الدرس"
                className="h-2 rounded-full bg-mushaf-deep/20 overflow-hidden"
              >
                <div className="h-full rounded-full bg-mushaf-deep" style={{ width: `${percent}%` }} />
              </div>
              <p className="text-sm font-semibold tabular-nums">متابعة من {formatAudioTime(seconds)}</p>
            </div>
          )}
        </div>
        <Link
          to={href}
          className="press shrink-0 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-lg bg-mushaf-deep hover:bg-mushaf text-gold-soft font-bold"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          متابعة المشاهدة
        </Link>
      </div>
    </section>
  );
};

const continueHref = (id: string) => (id.startsWith('yt:') ? `/video/${id.slice(3)}` : `/lesson/${id}`);

export const Home: React.FC = () => {
  const library = useYoutubeLibrary();
  const [categories, setCategories] = useState<CategoryWithPortalData[]>([]);
  const [featuredList, setFeaturedList] = useState<LessonWithRelations[]>([]);
  const [latestList, setLatestList] = useState<LessonWithRelations[]>([]);
  const [viewedList, setViewedList] = useState<LessonWithRelations[]>([]);
  const [sermonList, setSermonList] = useState<LessonWithRelations[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [recentLesson] = useState(getRecentLesson);

  useEffect(() => {
    let isMounted = true;
    getSiteSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch(() => {});

    Promise.all([
      getCategoriesWithPortalData(1),
      getFeaturedLessons(3),
      getLatestLessons(30),
      getTopViewedLessons(6),
      getKhutabLessons(8),
    ])
      .then(([cats, featured, latest, viewed, sermons]) => {
        if (!isMounted) return;
        setCategories(cats);
        setFeaturedList(featured);
        setLatestList(latest);
        setViewedList(viewed);
        setSermonList(sermons);
      })
      .catch((err) => console.error('Error loading home data:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  // Each lesson is placed once. Sections take their lessons in this order, skipping any already placed:
  // the continue-watching lesson, the featured lesson, each category's newest, the newest, the most viewed,
  // the sermons, and the sidebar video.
  const placed = useMemo(() => {
    // The featured lesson is pinned by the admin, so it is placed first; the continue-watching lesson is reserved after it
    const used = new Set<string>();
    const pick = (list: LessonWithRelations[], n: number, accept: (l: LessonWithRelations) => boolean = () => true) => {
      const out: LessonWithRelations[] = [];
      for (const lesson of list) {
        if (out.length >= n) break;
        if (used.has(lesson.id) || !accept(lesson)) continue;
        used.add(lesson.id);
        out.push(lesson);
      }
      return out;
    };

    const featured = pick(featuredList, 1)[0] ?? null;
    if (recentLesson && !recentLesson.id.startsWith('yt:')) used.add(recentLesson.id);
    const categoryBlocks = categories
      .filter((cat) => cat.lessonCount > 0)
      .map((cat) => ({ cat, newest: pick(cat.recentLessons, 1)[0] ?? null }));
    const newest = pick(latestList, 4);
    const viewed = pick(viewedList, 3);
    const sermons = pick(sermonList, 4);
    const video = pick(latestList, 1, (l) => Boolean(l.youtube_url))[0] ?? null;
    return { featured, categoryBlocks, newest, viewed, sermons, video };
  }, [categories, featuredList, latestList, viewedList, sermonList, recentLesson]);

  const displayName = settings.banner_name || DEFAULT_SITE_SETTINGS.banner_name;
  const aboutText = settings.about_sheikh || DEFAULT_SITE_SETTINGS.about_sheikh || '';
  const activeCategories = categories.filter((cat) => cat.lessonCount > 0);
  const visibleLibrary = library.filter((p) => p.id !== JUMUAH_PLAYLIST_ID);

  // Everything that was just published: the site's lessons and the newest videos of each playlist.
  // A lesson in the sermon category counts as the sermons playlist, so it is listed under one name.
  const latestItems = useMemo<LatestItem[]>(() => {
    const lessonItems: LatestItem[] = latestList.map((lesson) => {
      const name = lesson.category?.name ?? '';
      return {
        id: lesson.id,
        title: lesson.title,
        href: `/lesson/${lesson.id}`,
        meta: [lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · '),
        category: isSermonCategory(name) ? `pl:${JUMUAH_PLAYLIST_ID}` : name ? `db:${name}` : '',
        date: lesson.published_at ?? '',
        youtubeUrl: lesson.youtube_url,
        audioUrl: lesson.audio_url,
        transcript: lesson.transcript,
      };
    });
    const videoItems: LatestItem[] = library.flatMap((playlist) =>
      playlist.videos.slice(0, 3).map((video) => ({
        id: `yt:${video.id}`,
        title: video.title,
        href: `/video/${video.id}?list=${playlist.id}`,
        meta: [playlist.title, video.published ? formatArabicDate(video.published) : ''].filter(Boolean).join(' · '),
        category: `pl:${playlist.id}`,
        date: video.published ?? '',
        youtubeUrl: `https://www.youtube.com/watch?v=${video.id}`,
      }))
    );
    // Newest first; items without a date keep their order at the end
    return [...lessonItems, ...videoItems].sort((a, b) => b.date.localeCompare(a.date));
  }, [latestList, library]);

  const categoryOptions = useMemo<LatestCategory[]>(
    () => [
      ...activeCategories
        .filter((cat) => !isSermonCategory(cat.name))
        .map((cat) => ({ value: `db:${cat.name}`, label: cat.name })),
      ...library.map((playlist) => ({ value: `pl:${playlist.id}`, label: playlist.title })),
    ],
    [activeCategories, library]
  );
  const recentResume = recentLesson ? getResumeSeconds(recentLesson.id) : 0;
  const recentDuration = recentLesson ? (getLessonProgress(recentLesson.id)?.duration ?? 0) : 0;

  // Today in the Hijri and Gregorian calendars, as the site's date line: "الثلاثاء، 23 جمادى الأولى 1448 هـ - 3 نوفمبر 2026"
  const today = new Date();
  const weekday = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { weekday: 'long' }).format(today);
  const gregorian = new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }).format(today);
  const todayLine = `${weekday}، ${hijri} - ${gregorian}`;

  return (
    <div className="pb-8 sm:pb-20">
      {/* The hero: the name, and beneath it one hadith set in the script of the books of knowledge */}
      <section aria-labelledby="hero-title" className="px-6 sm:px-8 pt-5 pb-5 sm:pt-20 sm:pb-12 text-center space-y-4 sm:space-y-5">
        <p className="text-xs sm:text-base text-stone-600 dark:text-stone-400 tabular-nums">{todayLine}</p>
        <h1 id="hero-title" className="font-ruqaa text-[2.5rem] sm:text-6xl lg:text-7xl leading-[1.25] sm:leading-[1.3] text-mushaf dark:text-gold-soft text-balance">
          {displayName.split(' ').map((word, i) => (
            <React.Fragment key={`${word}-${i}`}>
              {i > 0 && ' '}
              {/* Each word rises in turn (CSS, see .hero-word); reduced motion shows the name at once */}
              <span className="hero-word" style={{ animationDelay: `${0.08 * i}s` }}>
                {word}
              </span>
            </React.Fragment>
          ))}
        </h1>
        <p
          className="hero-fade mx-auto max-w-xs sm:max-w-none font-amiri text-xl sm:text-3xl leading-relaxed sm:leading-loose text-gold-deep dark:text-gold text-balance"
        >
          {/* On phones the attribution sits on its own line above the saying, so the saying never runs edge to edge */}
          <span className="block sm:inline text-base sm:text-3xl text-stone-600 dark:text-stone-400 sm:text-gold-deep sm:dark:text-gold">قال رسول الله ﷺ:</span>{' '}
          «من يُرِد الله به خيرًا يُفقِّهه في الدين»
          <span className="block mt-1 sm:mt-0 text-sm sm:text-base text-stone-600 dark:text-stone-400">متفق عليه</span>
        </p>
      </section>

      {/* The quotes stay pinned under the top bar while the page scrolls, full width.
          On a short screen (a phone held sideways) they scroll away, so the pinned bars never fill the view */}
      <div className="sticky [@media(max-height:500px)]:static top-16 sm:top-[72px] z-30 bg-stone-50 dark:bg-stone-950 px-4 sm:px-6 lg:px-8 pt-1 pb-2 sm:py-2">
        <QuoteTicker items={TICKER_QUOTES} />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Top of the main column: the featured lesson and the latest, which ends level with the menu beside it */}
          <div className="min-w-0 space-y-5 sm:space-y-8 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
            {placed.featured && (
              <section aria-labelledby="featured-heading" className="space-y-4">
                <h2 id="featured-heading" className="sr-only">
                  اخترنا لك
                </h2>
                <FeaturedCard lesson={placed.featured} />
              </section>
            )}

            <ContentKinds />

            <LatestSearch items={latestItems} categories={categoryOptions} className="lg:flex-1" />
          </div>

          <div className="min-w-0 space-y-5 sm:space-y-8 lg:col-start-1 lg:row-start-2">
            {/* The sciences: the categories, one card each */}
            <Panel title="العلوم الشرعية والمتون" id="sciences-heading" anchor="categories">
              <div className="space-y-5">
                {activeCategories.length > 0 && (
                  <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3">
                    {placed.categoryBlocks.map(({ cat, newest }) => (
                      <li key={cat.id} className="h-full">
                        <Link
                          to={isSermonCategory(cat.name) ? `/playlist/${JUMUAH_PLAYLIST_ID}` : `/category/${cat.slug}`}
                          className="group flex flex-col h-full p-3 sm:p-5 rounded-lg bg-stone-50 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 transition-colors"
                        >
                          <span className="font-sans text-base sm:text-xl font-bold text-mushaf dark:text-gold-soft transition-colors">
                            {isSermonCategory(cat.name) ? JUMUAH_LABEL : cat.name}
                          </span>
                          <span className="mt-1 text-xs sm:text-sm text-stone-600 dark:text-stone-400">
                            {formatArabicCount(cat.seriesCount, COUNT_FORMS.series)} · {formatArabicCount(cat.lessonCount, COUNT_FORMS.lesson)}
                          </span>
                          {newest && (
                            <span className="mt-auto pt-3 sm:pt-4 space-y-2">
                              <span className="block text-xs sm:text-sm leading-snug text-stone-800 dark:text-stone-200 line-clamp-2">{newest.title}</span>
                              <span className="hidden sm:inline-flex">
                                <MediaIcons youtubeUrl={newest.youtube_url} audioUrl={newest.audio_url} transcript={newest.transcript} />
                              </span>
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>

            {placed.newest.length > 0 && (
              <Panel title="الجديد من الدروس" id="latest-heading">
                <ol className="space-y-3">
                  {placed.newest.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} rank={i + 1} />
                  ))}
                </ol>
              </Panel>
            )}

            <TopVideos />

            {placed.viewed.length > 0 && (
              <Panel title="الأكثر مشاهدة" id="viewed-heading">
                <ol className="space-y-3">
                  {placed.viewed.map((lesson, i) => (
                    <LessonRow key={lesson.id} lesson={lesson} rank={i + 1} />
                  ))}
                </ol>
              </Panel>
            )}

            {placed.sermons.length > 0 && (
              <Panel title="الخطب والمواعظ" id="sermons-heading">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {placed.sermons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link to={`/lesson/${lesson.id}`} className="group block space-y-2">
                        <LessonThumb youtubeUrl={lesson.youtube_url} audioUrl={lesson.audio_url} className="w-full" />
                        <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
                          {lesson.title}
                        </span>
                        <span className="block text-sm text-stone-600 dark:text-stone-400">{formatArabicDate(lesson.published_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          {/* Side column: the menu beside the latest, then the continue card and the video */}
          <aside className="min-w-0 lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col" aria-label="القائمة الجانبية">
            <Panel title="القائمة" id="menu-heading" className="lg:flex-1">
              <ul className="flex flex-wrap gap-2 sm:block sm:space-y-1">
                <li>
                  <Link to="/search" className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent">
                    كل الدروس
                    <ChevronLeft className="hidden sm:block w-4 h-4" aria-hidden="true" />
                  </Link>
                </li>
                {activeCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={isSermonCategory(cat.name) ? `/playlist/${JUMUAH_PLAYLIST_ID}` : `/category/${cat.slug}`}
                      className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent"
                    >
                      {isSermonCategory(cat.name) ? JUMUAH_LABEL : cat.name}
                      <ChevronLeft className="hidden sm:block w-4 h-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {visibleLibrary.map((playlist) => (
                  <li key={playlist.id}>
                    <Link
                      to={`/playlist/${playlist.id}`}
                      className="inline-flex max-w-full items-center min-h-11 px-4 rounded-full bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700 sm:flex sm:justify-between sm:rounded-lg sm:px-3 sm:bg-transparent dark:sm:bg-transparent"
                    >
                      <span className="min-w-0 truncate">{playlist.title}</span>
                      <ChevronLeft className="hidden sm:block w-4 h-4 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>

          <div className="min-w-0 space-y-8 lg:col-start-2 lg:row-start-2">
            {recentLesson && (
              <ContinueCard
                href={continueHref(recentLesson.id)}
                title={recentLesson.title}
                seriesTitle={recentLesson.seriesTitle}
                seconds={recentResume}
                duration={recentDuration}
              />
            )}

            {placed.video && (
              <Panel title="أحدث درس مرئي" id="video-heading">
                <Link to={`/lesson/${placed.video.id}`} className="group block space-y-3">
                  <span className="relative block">
                    <LessonThumb youtubeUrl={placed.video.youtube_url} audioUrl={placed.video.audio_url} className="w-full" />
                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gold text-mushaf-deep">
                        <Play className="w-5 h-5 fill-current ms-0.5" />
                      </span>
                    </span>
                  </span>
                  <span className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 group-hover:text-mushaf dark:group-hover:text-gold transition-colors">
                    {placed.video.title}
                  </span>
                </Link>
              </Panel>
            )}
          </div>
        </div>

        {/* The channel's playlists: full width, one row per playlist, each with its newest video */}
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

        {/* About the sheikh, at the foot of the page, set like the commentary in a mushaf with tafsir */}
        {aboutText && (
          <section data-reveal aria-labelledby="about-heading" className="rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
            <h2 id="about-heading" className={`${bandHeading} text-center`}>
              عن الشيخ
            </h2>
            <div className="px-6 py-8 sm:px-12 sm:py-10">
              <p className="max-w-3xl mx-auto font-amiri text-xl sm:text-2xl leading-[2.1] text-justify text-stone-800 dark:text-stone-200">
                {aboutText}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
