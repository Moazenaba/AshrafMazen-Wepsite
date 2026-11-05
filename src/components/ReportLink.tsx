import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flag } from 'lucide-react';

// "Report a mistake" under a lesson, video or book: opens the contribution form with this page's address filled in
export const ReportLink: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { pathname } = useLocation();
  const target = `${window.location.origin}${pathname}`;
  return (
    <Link
      to={`/contribute?type=correction&target=${encodeURIComponent(target)}`}
      className={`inline-flex items-center gap-2 min-h-11 text-sm text-stone-600 dark:text-stone-400 hover:text-mushaf dark:hover:text-gold ${className}`}
    >
      <Flag className="w-4 h-4" aria-hidden="true" />
      بلّغ عن خطأ في هذه الصفحة
    </Link>
  );
};
