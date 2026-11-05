import React from 'react';

// A section heading in the manner of a mushaf's surah band: mushaf green, a gold rule beneath
export const bandHeading = 'px-4 py-2.5 sm:px-5 sm:py-3 bg-mushaf text-gold-soft font-ruqaa text-xl sm:text-2xl border-b-2 border-gold';

// A titled block on the page: the band, then its content
// `anchor` is the section's own id, for links such as /#categories from the top bar and the footer
export const Panel: React.FC<{ title: string; id: string; anchor?: string; className?: string; children: React.ReactNode }> = ({
  title,
  id,
  anchor,
  className = '',
  children,
}) => (
  <section data-reveal id={anchor} aria-labelledby={id} className={`rounded-xl bg-white dark:bg-stone-800 overflow-hidden ${className}`}>
    <h2 id={id} className={bandHeading}>
      {title}
    </h2>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);
