import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, Search, User, LogIn, ShieldCheck, Bookmark } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useBookmarks } from '../services/bookmarkService';
import { supabase } from '../lib/supabase';
import { checkCurrentAdmin } from '../services/dataService';

export const Navbar: React.FC = () => {
  const { count: bookmarkCount } = useBookmarks();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    // Check if current user is an authenticated admin in the database
    checkCurrentAdmin().then((admin) => {
      if (isMounted) {
        setIsAdmin(!!admin);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const admin = await checkCurrentAdmin();
        if (isMounted) setIsAdmin(!!admin);
      } else {
        if (isMounted) setIsAdmin(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const navLinks = [
    { label: 'الرئيسية', path: '/' },
    { label: 'العلوم الشرعية', path: '/#categories' },
    { label: 'أحدث الدروس', path: '/#latest' },
    { label: 'البحث', path: '/search' },
  ];

  const isActive = (path: string) => {
    if (path.startsWith('/#')) return false;
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-200/80 dark:border-stone-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Sheikh Branding */}
          <Link
            to="/"
            className="group flex items-center gap-3.5 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-800 dark:bg-emerald-700 text-amber-300 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-amber-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-amiri text-2xl font-bold tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-800 dark:group-hover:text-amber-300 transition-colors">
                الشيخ أشرف مازن
              </span>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                الموقع العلمي والرسمي
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
            {navLinks.map((item) => {
              if (item.path.startsWith('/#')) {
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className="px-3.5 py-2 text-sm font-semibold rounded-xl text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-xl transition-all ${
                    isActive(item.path)
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'text-stone-700 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons: Search, Bookmarks, Dark Mode, Admin Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/search"
              aria-label="بحث في الدروس"
              title="البحث في الدروس"
              className="p-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Bookmarks Link */}
            <Link
              to="/bookmarks"
              aria-label="الدروس المحفوظة"
              title="الدروس المحفوظة"
              className={`relative p-2.5 rounded-xl transition-colors ${
                location.pathname === '/bookmarks'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-800 dark:hover:text-amber-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/60'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarkCount > 0 ? 'fill-amber-400 text-amber-500 dark:text-amber-400' : ''}`} />
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-stone-950 font-mono text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {bookmarkCount > 9 ? '+9' : bookmarkCount}
                </span>
              )}
            </Link>

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Admin / Control Panel Action Button */}
            <Link
              to="/admin"
              rel="nofollow"
              aria-label={isAdmin ? 'لوحة التحكم' : 'إدارة الموقع'}
              title={isAdmin ? 'لوحة التحكم' : 'إدارة الموقع'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 dark:border-amber-400/25 text-xs sm:text-sm font-semibold transition-all shadow-xs focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
            >
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <LogIn className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className="whitespace-nowrap">{isAdmin ? 'لوحة التحكم' : 'إدارة الموقع'}</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden rounded-xl text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 focus:outline-none"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((item) => {
            if (item.path.startsWith('/#')) {
              return (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2.5 text-base font-semibold rounded-xl text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                >
                  {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 text-base font-semibold rounded-xl ${
                  isActive(item.path)
                    ? 'bg-emerald-800 text-white'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            to="/bookmarks"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center justify-between px-4 py-2.5 text-base font-semibold rounded-xl ${
              location.pathname === '/bookmarks'
                ? 'bg-emerald-800 text-white'
                : 'text-stone-700 dark:text-stone-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>الدروس المحفوظة</span>
            </span>
            {bookmarkCount > 0 && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500 text-stone-950">
                {bookmarkCount}
              </span>
            )}
          </Link>

          <Link
            to="/admin"
            rel="nofollow"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-base font-semibold rounded-xl text-amber-700 dark:text-amber-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-t border-stone-100 dark:border-stone-800/80 pt-3 mt-1"
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isAdmin ? 'لوحة التحكم' : 'إدارة الموقع'}</span>
          </Link>
        </div>
      )}
    </header>
  );
};
