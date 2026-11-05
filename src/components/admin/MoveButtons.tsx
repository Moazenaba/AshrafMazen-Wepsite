import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

// Up and down arrows to change an item's place in a list; the name is read out by screen readers ("نقل «...» لأعلى")
export const MoveButtons: React.FC<{
  name: string;
  canUp: boolean;
  canDown: boolean;
  busy?: boolean;
  onMove: (step: -1 | 1) => void;
}> = ({ name, canUp, canDown, busy = false, onMove }) => {
  const style =
    'w-9 h-9 inline-flex items-center justify-center rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30 disabled:hover:bg-transparent';
  return (
    <span className="inline-flex items-center">
      <button type="button" className={style} disabled={!canUp || busy} onClick={() => onMove(-1)} aria-label={`نقل «${name}» لأعلى`} title="نقل لأعلى">
        <ArrowUp className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" className={style} disabled={!canDown || busy} onClick={() => onMove(1)} aria-label={`نقل «${name}» لأسفل`} title="نقل لأسفل">
        <ArrowDown className="w-4 h-4" aria-hidden="true" />
      </button>
    </span>
  );
};
