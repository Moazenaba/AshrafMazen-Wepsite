import React from 'react';
import { Minus, Pause, Play, Plus, Repeat, SkipBack, SkipForward } from 'lucide-react';

export const SPEEDS = [0.75, 1, 1.25, 1.5];
export const MIN_FONT = 22;
export const MAX_FONT = 44;
export const FONT_STEP = 4;

interface Props {
  playing: boolean;
  rate: number;
  loop: boolean;
  fontSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRate: (rate: number) => void;
  onLoop: () => void;
  onFont: (size: number) => void;
}

const button = 'min-w-11 min-h-11 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 inline-flex items-center justify-center gap-1.5 font-semibold disabled:opacity-40';

// Play and pause, the previous and next surah, the speed, repeating the ayah, and the size of the text
export const ReaderControls: React.FC<Props> = (p) => (
  <div role="toolbar" aria-label="أدوات القراءة" className="flex flex-wrap items-center justify-center gap-2">
    <button type="button" onClick={p.onPrevious} disabled={!p.hasPrevious} className={button} aria-label="السورة السابقة">
      <SkipForward className="w-4 h-4" aria-hidden="true" />
    </button>
    <button type="button" onClick={p.onToggle} className={`${button} bg-emerald-800 text-white border-emerald-800`} aria-label={p.playing ? 'إيقاف مؤقت' : 'تشغيل'}>
      {p.playing ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
    </button>
    <button type="button" onClick={p.onNext} disabled={!p.hasNext} className={button} aria-label="السورة التالية">
      <SkipBack className="w-4 h-4" aria-hidden="true" />
    </button>
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-200">
      <span>السرعة</span>
      <select value={p.rate} onChange={(e) => p.onRate(Number(e.target.value))} className="min-h-11 px-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800">
        {SPEEDS.map((r) => (
          <option key={r} value={r}>
            {r}×
          </option>
        ))}
      </select>
    </label>
    <button type="button" onClick={p.onLoop} aria-pressed={p.loop} className={`${button} ${p.loop ? 'bg-amber-100 dark:bg-amber-950 border-amber-500' : ''}`}>
      <Repeat className="w-4 h-4" aria-hidden="true" />
      تكرار الآية
    </button>
    <div className="inline-flex items-center gap-1" role="group" aria-label="حجم الخط">
      <button type="button" onClick={() => p.onFont(p.fontSize - FONT_STEP)} disabled={p.fontSize <= MIN_FONT} className={button} aria-label="تصغير الخط">
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => p.onFont(p.fontSize + FONT_STEP)} disabled={p.fontSize >= MAX_FONT} className={button} aria-label="تكبير الخط">
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  </div>
);
