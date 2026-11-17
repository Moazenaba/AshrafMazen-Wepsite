// Picks what the home card's button opens: any published lesson, book or channel video, chosen from a list or found by name.
import React, { useEffect, useMemo, useState } from 'react';
import { searchLessons } from '../../../services/data/lessonSearch';
import { getPublishedBooks } from '../../../services/data/books';
import { useYoutubeLibrary } from '../../../lib/youtubeLibrary';
import { buildTargets, matchTargets, TARGET_KIND_LABEL, type FeatureTarget, type TargetSources } from '../../../services/data/featureTargets';

const input =
  'w-full h-11 px-3 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-700';

interface Props {
  // What is chosen now (the page address and its name), shown above the search
  href: string;
  label: string;
  onPick: (target: FeatureTarget) => void;
  onClear: () => void;
}

export const FeatureTargetPicker: React.FC<Props> = ({ href, label, onPick, onClear }) => {
  const playlists = useYoutubeLibrary();
  const [lessons, setLessons] = useState<TargetSources['lessons']>([]);
  const [books, setBooks] = useState<TargetSources['books']>([]);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    Promise.all([searchLessons('', true), getPublishedBooks()])
      .then(([l, b]) => {
        if (!alive) return;
        setLessons(l.map((x) => ({ id: x.id, title: x.title })));
        setBooks(b.map((x) => ({ id: x.id, title: x.title })));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const targets = useMemo(
    () => buildTargets({ lessons, books, videos: playlists.flatMap((p) => p.videos.map((v) => ({ id: v.id, title: v.title }))) }),
    [lessons, books, playlists]
  );
  const matches = useMemo(() => matchTargets(targets, query), [targets, query]);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold text-stone-800 dark:text-stone-200">الدرس الذي يفتحه زر «شاهد واستمع الآن»</span>
      {href ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-stone-900 dark:text-stone-100">
          <span className="font-semibold">المختار:</span>
          <span>{label || href}</span>
          <button type="button" onClick={onClear} className="inline-flex items-center h-11 px-3 rounded-xl text-sm font-semibold text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">
            إزالة
          </button>
        </p>
      ) : (
        <p className="text-xs text-stone-500 dark:text-stone-400">لم يُختر شيء، فلن يظهر الزر.</p>
      )}
      <input aria-label="ابحث باسم الدرس أو الكتاب أو الفيديو" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث باسم الدرس أو الكتاب أو الفيديو…" className={input} />
      {failed && <p role="alert" className="text-xs text-red-700 dark:text-red-400">تعذّر تحميل بعض القوائم، قد تكون النتائج ناقصة.</p>}
      <ul className="max-h-56 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-700 divide-y divide-stone-200 dark:divide-stone-700">
        {matches.length === 0 && <li className="p-3 text-sm text-stone-500">لا نتائج.</li>}
        {matches.map((t) => (
          <li key={`${t.kind}:${t.id}`}>
            <button type="button" onClick={() => onPick(t)} className="w-full text-start flex items-center gap-2 px-3 py-2.5 min-h-11 text-sm hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100">
              <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300">{TARGET_KIND_LABEL[t.kind]}</span>
              <span className="line-clamp-2">{t.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
