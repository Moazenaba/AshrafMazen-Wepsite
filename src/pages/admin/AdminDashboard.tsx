// The admin area: tabs for lessons, series, categories, requests, videos, books, branding and system.
// This file only puts the pieces together; behaviour is in ./dashboard/hooks, screens in ./dashboard and components/admin.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/dataService';
import { CategoryModal, SeriesModal, LessonModal, DeleteConfirmModal } from '../../components/admin/AdminModals';
import { BrandingManager } from '../../components/admin/BrandingManager';
import { BooksManager } from '../../components/admin/BooksManager';
import { StatsPanel } from '../../components/admin/StatsPanel';
import { SubmissionsManager } from '../../components/admin/SubmissionsManager';
import { YoutubeManager } from '../../components/admin/YoutubeManager';
import type { AdminUser, Category, Series } from '../../types';
import { AdminHeader } from './dashboard/AdminHeader';
import { CategoriesTab } from './dashboard/CategoriesTab';
import { ChangePasswordModal } from './dashboard/ChangePasswordModal';
import { DataErrorBanner } from './dashboard/DataErrorBanner';
import { LessonsTab } from './dashboard/LessonsTab';
import { SeriesTab } from './dashboard/SeriesTab';
import { SystemTab } from './dashboard/SystemTab';
import { useAdminData } from './dashboard/hooks/useAdminData';
import { useCategoryActions } from './dashboard/hooks/useCategoryActions';
import { useDeleteConfirm } from './dashboard/hooks/useDeleteConfirm';
import { useEditor } from './dashboard/hooks/useEditor';
import { useLessonActions } from './dashboard/hooks/useLessonActions';
import { useSeriesActions } from './dashboard/hooks/useSeriesActions';
import { useSubmissionsBadge } from './dashboard/hooks/useSubmissionsBadge';
import type { AdminTab } from './dashboard/types';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('lessons');
  const [booksCount, setBooksCount] = useState<number | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // What is shown, and the waiting-requests badge
  const { categories, seriesList, lessons, error, reload } = useAdminData();
  const requests = useSubmissionsBadge();

  // Add / edit windows and the delete confirmation
  const deleteConfirm = useDeleteConfirm();
  const categoryEditor = useEditor<Category>();
  const seriesEditor = useEditor<Series>();

  // What saving and deleting do for each kind of item
  const categoryActions = useCategoryActions({ editor: categoryEditor, series: seriesList, ask: deleteConfirm.ask, reload });
  const seriesActions = useSeriesActions({ editor: seriesEditor, lessons, ask: deleteConfirm.ask, reload });
  const lessonActions = useLessonActions({ ask: deleteConfirm.ask, reload, onRequestAccepted: requests.markHandled });

  const handleLogout = async () => {
    await logout();
    onLogout();
    navigate('/');
  };

  const published = lessons.filter((l) => l.status === 'published').length;
  const drafts = lessons.filter((l) => l.status === 'draft').length;
  const blockedReason = deleteConfirm.request?.blockedReason;

  return (
    <div className="min-h-screen bg-stone-100/50 dark:bg-stone-950/60 pb-20">
      {error && <DataErrorBanner message={error} onRetry={reload} />}

      <AdminHeader
        admin={admin}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        onChangePassword={() => setIsPasswordModalOpen(true)}
        counts={{
          categories: categories.length,
          series: seriesList.length,
          lessons: lessons.length,
          published,
          drafts,
          requests: requests.pending,
          books: booksCount,
        }}
      />

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'lessons' && (
          <LessonsTab
            lessons={lessons}
            seriesList={seriesList}
            onAdd={lessonActions.editor.openNew}
            onEdit={lessonActions.editor.openEdit}
            onDelete={lessonActions.requestDelete}
          />
        )}

        {activeTab === 'series' && (
          <SeriesTab
            seriesList={seriesList}
            categories={categories}
            lessons={lessons}
            onAdd={seriesEditor.openNew}
            onEdit={seriesEditor.openEdit}
            onDelete={seriesActions.requestDelete}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            seriesList={seriesList}
            onAdd={categoryEditor.openNew}
            onEdit={categoryEditor.openEdit}
            onDelete={categoryActions.requestDelete}
          />
        )}

        {activeTab === 'stats' && <StatsPanel lessons={lessons} />}

        {activeTab === 'requests' && <SubmissionsManager onCountChange={requests.setPending} onCreateLesson={lessonActions.openFromSubmission} refreshKey={requests.listVersion} />}

        {activeTab === 'videos' && <YoutubeManager />}

        {activeTab === 'books' && <BooksManager categories={categories} onCountChange={setBooksCount} />}

        {activeTab === 'branding' && <BrandingManager />}


        {activeTab === 'system' && <SystemTab onChangePassword={() => setIsPasswordModalOpen(true)} />}
      </div>

      <CategoryModal isOpen={categoryEditor.isOpen} onClose={categoryEditor.close} onSave={categoryActions.save} initialData={categoryEditor.editing} />
      <SeriesModal
        isOpen={seriesEditor.isOpen}
        onClose={seriesEditor.close}
        onSave={seriesActions.save}
        categories={categories}
        initialData={seriesEditor.editing}
      />
      <LessonModal
        isOpen={lessonActions.editor.isOpen}
        onClose={lessonActions.close}
        onSave={lessonActions.save}
        seriesList={seriesList}
        categories={categories}
        initialData={lessonActions.editor.editing}
        prefill={lessonActions.prefill}
        lessons={lessons}
      />
      <DeleteConfirmModal
        isOpen={!!deleteConfirm.request}
        title={deleteConfirm.request?.title ?? ''}
        message={blockedReason ?? deleteConfirm.request?.message ?? ''}
        blocked={!!blockedReason}
        onConfirm={deleteConfirm.request?.onConfirm ?? (async () => {})}
        onClose={deleteConfirm.close}
      />
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};
