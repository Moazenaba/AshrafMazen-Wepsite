import React, { useState } from 'react';
import { useReducedMotion } from '../lib/useReducedMotion';
import { Pause, Play } from 'lucide-react';
import type { TickerQuote } from '../constants/tickerQuotes';

// Seconds the ticker takes per quote; a longer list moves slower so it stays easy to read
const SECONDS_PER_QUOTE = 9;

// A strip of sayings that moves all the time. It keeps moving while the page scrolls and
// while the pointer is over it; the button at its end stops and restarts it (WCAG 2.2.2).
// Visitors who asked for reduced motion get one quote, still.
export const QuoteTicker: React.FC<{ items: TickerQuote[] }> = ({ items }) => {
  const reduce = useReducedMotion();
  const [paused, setPaused] = useState(false);
  if (items.length === 0) return null;

  const renderItems = (hidden: boolean) =>
    items.map((quote, i) => (
      <li key={`${hidden ? 'copy' : 'main'}-${i}`} className="flex items-baseline gap-3">
        <span className="font-amiri text-base sm:text-xl">{quote.text}</span>
        <span className="text-sm text-gold-soft/80">({quote.source})</span>
      </li>
    ));

  return (
    <section aria-label="أقوال وأحاديث" className="flex items-stretch rounded-xl bg-mushaf text-gold-soft overflow-hidden border-b-2 border-gold">
      <span className="shrink-0 flex items-center px-2.5 py-2 sm:px-5 sm:py-3 text-xs sm:text-base bg-gold text-mushaf-deep font-bold">أقوال وأحاديث</span>

      {reduce ? (
        <p className="px-5 py-3">
          <span className="font-amiri text-base sm:text-xl">{items[0].text}</span> <span className="text-sm text-gold-soft/80">({items[0].source})</span>
        </p>
      ) : (
        <>
          <div dir="ltr" className="min-w-0 flex-1 overflow-hidden py-2 sm:py-3">
            {/* The track is laid out left to right, so the two copies sit side by side with no gap */}
            <div
              dir="ltr"
              className="flex w-max animate-ticker"
              style={{
                animationDuration: `${Math.max(20, items.length * SECONDS_PER_QUOTE)}s`,
                animationPlayState: paused ? 'paused' : 'running',
              }}
            >
              <ul dir="rtl" className="flex items-center gap-14 ps-14 whitespace-nowrap">{renderItems(false)}</ul>
              {/* A second copy, hidden from screen readers, lets the loop continue with no gap */}
              <ul dir="rtl" aria-hidden="true" className="flex items-center gap-14 ps-14 whitespace-nowrap">
                {renderItems(true)}
              </ul>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'تشغيل شريط الأقوال' : 'إيقاف شريط الأقوال'}
            title={paused ? 'تشغيل' : 'إيقاف'}
            className="shrink-0 w-11 flex items-center justify-center text-gold-soft hover:bg-mushaf-deep focus-visible:bg-mushaf-deep transition-colors"
          >
            {paused ? <Play className="w-4 h-4 fill-current" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
          </button>
        </>
      )}
    </section>
  );
};
