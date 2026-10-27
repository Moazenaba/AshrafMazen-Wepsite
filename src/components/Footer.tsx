import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowUp, Mail, MessageSquare, ExternalLink } from 'lucide-react';
import { getCategories, getActiveSocialLinks, type Category, type SocialLink } from '../services/dataService';
import { SocialIcons } from './SocialIcons';

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    getCategories().then((data) => {
      setCategories(data.slice(0, 6));
    }).catch(() => {});

    getActiveSocialLinks().then((links) => {
      setSocialLinks(links);
    }).catch(() => {});
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-20 bg-emerald-950 dark:bg-[#0a120e] text-emerald-100/90 border-t-2 border-amber-400 dark:border-amber-500/80 relative overflow-hidden">
      {/* Subtle Islamic Geometric Grid Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none select-none"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 1.5px, transparent 1.5px)`,
          backgroundSize: '16px 16px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 items-start">
          {/* Column 1: Identity & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center border border-amber-500/30 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-amiri text-2xl font-bold text-white tracking-wide">
                  الشيخ أشرف مازن
                </h3>
                <p className="text-[11px] text-emerald-300/80 font-medium">
                  الموقع العلمي والرسمي
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-emerald-200/80 leading-relaxed font-cairo">
              منصة علمية إسلامية تعنى بنشر الدروس، والشروحات التأصيلية، والمواعظ، والخطب وفق منهج أهل السنة والجماعة، مع توفير التسجيلات المرئية والمسموعة والتفريغات المقروءة لطلبة العلم وعموم المسلمين.
            </p>
            {socialLinks.length > 0 && (
              <div className="pt-2">
                <SocialIcons
                  links={socialLinks}
                  size="sm"
                  itemClassName="bg-emerald-900/80 border-emerald-700/60 text-emerald-200 hover:text-white"
                />
              </div>
            )}
          </div>

          {/* Column 2: Quick Links to Categories */}
          <div className="space-y-4 font-cairo text-sm">
            <h4 className="font-bold text-white flex items-center gap-2 border-b border-emerald-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>العلوم الشرعية والتصنيفات</span>
            </h4>
            <ul className="grid grid-cols-2 gap-2 text-xs">
              <li>
                <Link to="/" className="hover:text-amber-300 transition-colors block py-1">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-amber-300 transition-colors block py-1">
                  البحث في الدروس
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="hover:text-amber-300 transition-colors block py-1">
                  الدروس المحفوظة
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/category/${c.slug}`}
                    className="hover:text-amber-300 transition-colors block py-1 truncate"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact & Scholarly Communication Placeholder */}
          <div className="space-y-4 font-cairo text-sm">
            <h4 className="font-bold text-white flex items-center gap-2 border-b border-emerald-800/80 pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>التواصل والاستفسارات العلمية</span>
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-200/80 leading-relaxed">
              <p>
                للتواصل العلمي، وطرح الأسئلة الفقهية، أو الإبلاغ عن ملاحظة في تفريغات الدروس والتسجيلات:
              </p>
              <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono text-xs">info@sheikh-mazen.org</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-100">
                  <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>بوابة المراسلات العلمية والمراجعات</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-emerald-700/80 hover:border-amber-400 text-emerald-200 hover:text-amber-300 transition-all bg-emerald-900/40"
              >
                <span>العودة للأعلى</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Duaa Line */}
        <div className="mt-12 pt-6 border-t border-emerald-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-3 font-cairo">
          <p>© {new Date().getFullYear()} الموقع العلمي للشيخ أشرف مازن - جميع المواد العلمية متاحة للنشر في سبيل الله.</p>
          <p className="flex items-center gap-1.5 text-amber-300/80">
            <span>نسأل الله الإخلاص والقبول في القول والعمل</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

