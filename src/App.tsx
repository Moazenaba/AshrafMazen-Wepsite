import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { MiniPlayer, MINI_PLAYER_SPACE } from './components/MiniPlayer';
import { startPresence, trackPageView } from './services/analytics';
import { ErrorBoundary, reloadOnceForNewVersion } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';

// The home page ships with the site; every other page is its own file, fetched when a visitor opens it
const CategoryView = lazy(() => import('./pages/CategoryView').then((m) => ({ default: m.CategoryView })));
const SeriesView = lazy(() => import('./pages/SeriesView').then((m) => ({ default: m.SeriesView })));
const LessonView = lazy(() => import('./pages/LessonView').then((m) => ({ default: m.LessonView })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then((m) => ({ default: m.BookmarksPage })));
const PlaylistView = lazy(() => import('./pages/PlaylistView').then((m) => ({ default: m.PlaylistView })));
const VideoView = lazy(() => import('./pages/VideoView').then((m) => ({ default: m.VideoView })));
// Development only: the admin panels with made-up data (the condition is a constant in the build, so it is dropped)
const AdminHarness = import.meta.env.DEV ? lazy(() => import('./dev/AdminHarness').then((m) => ({ default: m.AdminHarness }))) : null;
const Contribute = lazy(() => import('./pages/Contribute').then((m) => ({ default: m.Contribute })));
const VideosLibrary = lazy(() => import('./pages/VideosLibrary').then((m) => ({ default: m.VideosLibrary })));
const AudioLibrary = lazy(() => import('./pages/AudioLibrary').then((m) => ({ default: m.AudioLibrary })));
const BooksLibrary = lazy(() => import('./pages/BooksLibrary').then((m) => ({ default: m.BooksLibrary })));
const BookView = lazy(() => import('./pages/BookView').then((m) => ({ default: m.BookView })));

// Scrolls to a "/#section" target once it has rendered (home sections load their data first),
// otherwise to the top of the new page.
// The admin area is only for the site's managers; visitors never download it
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));

function useScrollToHash() {
  // `key` changes on every navigation, so tapping a link to the section already in the URL scrolls again
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    const timers: number[] = [];
    let tries = 0;
    const finder = window.setInterval(() => {
      const target = document.getElementById(id);
      tries += 1;
      if (target) {
        window.clearInterval(finder);
        target.scrollIntoView({ block: 'start' });
        // Blocks above the target may still be loading and push it down; follow it while it settles,
        // unless the visitor has scrolled away in the meantime
        let settledAt = window.scrollY;
        [400, 1200].forEach((delay) =>
          timers.push(
            window.setTimeout(() => {
              if (Math.abs(window.scrollY - settledAt) > 4) return;
              target.scrollIntoView({ block: 'start' });
              settledAt = window.scrollY;
            }, delay)
          )
        );
      } else if (tries > 30) {
        window.clearInterval(finder);
      }
    }, 100);
    return () => {
      window.clearInterval(finder);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname, hash, key]);
}

// Scroll reveal: watches every [data-reveal] element (including ones rendered later)
// and marks it revealed as it enters the viewport. Nothing is hidden until this runs,
// and reduced-motion visitors never get the hidden state at all.
function useScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const observeAll = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)').forEach((el) => io.observe(el));
    };
    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('[data-reveal]')) io.observe(node);
            observeAll(node);
          }
        })
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, []);
}

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  // While a recording plays, the bar at the foot of the screen takes space the page leaves free for it
  const { track } = useAudio();
  const showPlayer = !!track && !isAdmin;
  useScrollToHash();
  useScrollReveal();

  // The site was updated while this tab was open: its old page files are gone, so load the new version once
  useEffect(() => {
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      reloadOnceForNewVersion();
    };
    window.addEventListener('vite:preloadError', onPreloadError);
    return () => window.removeEventListener('vite:preloadError', onPreloadError);
  }, []);

  // Anonymous statistics: who is here now, and one page view per page opened (never for the admin area)
  useEffect(() => {
    if (!isAdmin) startPresence();
  }, [isAdmin]);
  useEffect(() => {
    if (!isAdmin) trackPageView();
  }, [location.pathname, isAdmin]);

  return (
    <div
      className="min-h-dvh flex flex-col bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-100 transition-colors"
      style={showPlayer ? { paddingBottom: MINI_PLAYER_SPACE } : undefined}
    >
      {/* Keyboard users can jump past the top bar straight to the page */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 focus:inline-flex focus:items-center focus:h-11 focus:px-4 focus:rounded-lg focus:bg-mushaf focus:text-gold-soft focus:font-semibold"
      >
        تخطَّ إلى المحتوى
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} key={location.pathname} className="flex-1 page-enter focus:outline-none">
        {/* While a page's file arrives, the space it will fill stays reserved so the footer does not jump */}
        <ErrorBoundary key={location.pathname}>
        <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryView />} />
          <Route path="/series/:slug" element={<SeriesView />} />
          <Route path="/lesson/:id" element={<LessonView />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/playlist/:id" element={<PlaylistView />} />
          <Route path="/video/:videoId" element={<VideoView />} />
          <Route path="/contribute" element={<Contribute />} />
          {AdminHarness && <Route path="/dev/admin" element={<AdminHarness />} />}
          <Route path="/videos" element={<VideosLibrary />} />
          <Route path="/audio" element={<AudioLibrary />} />
          <Route path="/books" element={<BooksLibrary />} />
          <Route path="/book/:id" element={<BookView />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
                <AdminPage />
              </Suspense>
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      {!isAdmin && <Footer />}
      {showPlayer && <MiniPlayer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AudioProvider>
    </ThemeProvider>
  );
}
