import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pause, Play, Check } from 'lucide-react';
import { getAudioLessons, type LessonWithRelations } from '../services/dataService';
import { getLessonProgress, isLessonWatched } from '../services/progressService';
import { useAudio, type AudioTrack } from '../context/AudioContext';
import { EmptyState } from '../components/EmptyState';
import { formatArabicDate, formatAudioTime } from '../utils/helpers';

const arabicNumber = (n: number) => new Intl.NumberFormat('ar-EG').format(n);

const trackOf = (lesson: LessonWithRelations): AudioTrack => ({
  id: lesson.id,
  title: lesson.title,
  subtitle: lesson.series?.title,
  src: lesson.audio_url,
  href: `/lesson/${lesson.id}`,
});

// Every lesson that has a recording, to listen to straight from the list. A tap plays it in the bar at the
// foot of the screen, which keeps playing while the visitor reads on or moves to another page.
export const AudioLibrary: React.FC = () => {
  const audio = useAudio();
  const [lessons, setLessons] = useState<LessonWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    document.title = 'الصوتيات - الشيخ أشرف مازن';
    getAudioLessons()
      .then(setLessons)
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    lessons.forEach((l) => l.category && seen.set(l.category.id, l.category.name));
    return [...seen.entries()];
  }, [lessons]);

  const shown = useMemo(() => {
    const q = query.trim();
    return lessons.filter(
      (l) => (!category || l.category?.id === category) && (!q || l.title.includes(q) || (l.series?.title || '').includes(q))
    );
  }, [lessons, query, category]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-ruqaa text-4xl sm:text-5xl text-mushaf dark:text-gold-soft">الصوتيات</h1>
        <p className="text-stone-700 dark:text-stone-300">
          دروس الشيخ مسموعة. اضغط تشغيل واستمع وأنت تتصفح الموقع أو والهاتف مغلق.
        </p>
      </header>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:gap-3 sm:max-w-2xl">
        <label htmlFor="audio-query" className="sr-only">ابحث في الصوتيات</label>
        <input
          id="audio-query"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بعنوان الدرس أو السلسلة..."
          className="h-12 px-4 rounded-lg bg-white dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-mushaf"
        />
        <label htmlFor="audio-category" className="sr-only">القسم</label>
        <select
          id="audio-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-12 px-3 rounded-lg bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-mushaf"
        >
          <option value="">كل الأقسام</option>
          {categories.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
      </form>

      {loading ? (
        <div className="min-h-[40vh]" aria-busy="true" />
      ) : failed ? (
        <p className="text-stone-700 dark:text-stone-300">تعذّر تحميل الصوتيات الآن. حاول مرة أخرى بعد قليل.</p>
      ) : lessons.length === 0 ? (
        <EmptyState
          title="لا توجد تسجيلات صوتية بعد"
          text="تُضاف هنا الدروس المسموعة فور رفعها. وفي الأثناء يمكنك مشاهدة سلاسل الشيخ، أو اقتراح مادة صوتية تُضاف بعد مراجعة الإدارة."
          actions={[
            { to: '/videos', label: 'شاهد السلاسل المرئية' },
            { to: '/contribute?type=audio', label: 'اقترح مادة صوتية' },
          ]}
        />
      ) : (
        <section aria-labelledby="audio-list-heading" className="rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
          <h2 id="audio-list-heading" className="px-4 py-2.5 sm:px-5 sm:py-3 bg-mushaf text-gold-soft font-ruqaa text-xl sm:text-2xl border-b-2 border-gold">
            {category || query ? `${arabicNumber(shown.length)} من ${arabicNumber(lessons.length)} تسجيل` : `كل التسجيلات (${arabicNumber(lessons.length)})`}
          </h2>
          {shown.length === 0 ? (
            <p className="p-5 text-stone-700 dark:text-stone-300">لا يوجد ما يطابق البحث.</p>
          ) : (
            <ul className="p-2 sm:p-3 space-y-1">
              {shown.map((lesson) => {
                const isCurrent = audio.track?.id === lesson.id;
                const playingThis = isCurrent && audio.playing;
                const progress = getLessonProgress(lesson.id);
                const watched = isLessonWatched(lesson.id);
                const resumeAt = !watched && progress && progress.seconds > 5 ? progress.seconds : 0;
                return (
                  <li
                    key={lesson.id}
                    className={`flex items-center gap-3 p-2 sm:p-3 rounded-lg transition-colors ${
                      isCurrent ? 'bg-gold-soft/40 dark:bg-stone-700' : 'hover:bg-stone-50 dark:hover:bg-stone-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => (isCurrent ? audio.toggle() : audio.play(trackOf(lesson)))}
                      aria-label={playingThis ? `إيقاف: ${lesson.title}` : `تشغيل: ${lesson.title}`}
                      className="press shrink-0 w-12 h-12 rounded-full bg-mushaf hover:bg-mushaf-deep text-gold-soft flex items-center justify-center"
                    >
                      {playingThis ? <Pause className="w-5 h-5 fill-current" aria-hidden="true" /> : <Play className="w-5 h-5 fill-current ms-0.5" aria-hidden="true" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <Link to={`/lesson/${lesson.id}`} className="block font-semibold leading-snug text-stone-900 dark:text-stone-100 hover:text-mushaf dark:hover:text-gold">
                        {lesson.title}
                      </Link>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {[lesson.series?.title, formatArabicDate(lesson.published_at)].filter(Boolean).join(' · ')}
                        {resumeAt ? ` · توقفت عند ${formatAudioTime(resumeAt)}` : ''}
                      </p>
                    </div>
                    {watched && <Check className="w-5 h-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-label="تم الاستماع" />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
