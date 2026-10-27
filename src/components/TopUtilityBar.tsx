import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { getActiveSocialLinks } from '../services/dataService';
import { SocialIcons } from './SocialIcons';
import type { SocialLink } from '../types';

export const TopUtilityBar: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    // Format Arabic dates: Hijri (Umalqura) & Gregorian using Latin digits for consistency
    const formatCurrentDate = () => {
      const now = new Date();
      try {
        const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const hijriPart = hijriFormatter.format(now);

        const gregorianFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        const gregorianPart = gregorianFormatter.format(now);

        return `${hijriPart} - ${gregorianPart}`;
      } catch (err) {
        return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(now);
      }
    };

    setFormattedDate(formatCurrentDate());

    // Fetch active social links for the bar
    let isMounted = true;
    getActiveSocialLinks()
      .then((links) => {
        if (isMounted) setSocialLinks(links);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="bg-stone-100/90 dark:bg-[#0b130f]/95 border-b border-stone-200/80 dark:border-[#22302a] text-stone-600 dark:text-[#9fb0a6] text-[11px] sm:text-xs font-cairo transition-colors relative z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3 min-h-[36px]">
        {/* Right side (RTL Start): Current Hijri & Gregorian date */}
        <div className="flex items-center gap-1.5 min-w-0 font-medium">
          <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate" title={formattedDate}>
            {formattedDate || 'جاري تحميل التاريخ...'}
          </span>
        </div>

        {/* Left side (RTL End): Social links row */}
        <div className="shrink-0 flex items-center">
          <SocialIcons links={socialLinks} size="sm" />
        </div>
      </div>
    </div>
  );
};
