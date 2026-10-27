import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TopUtilityBar } from './components/TopUtilityBar';
import { BrandBanner } from './components/BrandBanner';
import { Home } from './pages/Home';
import { CategoryView } from './pages/CategoryView';
import { SeriesView } from './pages/SeriesView';
import { LessonView } from './pages/LessonView';
import { SearchPage } from './pages/SearchPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { AdminPage } from './pages/admin/AdminPage';

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800 dark:bg-stone-950 dark:text-stone-100 transition-colors selection:bg-emerald-800 selection:text-emerald-100">
      {!isAdmin && (
        <>
          <TopUtilityBar />
          <BrandBanner />
        </>
      )}
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:slug" element={<CategoryView />} />
          <Route path="/series/:slug" element={<SeriesView />} />
          <Route path="/lesson/:id" element={<LessonView />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminPage />} />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ThemeProvider>
  );
}
