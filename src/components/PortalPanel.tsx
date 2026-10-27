import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PortalPanelProps {
  title: string;
  icon?: React.ReactNode;
  headerBg?: string; // tailwind class, defaults to deep emerald
  actionLink?: string;
  actionText?: string;
  className?: string;
  children: React.ReactNode;
  footerLink?: string;
  footerText?: string;
}

export const PortalPanel: React.FC<PortalPanelProps> = ({
  title,
  icon,
  headerBg = 'bg-emerald-900 dark:bg-[#13281d]',
  actionLink,
  actionText = 'المزيد',
  className = '',
  children,
  footerLink,
  footerText = 'عرض المزيد من المواد',
}) => {
  return (
    <div
      className={`rounded-xl overflow-hidden border border-stone-200/90 dark:border-[#22302a] shadow-xs bg-white dark:bg-[#151f1a] transition-all flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Panel Solid Colored Header Bar with Gold Accent Line */}
        <div
          className={`${headerBg} relative px-4 py-3 sm:px-5 sm:py-3.5 border-b-2 border-amber-400 dark:border-amber-500 flex items-center justify-between text-white overflow-hidden`}
        >
          {/* Subtle Islamic Geometric Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none select-none bg-repeat"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '12px 12px',
            }}
          />

          <div className="relative z-10 flex items-center gap-2.5">
            {icon && <span className="text-amber-300 dark:text-amber-400 shrink-0">{icon}</span>}
            <h3 className="font-amiri text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-xs">
              {title}
            </h3>
          </div>

          {actionLink && (
            <Link
              to={actionLink}
              className="relative z-10 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-white transition-colors bg-black/15 hover:bg-black/25 px-2.5 py-1 rounded-md"
            >
              <span>{actionText}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Panel Body */}
        <div className="p-3.5 sm:p-4 text-stone-800 dark:text-[#e8efe9]">{children}</div>
      </div>

      {/* Optional Panel Footer */}
      {footerLink && (
        <div className="px-4 py-2.5 border-t border-stone-100 dark:border-[#22302a]/80 bg-stone-50/70 dark:bg-[#1a261f]/40 text-center">
          <Link
            to={footerLink}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:text-emerald-950 dark:hover:text-amber-200 transition-colors w-full py-1 rounded-md"
          >
            <span>{footerText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
