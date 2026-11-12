// The site menu on phones: a sheet rising from the bottom with a tile for every part of the site. Opened by the
// floating button (FloatingMenuButton) or the top bar's menu button; closes on a choice, the ✕, Escape, or a tap outside.
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, type To } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Clapperboard,
  Headphones,
  Home,
  LayoutDashboard,
  LayoutGrid,
  ListVideo,
  LogIn,
  Mic,
  MonitorPlay,
  Send,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { JUMUAH_LABEL, JUMUAH_PLAYLIST_ID } from '../../pages/home/sermons';
import { useYoutubeLibrary } from '../../lib/youtubeLibrary';

interface Tile {
  label: string;
  to: To;
  icon: LucideIcon;
}

export const MobileMenuSheet: React.FC<{ open: boolean; onClose: () => void; isAdmin: boolean; bookmarkCount: number }> = ({ open, onClose, isAdmin, bookmarkCount }) => {
  const { pathname } = useLocation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const library = useYoutubeLibrary();

  // What the visitor comes for first (watch, listen, the sermons, every lesson), then the rest of the site
  const tiles: Tile[] = [
    { label: 'الرئيسية', to: '/', icon: Home },
    { label: 'المرئيات', to: '/videos', icon: MonitorPlay },
    { label: 'الصوتيات', to: '/audio', icon: Headphones },
    { label: JUMUAH_LABEL, to: `/playlist/${JUMUAH_PLAYLIST_ID}`, icon: Mic },
    { label: 'كل الدروس', to: '/search', icon: ListVideo },
    { label: 'الريلز', to: '/reels', icon: Clapperboard },
    { label: 'المكتبة', to: '/books', icon: BookOpen },
    { label: 'الأقسام', to: { pathname: '/', hash: '#categories' }, icon: LayoutGrid },
    { label: bookmarkCount > 0 ? `المحفوظات (${bookmarkCount})` : 'المحفوظات', to: '/bookmarks', icon: Bookmark },
    { label: 'اقترح مادة', to: '/contribute', icon: Send },
    isAdmin ? { label: 'لوحة التحكم', to: '/admin', icon: LayoutDashboard } : { label: 'دخول الإدارة', to: '/admin', icon: LogIn },
  ];

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // The page behind stays still while the menu is open
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[60] flex items-end bg-black/60" onClick={onClose}>
      <nav
        role="dialog"
        aria-modal="true"
        aria-label="قائمة الموقع"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-stone-50 dark:bg-stone-900 border-t-4 border-gold shadow-2xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sheet-rise"
      >
        <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ruqaa text-2xl text-mushaf dark:text-gold-soft">القائمة</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="إغلاق القائمة" className="press w-11 h-11 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <ul className="grid grid-cols-3 gap-2.5">
          {tiles.map(({ label, to, icon: Icon }) => {
            const path = typeof to === 'string' ? to : to.pathname;
            const active = !(typeof to === 'object' && to.hash) && (path === '/' ? pathname === '/' : !!path && pathname.startsWith(path));
            return (
              <li key={label}>
                <Link
                  to={to}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`press flex flex-col items-center justify-center gap-2 h-24 px-1 rounded-2xl text-center text-sm font-bold leading-tight transition-colors ${
                    active
                      ? 'bg-mushaf text-gold-soft ring-2 ring-gold'
                      : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? 'bg-white/10' : 'bg-mushaf/10 dark:bg-gold/10 text-mushaf dark:text-gold-soft'}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {library.length > 0 && (
          <section aria-labelledby="sheet-all-lists" className="mt-5 space-y-2">
            <h3 id="sheet-all-lists" className="font-ruqaa text-xl text-mushaf dark:text-gold-soft">كل القوائم والدروس</h3>
            <ul className="divide-y divide-stone-200 dark:divide-stone-700 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 overflow-hidden">
              {library.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/playlist/${p.id}`}
                    onClick={onClose}
                    className="flex min-h-14 items-center justify-between gap-3 px-4 py-2 text-sm font-semibold text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-700"
                  >
                    <span className="min-w-0 truncate">{p.title}</span>
                    <span className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">{p.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-4 flex items-center justify-between min-h-12 px-4 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
          <span className="text-base font-semibold text-stone-800 dark:text-stone-100">المظهر</span>
          <ThemeToggle size="lg" />
        </div>
      </nav>
    </div>,
    document.body
  );
};
