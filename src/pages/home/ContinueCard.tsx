import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { formatAudioTime } from '../../utils/helpers';

// Where "continue watching" goes: a lesson, or a playlist video stored with the "yt:" prefix
// The continue-watching block: its own band, the title, how far the visitor got, and one clear action
export const ContinueCard: React.FC<{
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

export const continueHref = (id: string) => (id.startsWith('yt:') ? `/video/${id.slice(3)}` : `/lesson/${id}`);
