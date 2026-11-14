import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';
import { useLiveStream } from '../hooks/useLiveStream';
import { isLiveShown } from '../services/data/liveStreamRules';
import { namedTitle, usePageMeta } from '../lib/pageMeta';

// The live broadcast: the YouTube live plays here (video only, no chat), Telegram opens outside
export const LivePage: React.FC = () => {
  const { view, loaded } = useLiveStream(true);
  const shown = isLiveShown(view);
  const id = view.youtubeId;
  const telegram = view.telegram;
  const title = view.title || 'البث المباشر';
  usePageMeta({ title: namedTitle(shown ? `بث مباشر: ${title}` : 'البث المباشر'), description: 'البث المباشر للشيخ أشرف مازن.' });

  if (!loaded) return <div className="min-h-[60vh]" aria-busy="true" />;

  if (!shown) {
    return (
      <div className="w-full max-w-3xl mx-auto px-5 py-20 space-y-4">
        <h1 className="font-ruqaa text-4xl text-stone-900 dark:text-stone-100">لا يوجد بث مباشر الآن</h1>
        <p className="text-stone-600 dark:text-stone-300">عند بدء البث سيظهر شريط «بث مباشر» أعلى الموقع. يمكنك في الأثناء متابعة الدروس المسجّلة.</p>
        <Link to="/" className="inline-flex items-center gap-2 min-h-11 font-semibold text-emerald-800 dark:text-emerald-300 hover:underline">
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-5">
      <h1 className="font-ruqaa text-3xl sm:text-4xl text-stone-900 dark:text-stone-100">{title}</h1>
      {id && (
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`}
            title={title}
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full border-0"
          />
        </div>
      )}
      {telegram && (
        <a
          href={telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          {id ? 'البث متاح أيضاً على تليجرام' : 'ادخل البث على تليجرام'}
        </a>
      )}
    </div>
  );
};
