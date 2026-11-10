// The shell of the site: theme, audio, the top bar, the page area, the footer and the mini player.
import React from 'react';
import { Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AudioProvider, useAudio } from './context/AudioContext';
import { MiniPlayer, MINI_PLAYER_SPACE } from './components/MiniPlayer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { useScrollToHash } from './hooks/useScrollToHash';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useVersionReload } from './hooks/useVersionReload';
import { usePageAnalytics } from './hooks/usePageAnalytics';
import { useCanonical } from './hooks/useCanonical';
import { AppRoutes } from './routes/AppRoutes';

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  // While a recording plays, the bar at the foot of the screen takes space the page leaves free for it
  const { track } = useAudio();
  const showPlayer = !!track && !isAdmin;
  useScrollToHash();
  useScrollReveal();

  useVersionReload();

  usePageAnalytics(location.pathname, isAdmin);
  useCanonical(location.pathname, isAdmin);

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
        <AppRoutes />
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
