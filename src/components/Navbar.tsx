import React, { useCallback, useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Search, LogIn } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenuSheet } from './nav/MobileMenuSheet';
import { FloatingMenuButton } from './nav/FloatingMenuButton';
import { useBookmarks } from '../services/bookmarkService';
import { supabase } from '../lib/supabase';
import { checkCurrentAdmin, getSiteSettings, DEFAULT_SITE_SETTINGS } from '../services/dataService';
import type { SiteSettings } from '../types';

// One header for the public site: the sheikh's name as the wordmark, a few plain links, search and theme.
// The admin area is reached by its URL; a "لوحة التحكم" link appears only for a signed-in admin.
export const Navbar: React.FC = () => {
  const { count: bookmarkCount } = useBookmarks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    getSiteSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch(() => {});

    checkCurrentAdmin().then((admin) => {
      if (isMounted) setIsAdmin(!!admin);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const admin = await checkCurrentAdmin();
        if (isMounted) setIsAdmin(!!admin);
      } else if (isMounted) {
        setIsAdmin(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Close the mobile menu on every navigation, including a tap on the link to the page already shown
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.hash, location.key]);
  const closeMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  // A soft shadow appears once the page scrolls under the sticky header /* taste-skill-ignore: the sticky bar is the one surface allowed a shadow */
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const bookmarksLabel = bookmarkCount > 0 ? `المحفوظات (${bookmarkCount})` : 'المحفوظات';

  // The three kinds of content first (watch, listen, read), then the subjects and what the visitor saved
  const navLinks = [
    { label: 'الرئيسية', to: '/' },
    { label: 'المرئيات', to: '/videos' },
    { label: 'الصوتيات', to: '/audio' },
    { label: 'المكتبة', to: '/books' },
    { label: 'الأقسام', to: { pathname: '/', hash: '#categories' } },
    { label: bookmarksLabel, to: '/bookmarks' },
    ...(isAdmin ? [{ label: 'لوحة التحكم', to: '/admin' }] : []),
  ];

  const linkClass = (active: boolean) =>
    `whitespace-nowrap inline-flex items-center h-11 px-3 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? 'text-emerald-800 dark:text-emerald-300'
        : 'text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-300'
    }`;

  const { banner_name, banner_logo_url } = settings;

  return (
    <header
      className={`sticky top-0 z-40 bg-stone-50/95 dark:bg-stone-950/95 transition-shadow duration-300 ${
        isScrolled ? 'shadow-[0_1px_0_var(--border-subtle),0_8px_24px_-12px_rgb(60_40_10_/_0.18)]' : '' /* taste-skill-ignore: sticky bar, shown only once the page scrolls under it */
      }`}
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16 sm:h-[72px]">
          {/* Wordmark: uploaded logo, or the sheikh's name in Ruqaa */}
          <Link to="/" className="min-w-0 shrink rounded-lg min-h-11 flex items-center" aria-label="الصفحة الرئيسية">
            {banner_logo_url ? (
              <img
                src={banner_logo_url}
                alt={banner_name || 'الشيخ أشرف مازن'}
                className="h-10 sm:h-12 w-auto max-w-full object-contain"
              />
            ) : (
              // One line on every width: the size follows the screen, and a very narrow phone ends it with an ellipsis
              <span
                className="block truncate font-ruqaa font-bold leading-snug text-emerald-950 dark:text-emerald-100"
                style={{ fontSize: 'clamp(0.9375rem, 0.2rem + 3.9vw, 1.75rem)' }}
              >
                {banner_name || 'الشيخ أشرف مازن'}
              </span>
            )}
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="القائمة الرئيسية">
            {navLinks.map((item) =>
              typeof item.to === 'string' ? (
                <NavLink key={item.label} to={item.to} end={item.to === '/'} className={({ isActive }) => linkClass(isActive)}>
                  <span className="link-grow pb-0.5">{item.label}</span>
                </NavLink>
              ) : (
                <Link key={item.label} to={item.to} className={linkClass(false)}>
                  <span className="link-grow pb-0.5">{item.label}</span>
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              to="/search"
              aria-label="البحث في الموقع"
              title="البحث في الموقع"
              className="w-11 h-11 flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            <span className="hidden lg:inline-flex">
              <ThemeToggle size="lg" />
            </span>

            <Link
              to="/admin"
              aria-label="دخول الإدارة"
              title="دخول الإدارة"
              className="w-11 h-11 hidden sm:flex items-center justify-center rounded-lg text-stone-600 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors"
            >
              <LogIn className="w-5 h-5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((open) => !open)}
              className="w-11 h-11 flex items-center justify-center lg:hidden rounded-lg text-stone-700 dark:text-stone-200"
              aria-label={isMobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Phones: one menu, opened by the top bar's button or the floating one (hidden in the admin, which has its own) */}
      <MobileMenuSheet open={isMobileMenuOpen} onClose={closeMenu} isAdmin={isAdmin} bookmarkCount={bookmarkCount} />
      {!location.pathname.startsWith('/admin') && <FloatingMenuButton open={isMobileMenuOpen} onOpen={() => setIsMobileMenuOpen(true)} />}
    </header>
  );
};
