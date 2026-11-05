import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  LogOut,
  Layers,
  BookOpen,
  FileText,
  Video,
  Headphones,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  AlertTriangle,
  Lock,
  X
} from 'lucide-react';
import {
  getCategories,
  getAllSeries,
  getAllLessonsAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  createSeries,
  updateSeries,
  deleteSeries,
  createLesson,
  updateLesson,
  deleteLesson,
  updateUserPassword,
  reviewSubmission,
  logout,
  type Submission,
} from '../../services/dataService';
import { getYouTubeId } from '../../lib/youtube';
import { formatArabicDate, getArabicLessonOrdinal, getCategoryColorTheme } from '../../utils/helpers';
import { CategoryModal, SeriesModal, LessonModal, DeleteConfirmModal } from '../../components/admin/AdminModals';
import { BrandingManager } from '../../components/admin/BrandingManager';
import { BooksManager } from '../../components/admin/BooksManager';
import { StatsPanel } from '../../components/admin/StatsPanel';
import { SubmissionsManager } from '../../components/admin/SubmissionsManager';
import { YoutubeManager } from '../../components/admin/YoutubeManager';
import { SystemStatus } from '../../components/admin/SystemStatus';
import { getPendingSubmissionsCount } from '../../services/dataService';
import { ThemeToggle } from '../../components/ThemeToggle';
import type { Category, Series, Lesson, AdminUser, LessonStatus, LessonChapter } from '../../types';

interface LessonAdminItem extends Lesson {
  series?: Series | null;
  category?: Category | null;
}

interface AdminDashboardProps {
  admin: AdminUser;
  onLogout: () => void;
}

