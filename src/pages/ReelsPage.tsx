// The reels: the sheikh's short clips (YouTube Shorts), in the order the admin chose, played inside the site.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useReels } from '../lib/reels';

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const ReelsPage: React.FC = () => {
  const { reels, loaded } = useReels();
  const [open, setOpen] = useState<number | null>(null);
  const current = open !== null ? reels[open] : null;

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      // Right to left: the left arrow goes forward
      if (e.key === 'ArrowLeft') setOpen((i) => (i !== null && i < reels.length - 1 ? i + 1 : i));
      if (e.key === 'ArrowRight') setOpen((i) => (i !== null && i > 0 ? i - 1 : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, reels.length]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      <nav aria-label="مسار التصفح" className="flex flex-wrap items-center gap-1 text-sm text-stone-600 dark:text-stone-400">
        <Link to="/" className="inline-flex items-center min-h-11 hover:text-emerald-800 dark:hover:text-emerald-300">
          الرئيسية
        </Link>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span className="text-stone-800 dark:text-stone-200">الريلز</span>
      </nav>

      <header className="space-y-2">
        <h1 className="font-ruqaa text-3xl sm:text-5xl text-stone-900 dark:text-stone-50">الريلز</h1>
        <p className="text-stone-600 dark:text-stone-400">مقاطع قصيرة من دروس الشيخ وخطبه.</p>
      </header>

      {!loaded ? (
        <div className="min-h-[40vh]" aria-busy="true" />
      ) : reels.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">لا توجد مقاطع قصيرة بعد.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
          {reels.map((reel, i) => (
            <li key={reel.id}>
              <button type="button" onClick={() => setOpen(i)} className="group block w-full text-start space-y-2">
                <span className="relative block aspect-[9/16] overflow-hidden rounded-xl bg-stone-200 dark:bg-stone-800">
                  <img src={thumb(reel.id)} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center justify-center w-12 h-12 rounded-full bg-gold/90 text-mushaf-deep">
                      <Play className="w-5 h-5 fill-current ms-0.5" />
                    </span>
                  </span>
                </span>
                <span className="block text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100 line-clamp-2">{reel.title || 'مقطع قصير'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {current && open !== null && (
        <div role="dialog" aria-modal="true" aria-label={current.title || 'مقطع قصير'} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3" onClick={() => setOpen(null)}>
          <div className="relative flex items-center gap-2 sm:gap-4" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="السابق" disabled={open === 0} onClick={() => setOpen(open - 1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
              <ChevronRight className="w-6 h-6" aria-hidden="true" />
            </button>
            <div className="w-[min(88vw,calc(86vh*9/16))] aspect-[9/16] rounded-xl overflow-hidden bg-black">
              <iframe
                key={current.id}
                src={`https://www.youtube-nocookie.com/embed/${current.id}?autoplay=1&playsinline=1&rel=0`}
                title={current.title || 'مقطع قصير'}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <button type="button" aria-label="التالي" disabled={open === reels.length - 1} onClick={() => setOpen(open + 1)} className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
              <ChevronLeft className="w-6 h-6" aria-hidden="true" />
            </button>
            <button type="button" aria-label="إغلاق" onClick={() => setOpen(null)} className="absolute -top-2 end-14 sm:-top-3 w-11 h-11 flex items-center justify-center rounded-full bg-white/15 text-white">
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
