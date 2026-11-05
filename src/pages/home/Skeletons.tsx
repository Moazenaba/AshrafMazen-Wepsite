// Placeholders shown while the home data loads. Each takes the same space as what replaces it,
// so nothing below moves when the real content arrives (no layout shift).
import React from 'react';

const bar = 'block rounded bg-current opacity-15 motion-safe:animate-pulse';

// Same frame and grid as FeaturedCard
export const FeaturedCardSkeleton: React.FC = () => (
  <div aria-hidden="true" className="rounded-xl bg-mushaf text-white overflow-hidden border-b-4 border-gold">
    <div className="grid grid-cols-[84px_minmax(0,1fr)] min-[360px]:grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 p-4 sm:p-7 items-center">
      <div className="order-2 sm:order-none min-w-0 space-y-2 sm:space-y-4">
        <span className={`${bar} h-6 sm:h-8 w-11/12`} />
        <span className={`${bar} h-6 sm:h-8 w-2/3`} />
        <span className={`${bar} h-3 sm:h-4 w-1/2`} />
        <span className="block h-11 sm:h-12 w-40 rounded-lg bg-gold/40" />
      </div>
      <div className="order-1 sm:order-none">
        <span className="block aspect-video w-full rounded-xl bg-mushaf-deep/60" />
      </div>
    </div>
  </div>
);

// Same cards as the sciences grid
export const CategoryGridSkeleton: React.FC<{ cards: number }> = ({ cards }) => (
  <ul aria-hidden="true" className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 text-stone-500">
    {Array.from({ length: cards }, (_, i) => (
      <li key={i} className="h-[149px] sm:h-44 p-3 sm:p-5 rounded-lg bg-stone-50 dark:bg-stone-900 space-y-2">
        <span className={`${bar} h-5 sm:h-6 w-2/3`} />
        <span className={`${bar} h-3 sm:h-4 w-1/2`} />
      </li>
    ))}
  </ul>
);
