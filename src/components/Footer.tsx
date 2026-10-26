import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-24 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-100/60 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center border border-amber-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                الشيخ أشرف مازن
              </h3>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-cairo">
              منصة علمية إسلامية تعنى بنشر الدروس، والشروحات التأصيلية، والمواعظ، والخطب وفق منهج أهل السنة والجماعة.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 font-cairo text-sm">
            <h4 className="font-bold text-stone-800 dark:text-stone-200">روابط سريعة</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">
                  البحث في مكتبة الدروس
                </Link>
              </li>
              <li>
                <Link to="/bookmarks" className="hover:text-emerald-700 dark:hover:text-amber-300 transition-colors">
                  الدروس المحفوظة
                </Link>
              </li>
            </ul>
          </div>

          {/* Scholarly Notice & Scroll to top */}
          <div className="space-y-3 font-cairo text-sm flex flex-col justify-between h-full">
            <div>
              <h4 className="font-bold text-stone-800 dark:text-stone-200 mb-1.5">نشر العلم النافع</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                جميع المواد والدروس العلمية متاحة للنشر والاستفادة منها في سبيل الله، مع حفظ الأمانة العلمية ونسبة الأقوال إلى أصحابها.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 hover:border-emerald-700 hover:text-emerald-800 dark:hover:text-amber-300 transition-all"
              >
                <span>العودة للأعلى</span>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-stone-200 dark:border-stone-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 dark:text-stone-400 gap-3 font-cairo">
          <p>© {new Date().getFullYear()} الموقع العلمي للشيخ أشرف مازن - جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1.5">
            <span>نسأل الله الإخلاص والقبول في القول والعمل</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
