// Every route of the site.
import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from '../pages/Home';
import {
  CategoryView,
  SeriesView,
  LessonView,
  SearchPage,
  BookmarksPage,
  PlaylistView,
  VideoView,
  LivePage,
  ReelsPage,
  AdminHarness,
  Contribute,
  VideosLibrary,
  AudioLibrary,
  BooksLibrary,
  BookView,
  QuranPage,
  QuranReciterPage,
  QuranReader,
  AdminPage,
} from './lazyPages';

export const AppRoutes: React.FC = () => (
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
      <Route path="/live" element={<LivePage />} />
      <Route path="/reels" element={<ReelsPage />} />
      <Route path="/contribute" element={<Contribute />} />
      {AdminHarness && <Route path="/dev/admin" element={<AdminHarness />} />}
      <Route path="/videos" element={<VideosLibrary />} />
      <Route path="/audio" element={<AudioLibrary />} />
      <Route path="/books" element={<BooksLibrary />} />
      <Route path="/book/:id" element={<BookView />} />

      <Route path="/quran" element={<QuranPage />} />
      <Route path="/quran/reciter/:id" element={<QuranReciterPage />} />
      <Route path="/quran/read/:reciterId/:moshafId/:surah" element={<QuranReader />} />

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
);
