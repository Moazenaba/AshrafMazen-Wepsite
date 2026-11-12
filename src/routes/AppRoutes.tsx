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
  ReelsPage,
  AdminHarness,
  Contribute,
  VideosLibrary,
  AudioLibrary,
  BooksLibrary,
  BookView,
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
      <Route path="/reels" element={<ReelsPage />} />
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
);
