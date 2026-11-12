// "تحميل": asks whether to save the sound or the video, for one video or a whole playlist.
// It is drawn straight into <body> (a portal): the page's entrance animation would otherwise pin it inside the
// long page instead of the screen. On phones it sits at the top, where it is seen at once.
// Once a download starts, a 5-second count runs; then "إعادة التحميل" offers the file again as a plain link to tap.
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Download, Loader2, Music, RotateCcw, Video, X } from 'lucide-react';
import type { SiteVideo } from '../lib/libraryOverrides';
import { downloadAll, isStale, playlistSources, redownload, type DownloadKind, type StartedDownload } from '../lib/mediaDownload';
import { DownloadFallbacks } from './DownloadFallbacks';

const LABEL: Record<DownloadKind, string> = { audio: 'صوت فقط', video: 'فيديو' };
const n = (value: number) => new Intl.NumberFormat('ar-EG').format(value);
const WAIT_SECONDS = 5;

type State = {
  done: number;
  failed: number;
  total: number;
  finished: boolean;
  failedVideos?: { id: string; name: string }[];
  started?: StartedDownload[];
};

export const DownloadDialog: React.FC<{ title: string; videos: SiteVideo[]; onClose: () => void }> = ({ title, videos, onClose }) => {
  const [state, setState] = useState<State | null>(null);
  const [kind, setKind] = useState<DownloadKind | null>(null);
  const [countdown, setCountdown] = useState(0);
  const signal = useRef({ cancelled: false });
  const many = videos.length > 1;

  useEffect(() => {
    const s = signal.current;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // The page behind stays still while the window is open
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      s.cancelled = true;
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // The count after a download starts
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const start = async (k: DownloadKind) => {
    const { items } = playlistSources(videos, k);
    setKind(k);
    setCountdown(0);
    setState({ done: 0, failed: 0, total: items.length, finished: false });
    const result = await downloadAll(items, k, (done, failedSoFar) => setState({ done, failed: failedSoFar, total: items.length, finished: false }), signal.current);
    setState({ done: items.length, total: items.length, finished: true, ...result });
    // Only a download that started by itself needs the wait; a link to tap is shown at once
    if (result.started.some((d) => d.auto)) setCountdown(WAIT_SECONDS);
  };

  // "إعادة التحميل" on a link too old to work: a new one is fetched and started (or shown to tap)
  const [refreshing, setRefreshing] = useState<number | null>(null);
  // A tapped download button says what is happening: the browser shows nothing on the page itself when a download
  // starts (on phones it is a small bar or nothing), so without this the tap looked like it did nothing
  const [tapped, setTapped] = useState<Record<number, 'starting' | 'sent'>>({});
  const markTapped = (i: number) => {
    setTapped((t) => ({ ...t, [i]: 'starting' }));
    window.setTimeout(() => setTapped((t) => ({ ...t, [i]: 'sent' })), 2500);
    window.setTimeout(() => setTapped(({ [i]: _done, ...rest }) => rest), 12000);
  };
  const refresh = async (i: number, d: StartedDownload, k: DownloadKind) => {
    if (refreshing !== null) return;
    setRefreshing(i);
    try {
      const fresh = await redownload(d, k);
      if (fresh.auto) markTapped(i);
      setState((s) => (s?.started ? { ...s, started: s.started.map((x, j) => (j === i ? fresh : x)) } : s));
    } catch {
      setState((s) => (s ? { ...s, failedVideos: [...(s.failedVideos ?? []), { id: d.youtubeId!, name: d.name }] } : s));
    } finally {
      setRefreshing(null);
    }
  };

  const busy = !!state && !state.finished;
  const allFailed = !!state?.finished && state.failed === state.total;
  const started = state?.started ?? [];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dl-title"
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 border-t-4 border-gold shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="dl-title" className="flex items-center gap-2 font-bold text-xl text-mushaf dark:text-gold">
              <Download className="w-5 h-5" aria-hidden="true" />
              {many ? 'تحميل القائمة كاملة' : 'تحميل'}
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="font-bold text-lg text-stone-900 dark:text-stone-100">عايز تحمّله صوت ولا فيديو؟</p>
        <div className="grid grid-cols-2 gap-3">
          {(['audio', 'video'] as const).map((k) => {
            const { items, missing } = playlistSources(videos, k);
            const Icon = k === 'audio' ? Music : Video;
            const chosen = kind === k && !!state;
            return (
              <button
                key={k}
                type="button"
                disabled={items.length === 0 || busy}
                onClick={() => start(k)}
                className={`flex flex-col items-center gap-1.5 py-5 px-3 rounded-2xl font-bold transition-colors disabled:opacity-40 ${
                  chosen ? 'bg-mushaf-deep text-white ring-4 ring-gold' : 'bg-mushaf text-white hover:bg-mushaf-deep'
                }`}
              >
                <Icon className="w-8 h-8" aria-hidden="true" />
                <span className="text-lg">{LABEL[k]}</span>
                <span className="text-xs font-semibold text-gold-soft">
                  {items.length === 0 ? 'غير متاح' : k === 'audio' ? 'MP3' : 'MP4'}
                  {many && items.length > 0 ? ` · ${n(items.length)} ملف` : ''}
                  {many && missing > 0 ? ` (و${n(missing)} غير متاح)` : ''}
                </span>
              </button>
            );
          })}
        </div>

        {busy && state && (
          <p role="status" className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold">
            <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />
            {many ? `جارٍ تجهيز ${n(state.done + 1)} من ${n(state.total)}…` : 'جارٍ تجهيز الملف… ثواني قليلة.'}
          </p>
        )}

        {state?.finished && !allFailed && (
          <div role="status" className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 space-y-3">
            <p className="flex items-center gap-2 font-bold">
              {countdown > 0 ? <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />}
              {countdown > 0
                ? `بدأ التحميل… تأكد خلال ${n(countdown)}`
                : started.some((d) => d.auto)
                  ? 'لو التحميل ما بدأش، اضغط «إعادة التحميل».'
                  : 'الملف جاهز، اضغط الزر لتحميله.'}
            </p>
            {state.failed > 0 && <p className="text-sm">تعذّر {n(state.failed)} ملف، تجدها بالأسفل.</p>}
            {countdown === 0 && (
              <ul className="space-y-2 max-h-56 overflow-y-auto">
                {started.map((d, i) => {
                  const label = d.auto ? (many ? `إعادة: ${d.name}` : 'إعادة التحميل') : many ? `تحميل: ${d.name}` : 'تحميل الملف';
                  const now = refreshing === i ? 'refreshing' : tapped[i];
                  return (
                    <li key={i} className="space-y-1">
                      {/* A plain link the visitor taps: the surest way on a phone. An old cobalt link is asked for again first. */}
                      <a
                        href={d.url}
                        download={d.name}
                        aria-busy={now === 'refreshing' || now === 'starting'}
                        aria-disabled={now === 'refreshing'}
                        onClick={(e) => {
                          if (now === 'refreshing') return e.preventDefault();
                          if (isStale(d) && kind) {
                            e.preventDefault();
                            refresh(i, d, kind);
                            return;
                          }
                          markTapped(i);
                        }}
                        {...(d.attachment ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                        className={`flex items-center justify-center gap-2 min-h-12 px-4 rounded-xl text-white font-bold select-none transition duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gold ${
                          now === 'refreshing' || now === 'starting' ? 'bg-emerald-950 cursor-progress' : 'bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950'
                        }`}
                      >
                        {now === 'refreshing' || now === 'starting' ? (
                          <Loader2 className="w-5 h-5 shrink-0 animate-spin" aria-hidden="true" />
                        ) : now === 'sent' ? (
                          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                        ) : (
                          <RotateCcw className="w-5 h-5 shrink-0" aria-hidden="true" />
                        )}
                        <span className="min-w-0 truncate">
                          {now === 'refreshing' ? 'جارٍ تجهيز رابط جديد…' : now === 'starting' ? 'جارٍ بدء التحميل…' : now === 'sent' ? 'اتبعت للمتصفح، اضغط تاني لو ما ظهرش' : label}
                        </span>
                      </a>
                      {now === 'sent' && (
                        <p role="status" className="text-sm text-emerald-900 dark:text-emerald-200">
                          شوف شريط التنزيلات في المتصفح (أو إشعارات الموبايل). الملف بيتجهز وهو بيتحمّل، فممكن ياخد ثواني لحد ما يبدأ.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {allFailed && (
          <p role="alert" className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-semibold">
            خدمات التحميل المباشر لا تستجيب الآن. حمّله من أحد المواقع بالأسفل، أو حاول بعد قليل.
          </p>
        )}

        {state?.finished && !!state.failedVideos?.length && <DownloadFallbacks videos={state.failedVideos} many={many} />}
      </div>
    </div>,
    document.body
  );
};
