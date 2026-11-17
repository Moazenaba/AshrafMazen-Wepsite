import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { DEFAULT_BUTTON_LABEL, featureImage, featureTarget, hasFeatureVideo, type HomeFeature } from '../../services/data/homeFeatureRules';
import { fileSrc } from '../../lib/fileLinks';
import { FeatureAudio } from './FeatureAudio';

// The featured card the admin sets: a still picture, and a button that opens the lesson the admin chose
const Go: React.FC<{ feature: HomeFeature; className: string; label?: string; children: React.ReactNode }> = ({ feature, className, label, children }) => {
  const target = featureTarget(feature);
  return target.kind === 'internal' ? (
    <Link to={target.href} className={className} aria-label={label}>
      {children}
    </Link>
  ) : (
    <a href={target.href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label}>
      {children}
    </a>
  );
};

export const HomeFeatureCard: React.FC<{ feature: HomeFeature }> = ({ feature }) => (
  <article className="rounded-xl bg-mushaf text-white overflow-hidden border-b-4 border-gold">
    {feature.audioUrl && <FeatureAudio url={feature.audioUrl} />}
    <div className="grid grid-cols-[84px_minmax(0,1fr)] min-[360px]:grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 p-4 sm:p-7 items-center">
      <div className="order-2 sm:order-none min-w-0 space-y-2 sm:space-y-4">
        {feature.title && <h3 className="font-sans text-base min-[360px]:text-lg sm:text-3xl font-bold leading-snug text-balance line-clamp-3 sm:line-clamp-none">{feature.title}</h3>}
        {feature.subtitle && <p className="-mt-1 sm:-mt-2 text-xs sm:text-sm text-gold-soft">{feature.subtitle}</p>}
        {hasFeatureVideo(feature) && <Go
          feature={feature}
          className="press inline-flex items-center whitespace-nowrap gap-1.5 min-[360px]:gap-2 h-11 sm:h-12 px-2.5 min-[360px]:px-4 sm:px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep text-[13px] min-[360px]:text-sm sm:text-base font-bold"
        >
          <Play className="w-4 h-4 fill-current" aria-hidden="true" />
          {feature.buttonLabel || DEFAULT_BUTTON_LABEL}
        </Go>}
      </div>
      <div className="order-1 sm:order-none">
        {/* Always a still picture: nothing to open, no play sign. Only the button leads to the lesson */}
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-mushaf-deep">
          <img src={fileSrc(featureImage(feature))} alt={feature.title || ''} fetchPriority="high" className="absolute inset-0 w-full h-full object-cover" />
        </span>
      </div>
    </div>
  </article>
);
