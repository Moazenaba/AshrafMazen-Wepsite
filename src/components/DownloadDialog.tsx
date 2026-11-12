// "تحميل": asks whether to save the sound or the video, for one video or a whole playlist.
import React, { useEffect, useRef, useState } from 'react';
import { Download, Music, Video, X } from 'lucide-react';
import type { SiteVideo } from '../lib/libraryOverrides';
import { downloadAll, playlistFiles, type DownloadKind } from '../lib/mediaDownload';

const LABEL: Record<DownloadKind, string> = { audio: 'صوت فقط', video: 'فيديو' };

export const DownloadDialog: React.FC<{ title: string; videos: SiteVideo[]; onClose: () => void }> = ({ title, videos, onClose }) => {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
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
    const { items } = playlistFiles(videos, kind);
    setProgress({ done: 0, total: items.length });
    await downloadAll(items, (done) => setProgress({ done, total: items.length }), signal.current);
    if (!many) onClose();
  };

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
            const { items, missing } = playlistFiles(videos, kind);
            const Icon = kind === 'audio' ? Music : Video;
            return (
              <button
                key={kind}
                type="button"
                disabled={items.length === 0 || progress !== null}
                onClick={() => start(kind)}
                className="flex flex-col items-center gap-1 p-4 rounded-xl border-2 border-stone-200 dark:border-stone-700 hover:border-gold disabled:opacity-40 disabled:hover:border-stone-200 text-stone-900 dark:text-stone-100"
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="font-bold">{LABEL[kind]}</span>
                <span className="text-xs text-stone-600 dark:text-stone-400">
                  {items.length === 0 ? 'غير متاح' : many ? `${new Intl.NumberFormat('ar-EG').format(items.length)} ملف${missing ? ` (و${new Intl.NumberFormat('ar-EG').format(missing)} غير متاح)` : ''}` : 'متاح'}
                </span>
              </button>
            );
          })}
        </div>
        {progress && (
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            <Download className="w-4 h-4" aria-hidden="true" />
            {progress.done < progress.total
              ? `جارٍ التحميل ${new Intl.NumberFormat('ar-EG').format(progress.done)} من ${new Intl.NumberFormat('ar-EG').format(progress.total)}… (قد يسألك المتصفح عن السماح بتحميل عدة ملفات)`
              : 'بدأ التحميل.'}
          </p>
        )}
        {playlistFiles(videos, 'audio').items.length === 0 && playlistFiles(videos, 'video').items.length === 0 && (
          <p className="text-sm text-stone-600 dark:text-stone-400">لا توجد ملفات للتحميل بعد. المقاطع المعروضة من يوتيوب لا يمكن تحميلها إلا إذا رفع لها الموقع ملفاً.</p>
        )}
      </div>
    </div>
  );
};
