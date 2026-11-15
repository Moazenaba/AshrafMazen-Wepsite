// The written transcript: font size, copy, and the paragraph being read highlighted.
import React from 'react';
import { Copy, Check } from 'lucide-react';
import { actionButton } from './styles';
import { MIN_FONT_SIZE, MAX_FONT_SIZE, type TranscriptFont } from './useTranscriptFont';
import { type TranscriptReading } from './useTranscriptReading';
import { type Share } from './useShare';

export const TranscriptPanel: React.FC<{ reading: TranscriptReading; font: TranscriptFont; share: Share }> = ({ reading, font, share }) => {
  const { paragraphs, activeParagraph } = reading;
  return (
      <div className="card px-4 py-5 sm:px-10 sm:py-10 space-y-5 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1" role="group" aria-label="حجم الخط">
            <button
              type="button"
              onClick={() => font.change(font.size - 2)}
              disabled={font.size <= MIN_FONT_SIZE}
              className="press w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold disabled:opacity-40"
            >
              <span aria-hidden="true">أ−</span>
              <span className="sr-only">تصغير الخط</span>
            </button>
            <button
              type="button"
              onClick={() => font.change(font.size + 2)}
              disabled={font.size >= MAX_FONT_SIZE}
              className="press w-11 h-11 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-lg disabled:opacity-40"
            >
              <span aria-hidden="true">أ+</span>
              <span className="sr-only">تكبير الخط</span>
            </button>
          </div>
          <button type="button" onClick={share.copyTranscript} className={actionButton}>
            {share.isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span aria-live="polite">{share.isCopied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>
        </div>

        <div
          className="max-w-[65ch] mx-auto font-amiri text-stone-900 dark:text-stone-100 leading-[2] space-y-4"
          style={{ fontSize: `${font.size}px` }}
        >
          {paragraphs.map((paragraph, i) => (
            <p
              key={i}
              id={`para-${i}`}
              className={`whitespace-pre-wrap rounded-lg transition-colors ${
                i === activeParagraph ? '-mx-3 px-3 py-2 bg-amber-100/70 dark:bg-amber-400/15' : ''
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
  );
};
