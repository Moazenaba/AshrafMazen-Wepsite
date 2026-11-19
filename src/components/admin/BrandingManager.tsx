import React from 'react';
import { BannerSettings } from './branding/BannerSettings';
import { NameFontSettings } from './branding/NameFontSettings';
import { SocialLinks } from './branding/SocialLinks';
import { ContactSettings } from './branding/ContactSettings';
import { HomeFeatureSettings } from './branding/HomeFeatureSettings';
import { SideMenuSettings } from './branding/SideMenuSettings';
import { LiveStreamSettings } from './branding/LiveStreamSettings';
import { WelcomeSoundSettings } from './branding/WelcomeSoundSettings';

// The admin's "شكل الموقع والتواصل" tab. A row of links at the top jumps to each part, so nothing has to be scrolled for.
const SECTIONS: { id: string; label: string; element: React.ReactNode }[] = [
  { id: 'sec-live', label: 'البث المباشر', element: <LiveStreamSettings /> },
  { id: 'sec-name', label: 'الاسم والشعار', element: <BannerSettings /> },
  { id: 'sec-font', label: 'خط الاسم', element: <NameFontSettings /> },
  { id: 'sec-card', label: 'البطاقة الكبيرة (صورة وصوت)',element: <HomeFeatureSettings /> },
  { id: 'sec-menu', label: 'القائمة الجانبية', element: <SideMenuSettings /> },
  { id: 'sec-welcome', label: 'صوت الترحيب', element: <WelcomeSoundSettings /> },
  { id: 'sec-contact', label: 'بيانات التواصل', element: <ContactSettings /> },
  { id: 'sec-social', label: 'روابط التواصل الاجتماعي', element: <SocialLinks /> },
];

export const BrandingManager: React.FC = () => (
  <div className="space-y-5 font-cairo">
    <nav aria-label="أجزاء هذه الصفحة" className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-stone-100/90 dark:bg-stone-950/90 backdrop-blur-sm flex flex-wrap gap-2">
      {SECTIONS.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(section.id)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
          }}
          className="inline-flex items-center min-h-11 px-4 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-sm font-semibold text-stone-800 dark:text-stone-200 hover:border-emerald-700"
        >
          {section.label}
        </a>
      ))}
    </nav>
    {SECTIONS.map((section) => (
      <div key={section.id} id={section.id} className="scroll-mt-16">
        {section.element}
      </div>
    ))}
  </div>
);
