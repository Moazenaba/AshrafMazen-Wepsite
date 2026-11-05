// The paragraph being read, estimated from playback, with a way into the full text.
import React from 'react';

export const ReadingNow: React.FC<{ paragraph: string; onOpenTranscript: () => void }> = ({ paragraph, onOpenTranscript }) => (
  <section aria-labelledby="reading-now-heading" className="card p-4 sm:p-6 space-y-2 sm:space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="reading-now-heading" className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        الفقرة الحالية من التفريغ <span className="font-normal text-stone-500 dark:text-stone-400">(تقريبية)</span>
      </h2>
      <button
        type="button"
        onClick={() => onOpenTranscript()}
        className="link-grow inline-flex items-center min-h-11 text-sm font-semibold text-emerald-800 dark:text-emerald-300"
      >
        اقرأ التفريغ كاملاً
      </button>
    </div>
    <p className="font-amiri text-lg leading-loose text-stone-900 dark:text-stone-100 line-clamp-3">
      {paragraph}
    </p>
  </section>
);
