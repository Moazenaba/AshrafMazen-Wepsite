// Every page except the home page is its own file, fetched when a visitor opens it.
import { lazy } from 'react';

export const CategoryView = lazy(() => import('../pages/CategoryView').then((m) => ({ default: m.CategoryView })));
export const SeriesView = lazy(() => import('../pages/SeriesView').then((m) => ({ default: m.SeriesView })));
export const LessonView = lazy(() => import('../pages/LessonView').then((m) => ({ default: m.LessonView })));
export const SearchPage = lazy(() => import('../pages/SearchPage').then((m) => ({ default: m.SearchPage })));
export const BookmarksPage = lazy(() => import('../pages/BookmarksPage').then((m) => ({ default: m.BookmarksPage })));
export const PlaylistView = lazy(() => import('../pages/PlaylistView').then((m) => ({ default: m.PlaylistView })));
export const LivePage = lazy(() => import('../pages/LivePage').then((m) => ({ default: m.LivePage })));
export const ReelsPage = lazy(() => import('../pages/ReelsPage').then((m) => ({ default: m.ReelsPage })));
export const VideoView = lazy(() => import('../pages/VideoView').then((m) => ({ default: m.VideoView })));
// Development only: the admin panels with made-up data (the condition is a constant in the build, so it is dropped)
export const AdminHarness = import.meta.env.DEV ? lazy(() => import('../dev/AdminHarness').then((m) => ({ default: m.AdminHarness }))) : null;
export const Contribute = lazy(() => import('../pages/Contribute').then((m) => ({ default: m.Contribute })));
export const VideosLibrary = lazy(() => import('../pages/VideosLibrary').then((m) => ({ default: m.VideosLibrary })));
export const AudioLibrary = lazy(() => import('../pages/AudioLibrary').then((m) => ({ default: m.AudioLibrary })));
export const BooksLibrary = lazy(() => import('../pages/BooksLibrary').then((m) => ({ default: m.BooksLibrary })));
export const BookView = lazy(() => import('../pages/BookView').then((m) => ({ default: m.BookView })));
export const QuranPage = lazy(() => import('../pages/QuranPage').then((m) => ({ default: m.QuranPage })));
export const QuranReciterPage = lazy(() => import('../pages/QuranReciterPage').then((m) => ({ default: m.QuranReciterPage })));

// The admin area is only for the site's managers; visitors never download it
export const AdminPage = lazy(() => import('../pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
export const QuranReader = lazy(() => import('../pages/quran/reader/QuranReader').then((m) => ({ default: m.QuranReader })));
