import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Play,
  Eye,
  Calendar,
  Video,
  Headphones,
  FileText,
} from 'lucide-react';
import type { LessonWithRelations } from '../services/dataService';
import { formatArabicDate, formatArabicViews, getCategoryColorTheme } from '../utils/helpers';

interface FeaturedCarouselProps {
  lessons: LessonWithRelations[];
  loading?: boolean;
}

export const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ lessons, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (loading || lessons.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % lessons.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [lessons.length, isPaused, loading]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % lessons.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + lessons.length) % lessons.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // RTL: swiping left (diff > 50) means next item
    if (diff > 50) {
      goToNext();
    } else if (diff < -50) {
      goToPrev();
    }
    touchStartX.current = null;
  };

  if (loading) {
    return (
      <div className="h-64 sm:h-72 rounded-2xl bg-stone-200 dark:bg-[#151f1a] animate-pulse border border-stone-200 dark:border-[#22302a]" />
    );
  }

  if (lessons.length === 0) {
    return null;
  }

  const currentLesson = lessons[currentIndex] || lessons[0];
  const catTheme = getCategoryColorTheme(currentLesson.category?.color);

  return (
    <section className="space-y-3">
      {/* Section Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="font-amiri text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span>اخترنا لك</span>
          </h2>
        </div>

        {/* Carousel Arrows */}
        {lessons.length > 1 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToPrev}
              aria-label="السابق"
              className="p-1.5 sm:p-2 rounded-lg bg-stone-100 dark:bg-[#1a261f] hover:bg-stone-200 dark:hover:bg-[#22302a] text-stone-700 dark:text-stone-300 transition-colors border border-stone-200 dark:border-[#22302a]"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="التالي"
              className="p-1.5 sm:p-2 rounded-lg bg-stone-100 dark:bg-[#1a261f] hover:bg-stone-200 dark:hover:bg-[#22302a] text-stone-700 dark:text-stone-300 transition-colors border border-stone-200 dark:border-[#22302a]"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Slide Card Container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-md transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`bg-gradient-to-l ${catTheme.headerGradient} text-white p-6 sm:p-8 lg:p-10 relative overflow-hidden flex flex-col justify-between min-h-[260px] sm:min-h-[290px] border-b-4 border-amber-400`}
        >
          {/* Subtle Islamic Geometric Star Background */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none select-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 1.5px, transparent 1.5px)`,
              backgroundSize: '16px 16px',
            }}
          />

          {/* Top Metadata Strip */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-semibold font-cairo">
                {currentLesson.category?.name || 'مادة مختارة'}
              </span>
              {currentLesson.series?.title && (
                <span className="text-white/80 font-medium">من: {currentLesson.series.title}</span>
              )}
            </div>

            <div className="flex items-center gap-3 text-white/80 font-cairo">
              {typeof currentLesson.views === 'number' && (
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-300" />
                  <span>{formatArabicViews(currentLesson.views)} مشاهدة</span>
                </span>
              )}
              {currentLesson.published_at && (
                <span className="hidden sm:inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatArabicDate(currentLesson.published_at)}</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Title & Teaser */}
          <div className="relative z-10 my-4 sm:my-6 space-y-2">
            <Link to={`/lesson/${currentLesson.id}`} className="block group">
              <h3 className="font-amiri text-2xl sm:text-3xl md:text-4xl font-bold text-white group-hover:text-amber-200 transition-colors leading-tight drop-shadow-sm">
                {currentLesson.title}
              </h3>
            </Link>
            {currentLesson.series?.description && (
              <p className="text-xs sm:text-sm text-white/80 line-clamp-2 max-w-3xl font-cairo leading-relaxed">
                {currentLesson.series.description}
              </p>
            )}
          </div>

          {/* Bottom Actions Bar */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
            {/* Media Formats Indicator */}
            <div className="flex items-center gap-2 text-xs">
              {currentLesson.youtube_url && (
                <span
                  title="تسجيل مرئي"
                  className="px-2.5 py-1 rounded-md bg-white/15 text-white flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5 text-amber-300" />
                  <span>مرئي</span>
                </span>
              )}
              {currentLesson.audio_url && (
                <span
                  title="تسجيل مسموع"
                  className="px-2.5 py-1 rounded-md bg-white/15 text-white flex items-center gap-1.5"
                >
                  <Headphones className="w-3.5 h-3.5 text-sky-300" />
                  <span>صوت</span>
                </span>
              )}
              {currentLesson.transcript && (
                <span
                  title="تفريغ مقروء"
                  className="px-2.5 py-1 rounded-md bg-white/15 text-white flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-300" />
                  <span>تفريغ</span>
                </span>
              )}
            </div>

            {/* Primary Watch/Listen CTA */}
            <Link
              to={`/lesson/${currentLesson.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-stone-950" />
              <span>شاهد واستمع الآن</span>
            </Link>
          </div>
        </div>

        {/* Carousel Navigation Dots */}
        {lessons.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {lessons.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`شريحة ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
