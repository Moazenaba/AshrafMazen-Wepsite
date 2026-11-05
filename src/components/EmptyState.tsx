import React from 'react';
import { Link } from 'react-router-dom';

interface Action {
  to: string;
  label: string;
}

// A calm, finished-looking message for a page that has nothing to show yet, with where to go next
export const EmptyState: React.FC<{ title: string; text: string; actions?: Action[] }> = ({ title, text, actions = [] }) => (
  <section className="rounded-xl bg-white dark:bg-stone-800 px-5 py-8 sm:px-8 sm:py-12 text-center space-y-4">
    <h2 className="font-ruqaa text-3xl text-mushaf dark:text-gold-soft">{title}</h2>
    <p className="mx-auto max-w-[46ch] text-stone-700 dark:text-stone-300 leading-relaxed">{text}</p>
    {actions.length > 0 && (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-1">
        {actions.map((action, i) => (
          <Link
            key={action.to}
            to={action.to}
            className={`press inline-flex items-center justify-center min-h-12 px-6 rounded-lg font-bold ${
              i === 0
                ? 'bg-mushaf hover:bg-mushaf-deep text-gold-soft'
                : 'bg-stone-100 dark:bg-stone-900 hover:bg-gold-soft/40 dark:hover:bg-stone-700 text-mushaf dark:text-gold-soft'
            }`}
          >
            {action.label}
          </Link>
        ))}
      </div>
    )}
  </section>
);
