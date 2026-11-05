import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveSocialLinks, type SocialLink } from '../services/dataService';
import { SocialIcons } from './SocialIcons';

const CONTACT_EMAIL = 'info@sheikh-mazen.org';

// A short close: the name, where to go next, how to reach the sheikh, and the closing du'a.
export const Footer: React.FC = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    getActiveSocialLinks()
      .then((links) => setSocialLinks(links))
      .catch(() => {});
  }, []);

  const linkClass =
    'inline-flex items-center min-h-11 text-emerald-50 hover:text-amber-300 transition-colors';

  return (
    <footer className="relative overflow-hidden mt-10 sm:mt-20 bg-emerald-950 dark:bg-[#0a120e] text-sm">
      <div aria-hidden="true" className="pattern-stars absolute inset-0 opacity-[0.1]" />
      <div className="relative max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <p className="font-amiri text-3xl font-bold text-white">الشيخ أشرف مازن</p>
          <SocialIcons
            links={socialLinks}
            size="lg"
            itemClassName="bg-emerald-900 border-emerald-700 text-emerald-50 hover:text-white"
          />
        </div>

        <nav aria-label="روابط الموقع" className="flex flex-wrap gap-x-6">
          <Link to="/videos" className={linkClass}>
            المرئيات
          </Link>
          <Link to="/audio" className={linkClass}>
            الصوتيات
          </Link>
          <Link to="/books" className={linkClass}>
            المكتبة
          </Link>
          <Link to="/contribute" className={linkClass}>
            شارك
          </Link>
          <Link to={{ pathname: '/', hash: '#categories' }} className={linkClass}>
            الأقسام
          </Link>
          <Link to="/search" className={linkClass}>
            البحث
          </Link>
          <Link to="/bookmarks" className={linkClass}>
            المحفوظات
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass} dir="ltr">
            {CONTACT_EMAIL}
          </a>
        </nav>

        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-4 text-emerald-100/85">
          <p>© {new Intl.NumberFormat('ar-EG', { useGrouping: false }).format(new Date().getFullYear())} جميع المواد العلمية متاحة للنشر في سبيل الله.</p>
          <p className="text-amber-200">نسأل الله الإخلاص والقبول في القول والعمل</p>
        </div>
      </div>
    </footer>
  );
};
