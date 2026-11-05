import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, LogOut, KeyRound } from 'lucide-react';
import { ThemeToggle } from '../../../components/ThemeToggle';
import { type AdminUser } from '../../../types';
import { type AdminTab } from './types';

export interface HeaderCounts {
  categories: number;
  series: number;
  lessons: number;
  published: number;
  drafts: number;
  requests: number | null;
  books: number | null;
}

// The tabs, in order; the numbers beside them come from the counts the dashboard already has
const tabLabels = (c: HeaderCounts): { id: AdminTab; label: string }[] => [
  { id: 'stats', label: 'الإحصائيات' },
  { id: 'requests', label: `الطلبات${c.requests ? ` (${c.requests})` : ''}` },
  { id: 'videos', label: 'فيديوهات القناة' },
  { id: 'lessons', label: `إدارة الدروس (${c.lessons})` },
  { id: 'series', label: `إدارة السلاسل (${c.series})` },
  { id: 'categories', label: `إدارة الأقسام (${c.categories})` },
  { id: 'books', label: `المكتبة${c.books !== null ? ` (${c.books})` : ''}` },
  { id: 'branding', label: 'إدارة الواجهة والتواصل' },
  { id: 'system', label: 'البيانات والتكامل' },
];

interface AdminHeaderProps {
  admin: AdminUser;
  activeTab: AdminTab;
  counts: HeaderCounts;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ admin, activeTab, counts, onTabChange, onLogout, onChangePassword }) => (
  <>
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
            onClick={onChangePassword}
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
            onClick={onLogout}
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
          <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{counts.categories}</span>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">السلاسل العلمية</span>
          <span className="text-xl font-bold text-stone-900 dark:text-stone-100">{counts.series}</span>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">الدروس المنشورة</span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{counts.published}</span>
        </div>
        <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700">
          <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">المسودات (غير المنشورة)</span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{counts.drafts}</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="w-full px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto border-t border-stone-100 dark:border-stone-800">
        {tabLabels(counts).map((tab) => (
          <button key={tab.id} type="button" onClick={() => onTabChange(tab.id)} className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  </>
);
