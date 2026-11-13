// Home page: About the sheikh, at the foot of the page.
import React from 'react';
import { bandHeading } from './Panel';

export const AboutSection = ({ aboutText }: { aboutText: string }) => (
  <>
        {aboutText && (
          <section data-reveal aria-labelledby="about-heading" className="defer-render rounded-xl bg-white dark:bg-stone-800 overflow-hidden">
            <h2 id="about-heading" className={`${bandHeading} text-center`}>
              عن الشيخ
            </h2>
            <div className="px-6 py-8 sm:px-12 sm:py-10">
              <p className="max-w-3xl mx-auto font-amiri text-xl sm:text-2xl leading-[2.1] text-justify text-stone-800 dark:text-stone-200">
                {aboutText}
              </p>
            </div>
          </section>
        )}
  </>
);
