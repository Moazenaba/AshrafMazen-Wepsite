import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSiteSettings } from '../services/dataService';
import type { SiteSettings } from '../types';

export const BrandBanner: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    banner_prefix: 'الموقع الرسمي لفضيلة الشيخ',
    banner_name: 'أبو عبد الرحمن أشرف بن طه بن مازن',
    banner_logo_url: null,
  });

  useEffect(() => {
    let isMounted = true;
    getSiteSettings()
      .then((data) => {
        if (isMounted) {
          setSettings(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const { banner_prefix, banner_name, banner_logo_url } = settings;

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden bg-gradient-to-b from-[#fbf8f2] via-[#f7f3eb] to-[#f4ede0] dark:from-[#0d1612] dark:via-[#101b16] dark:to-[#0a120e] border-b border-amber-300/40 dark:border-[#22302a] transition-colors"
    >
      {/* Subtle Islamic Geometric Star Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05] pointer-events-none select-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l5 15 15-5-5 15 15 5-15 5 5 15-15-5-5 15-5-15-15 5 5-15-15-5 15-5-5-15 15 5z' fill='%230f5c43' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative Gold Vignette Glow */}
      <div className="absolute inset-0 bg-radial from-amber-400/[0.04] dark:from-amber-400/[0.03] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative z-10">
        <Link
          to="/"
          className="group block text-center focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-2xl transition-all"
        >
          {banner_logo_url ? (
            /* Uploaded Brand Logo */
            <div className="min-h-[75px] sm:min-h-[105px] flex items-center justify-center py-1">
              <img
                src={banner_logo_url}
                alt={banner_name || 'الشيخ أشرف مازن'}
                className="max-h-[85px] sm:max-h-[120px] w-auto max-w-full object-contain filter drop-shadow-sm group-hover:scale-[1.01] transition-transform duration-300"
              />
            </div>
          ) : (
            /* Calligraphic Typographic Lockup in Aref Ruqaa */
            <div className="min-h-[75px] sm:min-h-[105px] flex flex-col items-center justify-center py-1">
              {/* Prefix Subtitle */}
              {banner_prefix && (
                <div className="flex items-center justify-center gap-2 mb-1 sm:mb-1.5">
                  <span className="w-6 sm:w-12 h-px bg-gradient-to-r from-transparent to-amber-500/60 dark:to-amber-400/60" />
                  <span className="font-cairo text-xs sm:text-sm font-semibold tracking-wide text-amber-800 dark:text-amber-400">
                    {banner_prefix}
                  </span>
                  <span className="w-6 sm:w-12 h-px bg-gradient-to-l from-transparent to-amber-500/60 dark:to-amber-400/60" />
                </div>
              )}

              {/* Sheikh Full Name in Ruqaa Script */}
              <h1
                className="font-ruqaa font-bold text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors drop-shadow-xs leading-[1.3] select-none"
                style={{
                  fontSize: 'clamp(1.5rem, 4.2vw, 3.1rem)',
                }}
              >
                {banner_name || 'أبو عبد الرحمن أشرف بن طه بن مازن'}
              </h1>

              {/* Ornamental Divider with 8-pointed star */}
              <div className="flex items-center justify-center gap-2 mt-1 sm:mt-1.5 text-amber-500/80 dark:text-amber-400/80">
                <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-amber-400 to-amber-500" />
                <svg className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
                </svg>
                <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-amber-400 to-amber-500" />
              </div>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
};
