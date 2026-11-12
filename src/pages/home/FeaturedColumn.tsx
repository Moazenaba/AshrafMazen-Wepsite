// Home page: The featured lesson, the kinds of content, and the latest with its search.
import React from 'react';
import { LatestSearch, type LatestCategory, type LatestItem } from '../../components/LatestSearch';
import { ContentKinds } from './ContentKinds';
import { FeaturedCard } from './FeaturedCard';
import { HomeFeatureCard } from './HomeFeatureCard';
import { isFeatureShown, type HomeFeature } from '../../services/data/homeFeatureRules';
import { FeaturedCardSkeleton } from './Skeletons';
import { type Placed } from './placeLessons';

// The admin's own featured card, when it is on, takes the place of the featured lesson
export const FeaturedColumn = ({ placed, latestItems, categoryOptions, loading, feature, featureLoading }: { placed: Placed; latestItems: LatestItem[]; categoryOptions: LatestCategory[]; loading: boolean; feature: HomeFeature; featureLoading: boolean }) => {
  const custom = isFeatureShown(feature);
  return (
      <div className="min-w-0 space-y-5 sm:space-y-8 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col">
        {(featureLoading || (loading && !custom)) && <FeaturedCardSkeleton />}
        {!featureLoading && custom && (
          <section aria-labelledby="featured-heading" className="space-y-4">
            <h2 id="featured-heading" className="sr-only">
              اخترنا لك
            </h2>
            <HomeFeatureCard feature={feature} />
          </section>
        )}
        {!featureLoading && !custom && placed.featured && (
          <section aria-labelledby="featured-heading" className="space-y-4">
            <h2 id="featured-heading" className="sr-only">
              اخترنا لك
            </h2>
            <FeaturedCard lesson={placed.featured} />
          </section>
        )}

        <ContentKinds />

        <LatestSearch items={latestItems} categories={categoryOptions} loading={loading} className="lg:flex-1" />
      </div>
);
};
