// "تحميل": asks whether to save the sound or the video, for one video or a whole playlist.
import React, { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Loader2, Music, Video, X } from 'lucide-react';
import type { SiteVideo } from '../lib/libraryOverrides';
import { downloadAll, playlistSources, savefromUrl, type DownloadKind } from '../lib/mediaDownload';

const LABEL: Record<DownloadKind, string> = { audio: 'صوت فقط', video: 'فيديو' };
const n = (value: number) => new Intl.NumberFormat('ar-EG').format(value);

type State = { done: number; failed: number; total: number; finished: boolean; failedVideos?: { id: string; name: string }[] };

export const DownloadDialog: React.FC<{ title: string; videos: SiteVideo[]; onClose: () => void }> = ({ title, videos, onClose }) => {
  const [state, setState] = useState<State | null>(null);
  const signal = useRef({ cancelled: false });
  const many = videos.length > 1;

  useEffect(() => {
    const s = signal.current;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      s.cancelled = true;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const start = async (kind: DownloadKind) => {
    const { items } = playlistSources(videos, kind);
    setState({ done: 0, failed: 0, total: items.length, finished: false });
    const { failed, failedVideos } = await downloadAll(items, kind, (done, failedSoFar) => setState({ done, failed: failedSoFar, total: items.length, finished: false }), signal.current);
    setState({ done: items.length, failed, total: items.length, finished: true, failedVideos });
  };

  const busy = !!state && !state.finished;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="dl-title" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-stone-900 p-5 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="dl-title" className="font-bold text-lg text-stone-900 dark:text-stone-100">{many ? 'تحميل القائمة كاملة' : 'تحميل'}</h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">{title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <p className="font-semibold text-stone-800 dark:text-stone-200">عايز تحمّله صوت ولا فيديو؟</p>
        <div className="grid grid-cols-2 gap-3">
          {(['audio', 'video'] as const).map((kind) => {
            const { items, missing } = playlistSources(videos, kind);
            const Icon = kind === 'audio' ? Music : Video;
            return (
              <button
                key={kind}
                type="button"
                disabled={items.length === 0 || busy}
                onClick={() => start(kind)}
                className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-gold disabled:opacity-40 disabled:hover:border-stone-200 text-stone-900 dark:text-stone-100"
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="font-bold">{LABEL[kind]}</span>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  {items.length === 0 ? 'غير متاح' : kind === 'audio' ? 'MP3' : 'MP4'}
                  {many && items.length > 0 ? ` · ${n(items.length)} ملف` : ''}
                  {many && missing > 0 ? ` (و${n(missing)} غير متاح)` : ''}
                </span>
              </button>
            );
          })}
        </div>
        {state && (
          <p role="status" className={`flex items-center gap-2 text-sm font-semibold ${state.finished && state.failed === state.total ? 'text-red-700 dark:text-red-400' : 'text-emerald-800 dark:text-emerald-300'}`}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
            {busy
              ? many
                ? `جارٍ تجهيز ${n(state.done + 1)} من ${n(state.total)}… (قد يسألك المتصفح عن السماح بتحميل عدة ملفات)`
                : 'جارٍ تجهيز الملف… قد يستغرق ذلك ثواني.'
              : state.failed === state.total
                ? 'خدمات التحميل لا تستجيب الآن. حمّله من savefrom بالزر بالأسفل، أو حاول بعد قليل.'
                : state.failed > 0
                  ? `بدأ تحميل ${n(state.total - state.failed)} ملف، وتعذّر ${n(state.failed)}.`
                  : 'بدأ التحميل.'}
          </p>
        )}
        {state?.finished && !!state.failedVideos?.length && (
          <div className="space-y-2">
            <p className="text-sm text-stone-600 dark:text-stone-400">يفتح صفحة savefrom والتحميل جاهز، اضغط «Download» هناك.</p>
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {state.failedVideos.map((v) => (
                <li key={v.id}>
                  <a href={savefromUrl(v.id)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-h-11 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm font-semibold hover:bg-gold-soft/40">
                    <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 truncate">{many ? v.name : 'حمّل من savefrom'}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
