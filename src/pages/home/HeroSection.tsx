// Home page: The name and the hadith under it.
import React from 'react';

import type { HeroQuote } from '../../services/data/siteContentRules';

export const HeroSection = ({ displayName, todayLine, hero }: { displayName: string; todayLine: string; hero: HeroQuote }) => (
      <section aria-labelledby="hero-title" className="px-6 sm:px-8 pt-5 pb-5 sm:pt-20 sm:pb-12 text-center space-y-4 sm:space-y-5">
        <p className="text-xs sm:text-base text-stone-600 dark:text-stone-400 tabular-nums">{todayLine}</p>
        <h1 id="hero-title" className="font-name text-[2.5rem] sm:text-6xl lg:text-7xl leading-[1.25] sm:leading-[1.3] text-mushaf dark:text-gold-soft text-balance">
          {displayName.split(' ').map((word, i) => (
            <React.Fragment key={`${word}-${i}`}>
              {i > 0 && ' '}
              {/* Each word rises in turn (CSS, see .hero-word); reduced motion shows the name at once */}
              <span className="hero-word" style={{ animationDelay: `${0.08 * i}s` }}>
                {word}
              </span>
            </React.Fragment>
          ))}
        </h1>
        <p
          className="hero-fade mx-auto max-w-xs sm:max-w-none font-amiri text-xl sm:text-3xl leading-relaxed sm:leading-loose text-gold-deep dark:text-gold text-balance"
        >
          {/* On phones the attribution sits on its own line above the saying, so the saying never runs edge to edge */}
          {hero.intro && <span className="block sm:inline text-base sm:text-3xl text-stone-600 dark:text-stone-400 sm:text-gold-deep sm:dark:text-gold">{hero.intro}</span>}{' '}
          «{hero.text}»
          {hero.source && <span className="block mt-1 sm:mt-0 text-sm sm:text-base text-stone-600 dark:text-stone-400">{hero.source}</span>}
        </p>
      </section>
);
