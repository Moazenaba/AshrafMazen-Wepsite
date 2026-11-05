// Home page: The featured lesson, the kinds of content, and the latest with its search.
import React from 'react';
import { LatestSearch, type LatestCategory, type LatestItem } from '../../components/LatestSearch';
import { ContentKinds } from './ContentKinds';
import { FeaturedCard } from './FeaturedCard';
import { type Placed } from './placeLessons';

export const FeaturedColumn = ({ placed, latestItems, categoryOptions }: { placed: Placed; latestItems: LatestItem[]; categoryOptions: LatestCategory[] }) => (
      <div className="min-w-0 space-y-5 sm:space-y-8 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
        {placed.featured && (
          <section aria-labelledby="featured-heading" className="space-y-4">
            <h2 id="featured-heading" className="sr-only">
              اخترنا لك
            </h2>
            <FeaturedCard lesson={placed.featured} />
          </section>
        )}

        <ContentKinds />

        <LatestSearch items={latestItems} categories={categoryOptions} className="lg:flex-1" />
      </div>
);