type AdminTab = 'stats' | 'requests' | 'videos' | 'lessons' | 'series' | 'categories' | 'books' | 'branding' | 'system';

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

  // Lesson filters
  const [seriesFilter, setSeriesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Password Modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

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

  // Password Change Handler
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 10) {
      setPasswordError('كلمة المرور يجب ألا تقل عن 10 خانات');
      return;
    }
    const hasLetter = /[a-zA-Z\u0621-\u064A]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setPasswordError('كلمة المرور يجب أن تتضمن أحرفاً وأرقاماً');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      setPasswordSubmitting(true);
      await updateUserPassword(newPassword);
      setPasswordSuccess('تم تحديث كلمة المرور بنجاح');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: any) {
      console.error('Password update failed:', err);
      setPasswordError(err.message || 'تعذر تحديث كلمة المرور');
    } finally {
      setPasswordSubmitting(false);
    }
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

  // Filtered lessons
  const filteredLessons = lessons.filter((l) => {
    if (seriesFilter !== 'all' && l.series_id !== seriesFilter) return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchSeries = l.series?.title.toLowerCase().includes(q);
      if (!matchTitle && !matchSeries) return false;
    }
    return true;
  });

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

      {/* Top Admin Header */}
      <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                  لوحة إدارة موقع الشيخ أشرف مازن
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/40">
                  مدير الموقع
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                مرحباً بك، {admin.name} ({admin.email})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setNewPassword('');
                setConfirmPassword('');
                setIsPasswordModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-emerald-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>تغيير كلمة المرور</span>
            </button>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-emerald-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>معاينة الموقع كزائر</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">الأقسام الشرعية</span>
            <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{categories.length}</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">السلاسل العلمية</span>
            <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{seriesList.length}</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">الدروس المنشورة</span>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{totalPublished}</span>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
            <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">المسودات (غير المنشورة)</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{totalDrafts}</span>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="w-full px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'stats'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            الإحصائيات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'requests'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            الطلبات{pendingRequests ? ` (${pendingRequests})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('videos')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'videos'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            فيديوهات القناة
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'lessons'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            إدارة الدروس ({lessons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('series')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'series'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            إدارة السلاسل ({seriesList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'categories'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            إدارة الأقسام ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('books')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'books'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            المكتبة{booksCount !== null ? ` (${booksCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'branding'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            إدارة الواجهة والتواصل
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'system'
                ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            البيانات والتكامل
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================================= */}
        {/* TAB 1: LESSONS MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'lessons' && (
          <div className="space-y-6">
            {/* Action Bar & Filters */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Series filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500">السلسلة:</span>
                  <select
                    value={seriesFilter}
                    onChange={(e) => setSeriesFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200"
                  >
                    <option value="all">كل السلاسل ({lessons.length})</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500">الحالة:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold text-stone-800 dark:text-stone-200"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="published">المنشور فقط ({totalPublished})</option>
                    <option value="draft">المسودات فقط ({totalDrafts})</option>
                  </select>
                </div>

                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في عنوان الدرس..."
                    className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-200"
                  />
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingLesson(null);
                  setIsLessonModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة درس جديد</span>
              </button>
            </div>

            {/* Lessons Table */}
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                    <tr>
                      <th className="py-3 px-4 font-bold">الرقم</th>
                      <th className="py-3 px-4 font-bold">عنوان الدرس</th>
                      <th className="py-3 px-4 font-bold">السلسلة والقسم</th>
                      <th className="py-3 px-4 font-bold">الوسائط</th>
                      <th className="py-3 px-4 font-bold">الحالة</th>
                      <th className="py-3 px-4 font-bold">تاريخ النشر</th>
                      <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                    {filteredLessons.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-14 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                            <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                            <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                              {lessons.length === 0
                                ? 'لا توجد دروس مضافة بعد.'
                                : 'لا توجد دروس مطابقة للمعايير المحددة.'}
                            </p>
                            <p className="text-xs text-stone-400">
                              {lessons.length === 0 && 'ابدأ بإضافة أول درس علمي مرئي أو صوتي أو تفريغ مكتوب.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLesson(null);
                                setIsLessonModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                            >
                              <Plus className="w-4 h-4" />
                              <span>إضافة درس جديد</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredLessons.map((lesson) => (
                        <tr
                          key={lesson.id}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-700 dark:text-stone-300">
                            #{lesson.lesson_number}
                          </td>
                          <td className="py-3.5 px-4 font-amiri text-base font-bold text-stone-900 dark:text-stone-100">
                            {lesson.title}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="block font-semibold text-stone-900 dark:text-stone-100">
                              {lesson.series?.title || 'غير محدد'}
                            </span>
                            {lesson.category && (() => {
                              const catTheme = getCategoryColorTheme(lesson.category.color);
                              return (
                                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${catTheme.dot}`} />
                                  <span>{lesson.category.name}</span>
                                </span>
                              );
                            })()}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              {lesson.youtube_url ? (
                                <span title="يوجد فيديو" className="p-1 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                                  <Video className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-stone-300 dark:text-stone-700">—</span>
                              )}
                              {lesson.audio_url ? (
                                <span title="يوجد صوت" className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                                  <Headphones className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-stone-300 dark:text-stone-700">—</span>
                              )}
                              {lesson.transcript ? (
                                <span title="يوجد تفريغ" className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                                  <FileText className="w-3.5 h-3.5" />
                                </span>
                              ) : (
                                <span className="text-stone-300 dark:text-stone-700">—</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {lesson.status === 'published' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>منشور</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                <span>مسودة</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-stone-500 font-cairo">
                            {lesson.published_at ? formatArabicDate(lesson.published_at) : '—'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {(
                                <Link
                                  to={`/lesson/${lesson.id}`}
                                  target="_blank"
                                  title={lesson.status === 'published' ? 'معاينة في الموقع' : 'معاينة المسودة (لا يراها الزوار)'}
                                  className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLesson(lesson);
                                  setIsLessonModalOpen(true);
                                }}
                                title="تعديل الدرس"
                                className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson)}
                                title="حذف الدرس"
                                className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SERIES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'series' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                  السلاسل والشروحات العلمية
                </h3>
                <p className="text-xs text-stone-500">
                  تنظيم السلاسل العلمية وربطها بالأقسام الشرعية
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSeries(null);
                  setIsSeriesModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سلسلة جديدة</span>
              </button>
            </div>

            {seriesList.length === 0 ? (
              <div className="p-14 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
                <Layers className="w-12 h-12 text-stone-300 dark:text-stone-700 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-amiri text-xl font-bold text-stone-800 dark:text-stone-200">
                    لا توجد سلاسل علمية مضافة بعد.
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                    ابدأ بإنشاء أول سلسلة علمية واربطها بأحد الأقسام الشرعية كالعقيدة أو الفقه.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSeries(null);
                    setIsSeriesModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة سلسلة جديدة</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {seriesList.map((series) => {
                  const cat = categories.find((c) => c.id === series.category_id);
                  const catTheme = getCategoryColorTheme(cat?.color);
                  const seriesLessonCount = lessons.filter((l) => l.series_id === series.id).length;

                  return (
                    <div
                      key={series.id}
                      className={`p-6 ${catTheme.cardBg} rounded-2xl border ${catTheme.cardBorder} shadow-xs flex flex-col justify-between space-y-4 transition-all`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                            {cat?.name || 'قسم غير محدد'}
                          </span>
                          <span className="text-xs text-stone-500 font-mono">
                            {seriesLessonCount} دروس
                          </span>
                        </div>

                        <h4 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                          {series.title}
                        </h4>

                        {series.description && (
                          <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {series.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <Link
                          to={`/series/${series.slug}`}
                          target="_blank"
                          className="text-emerald-800 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>معاينة صفحة السلسلة</span>
                        </Link>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSeries(series);
                              setIsSeriesModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                            title="تعديل السلسلة"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSeries(series)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                            title="حذف السلسلة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
                  الأقسام الشرعية الرئيسية
                </h3>
                <p className="text-xs text-stone-500">
                  الفنون والمتون الكبرى (العقيدة، الفقه، أصول الفقه، المصطلح، الخطب...)
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
                  <tr>
                    <th className="py-3 px-4 font-bold">الترتيب</th>
                    <th className="py-3 px-4 font-bold">اسم القسم</th>
                    <th className="py-3 px-4 font-bold">اللون المميز</th>
                    <th className="py-3 px-4 font-bold">الرابط اللطيف (Slug)</th>
                    <th className="py-3 px-4 font-bold">السلاسل المندرجة</th>
                    <th className="py-3 px-4 font-bold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <Layers className="w-10 h-10 text-stone-300 dark:text-stone-700" />
                          <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                            لا توجد أقسام شرعية مضافة بعد.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(null);
                              setIsCategoryModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>إضافة قسم جديد</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => {
                    const count = seriesList.filter((s) => s.category_id === cat.id).length;
                    const catTheme = getCategoryColorTheme(cat.color);
                    return (
                      <tr key={cat.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                        <td className="py-3.5 px-4 font-mono font-bold">{cat.sort_order}</td>
                        <td className="py-3.5 px-4 font-amiri text-xl font-bold text-stone-900 dark:text-stone-100">
                          {cat.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catTheme.badgeBg} ${catTheme.badgeText} ${catTheme.badgeBorder}`}>
                            <span className={`w-2 h-2 rounded-full ${catTheme.dot}`} />
                            <span>{catTheme.name}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-stone-500" dir="ltr">
                          {cat.slug}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-700 dark:text-stone-300">
                          {count} سلاسل
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              to={`/category/${cat.slug}`}
                              target="_blank"
                              title="معاينة في الموقع"
                              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(cat);
                                setIsCategoryModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400"
                              title="تعديل"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-red-600"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }))}
                </tbody>
              </table>
            </div>
          </div>
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
                  onClick={() => {
                    setPasswordError('');
                    setPasswordSuccess('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setIsPasswordModalOpen(true);
                  }}
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

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-amiri text-xl font-bold text-stone-900 dark:text-stone-100">
                  تغيير كلمة المرور
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              يرجى إدخال كلمة مرور جديدة مكونة من 10 خانات على الأقل، وتحتوي على أحرف وأرقام معاً.
            </p>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    dir="ltr"
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-700 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-xs"
                >
                  {passwordSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>حفظ كلمة المرور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
