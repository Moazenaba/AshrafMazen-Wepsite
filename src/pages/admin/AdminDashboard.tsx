import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, AlertTriangle } from 'lucide-react';
import { getCategories, getAllSeries, getAllLessonsAdmin, createCategory, updateCategory, deleteCategory, createSeries, updateSeries, deleteSeries, createLesson, updateLesson, deleteLesson, reviewSubmission, logout, getPendingSubmissionsCount, type Submission } from '../../services/dataService';
import { getYouTubeId } from '../../lib/youtube';
import { CategoryModal, SeriesModal, LessonModal, DeleteConfirmModal } from '../../components/admin/AdminModals';
import { BrandingManager } from '../../components/admin/BrandingManager';
import { BooksManager } from '../../components/admin/BooksManager';
import { StatsPanel } from '../../components/admin/StatsPanel';
import { SubmissionsManager } from '../../components/admin/SubmissionsManager';
import { YoutubeManager } from '../../components/admin/YoutubeManager';
import { SystemStatus } from '../../components/admin/SystemStatus';
import { type Category, type Series, type Lesson, type AdminUser, type LessonStatus, type LessonChapter } from '../../types';
import { AdminHeader } from './dashboard/AdminHeader';
import { LessonsTab } from './dashboard/LessonsTab';
import { SeriesTab } from './dashboard/SeriesTab';
import { CategoriesTab } from './dashboard/CategoriesTab';
import { ChangePasswordModal } from './dashboard/ChangePasswordModal';
import { type LessonAdminItem, type AdminTab } from './dashboard/types';

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('lessons');
  const [booksCount, setBooksCount] = useState<number | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number | null>(null);
  useEffect(() => {
    getPendingSubmissionsCount().then(setPendingRequests).catch(() => {});
  }, []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [lessons, setLessons] = useState<LessonAdminItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  // A lesson started from a visitor's suggestion: its values, and the request to accept once it is saved
  const [lessonPrefill, setLessonPrefill] = useState<Partial<Lesson> | null>(null);
  const [fromSubmission, setFromSubmission] = useState<string | null>(null);
  const [submissionsRefresh, setSubmissionsRefresh] = useState(0);

  const openLessonFromSubmission = (item: Submission) => {
    const isYoutube = !!getYouTubeId(item.url);
    setEditingLesson(null);
    setLessonPrefill({
      title: item.title,
      youtube_url: item.kind === 'video' || isYoutube ? item.url : '',
      audio_url: item.kind === 'audio' && !isYoutube ? item.url : '',
      transcript: '',
      status: 'draft',
    });
    setFromSubmission(item.id);
    setIsLessonModalOpen(true);
  };

  const closeLessonModal = () => {
    setIsLessonModalOpen(false);
    setLessonPrefill(null);
    setFromSubmission(null);
  };

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    blocked?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  const [dbError, setDbError] = useState<string | null>(null);

  // Change-password window (its own fields live in dashboard/ChangePasswordModal.tsx)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setDbError(null);
      const [cats, series, allLessons] = await Promise.all([
        getCategories(),
        getAllSeries(),
        getAllLessonsAdmin(),
      ]);
      setCategories(cats);
      setSeriesList(series);
      setLessons(allLessons);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setDbError(err?.message || 'تعذّر تحميل البيانات من قاعدة البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleLogout = async () => {
    await logout();
    onLogout();
    navigate('/');
  };

  // Category Actions
  const handleSaveCategory = async (data: {
    name: string;
    slug: string;
    sort_order: number;
    color: string;
    icon?: string;
  }) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, data);
      } else {
        await createCategory(data);
      }
      await loadAllData();
    } catch (err: any) {
      console.error('handleSaveCategory error:', err);
      throw err;
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    const hasSeries = seriesList.some((s) => s.category_id === cat.id);
    setDeleteModal({
      isOpen: true,
      title: `حذف قسم "${cat.name}"`,
      message: hasSeries
        ? 'لا يمكن حذف هذا القسم لأنه يحتوي على سلاسل علمية. احذف السلاسل أو انقلها إلى قسم آخر أولاً.'
        : 'هل أنت متأكد من رغبتك في حذف هذا القسم؟ لن يمكن استرجاعه.',
      blocked: hasSeries,
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          await loadAllData();
        } catch (err: any) {
          console.error('handleDeleteCategory error:', err);
          throw err;
        }
      },
    });
  };

  // Series Actions
  const handleSaveSeries = async (data: {
    category_id: string;
    title: string;
    slug: string;
    description: string;
    sort_order: number;
  }) => {
    try {
      if (editingSeries) {
        await updateSeries(editingSeries.id, data);
      } else {
        await createSeries(data);
      }
      await loadAllData();
    } catch (err: any) {
      console.error('handleSaveSeries error:', err);
      throw err;
    }
  };

  const handleDeleteSeries = (series: Series) => {
    const hasLessons = lessons.some((l) => l.series_id === series.id);
    setDeleteModal({
      isOpen: true,
      title: `حذف سلسلة "${series.title}"`,
      message: hasLessons
        ? 'لا يمكن حذف هذه السلسلة لأنها تحتوي على دروس. احذف الدروس أو انقلها إلى سلسلة أخرى أولاً.'
        : 'هل أنت متأكد من رغبتك في حذف هذه السلسلة العلمية؟',
      blocked: hasLessons,
      onConfirm: async () => {
        try {
          await deleteSeries(series.id);
          await loadAllData();
        } catch (err: any) {
          console.error('handleDeleteSeries error:', err);
          throw err;
        }
      },
    });
  };

  // Lesson Actions
  const handleSaveLesson = async (data: {
    series_id: string;
    lesson_number: number;
    title: string;
    youtube_url: string;
    audio_url: string;
    transcript: string;
    chapters: LessonChapter[];
    featured: boolean;
    status: LessonStatus;
  }) => {
    try {
      if (editingLesson) {
        await updateLesson(editingLesson.id, data);
      } else {
        await createLesson(data);
        if (fromSubmission) {
          await reviewSubmission(fromSubmission, 'approved', 'أُنشئ منه درس');
          setSubmissionsRefresh((n) => n + 1);
          getPendingSubmissionsCount().then(setPendingRequests).catch(() => {});
        }
      }
      await loadAllData();
    } catch (err: any) {
      console.error('handleSaveLesson error:', err);
      throw err;
    }
  };

  const handleDeleteLesson = (lesson: Lesson) => {
    setDeleteModal({
      isOpen: true,
      title: `حذف درس "${lesson.title}"`,
      blocked: false,
      message: 'هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟',
      onConfirm: async () => {
        try {
          await deleteLesson(lesson.id);
          await loadAllData();
        } catch (err: any) {
          console.error('handleDeleteLesson error:', err);
          throw err;
        }
      },
    });
  };

  // Calculate statistics
  const totalPublished = lessons.filter((l) => l.status === 'published').length;
  const totalDrafts = lessons.filter((l) => l.status === 'draft').length;

  return (
    <div className="min-h-screen bg-stone-100/50 dark:bg-stone-950/60 pb-20">
      {/* Missing DB Setup / Error Banner */}
      {dbError && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full w-full">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>تعذّر تحميل بيانات اللوحة:</strong> {dbError}
            </span>
          </div>
          <button
            type="button"
            onClick={() => loadAllData()}
            className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

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
          published: totalPublished,
          drafts: totalDrafts,
          requests: pendingRequests,
          books: booksCount,
        }}
      />

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'lessons' && (
          <LessonsTab
            lessons={lessons}
            seriesList={seriesList}
            onAdd={() => {
              setEditingLesson(null);
              setIsLessonModalOpen(true);
            }}
            onEdit={(lesson) => {
              setEditingLesson(lesson);
              setIsLessonModalOpen(true);
            }}
            onDelete={handleDeleteLesson}
          />
        )}

        {activeTab === 'series' && (
          <SeriesTab
            seriesList={seriesList}
            categories={categories}
            lessons={lessons}
            onAdd={() => {
              setEditingSeries(null);
              setIsSeriesModalOpen(true);
            }}
            onEdit={(series) => {
              setEditingSeries(series);
              setIsSeriesModalOpen(true);
            }}
            onDelete={handleDeleteSeries}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            seriesList={seriesList}
            onAdd={() => {
              setEditingCategory(null);
              setIsCategoryModalOpen(true);
            }}
            onEdit={(category) => {
              setEditingCategory(category);
              setIsCategoryModalOpen(true);
            }}
            onDelete={handleDeleteCategory}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB 4: BRANDING & SOCIAL MEDIA LINKS */}
        {/* ========================================================================= */}
        {activeTab === 'stats' && <StatsPanel lessons={lessons} />}

        {activeTab === 'requests' && <SubmissionsManager onCountChange={setPendingRequests} onCreateLesson={openLessonFromSubmission} refreshKey={submissionsRefresh} />}

        {activeTab === 'videos' && <YoutubeManager />}

        {activeTab === 'books' && <BooksManager categories={categories} onCountChange={setBooksCount} />}

        {activeTab === 'branding' && <BrandingManager />}

        {/* ========================================================================= */}
        {/* TAB 5: SYSTEM & ARCHITECTURE */}
        {/* ========================================================================= */}
        {activeTab === 'system' && (
          <div className="max-w-3xl space-y-6">
            <SystemStatus />

            <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-700 dark:text-amber-400" />
                <span>أمان الحساب وكلمة المرور</span>
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-cairo">
                يتم إدارة وتشفير كلمات المرور عبر خدمة <strong>Supabase Auth</strong> بصورة آمنة ومحمية، ويمكنك تحديث كلمة المرور الخاصة بحساب الإدارة مباشرة من هنا:
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>تغيير كلمة مرور مدير الموقع</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSave={handleSaveCategory}
        initialData={editingCategory}
      />

      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onSave={handleSaveSeries}
        categories={categories}
        initialData={editingSeries}
      />

      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={closeLessonModal}
        onSave={handleSaveLesson}
        seriesList={seriesList}
        categories={categories}
        initialData={editingLesson}
        prefill={lessonPrefill}
        lessons={lessons}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        message={deleteModal.message}
        onConfirm={deleteModal.onConfirm}
        blocked={deleteModal.blocked}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
    </div>
  );
};
