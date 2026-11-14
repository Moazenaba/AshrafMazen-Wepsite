// "Live now" strip under the top bar of every public page while the admin has the broadcast switched on.
import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Send } from 'lucide-react';
import { useLiveStream } from '../hooks/useLiveStream';
import { isLiveShown } from '../services/data/liveStreamRules';

const button =
  'inline-flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-lg bg-white text-red-800 hover:bg-red-50 font-bold text-sm transition-colors';

export const LiveBanner: React.FC = () => {
  const { view } = useLiveStream();
  if (!isLiveShown(view)) return null;
  const hasVideo = !!view.youtubeId;
  const telegram = view.telegram;

  return (
    <div role="region" aria-label="بث مباشر" className="bg-red-700 text-white px-4 sm:px-6 lg:px-8 py-1.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-2 font-bold text-sm sm:text-base min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="truncate">بث مباشر الآن{view.title ? `: ${view.title}` : ''}</span>
        </p>
        <div className="flex items-center gap-2">
          {hasVideo && (
            <Link to="/live" className={button}>
              <Radio className="w-4 h-4" aria-hidden="true" />
              شاهد البث
            </Link>
          )}
          {telegram && (
            <a href={telegram} target="_blank" rel="noopener noreferrer" className={button}>
              <Send className="w-4 h-4" aria-hidden="true" />
              {hasVideo ? 'تليجرام' : 'ادخل البث على تليجرام'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
