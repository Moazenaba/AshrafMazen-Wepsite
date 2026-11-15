// The admin's "البيانات والتكامل" tab: the live checks and the password change.
import React from 'react';
import { KeyRound } from 'lucide-react';
import { SystemStatus } from '../../../components/admin/SystemStatus';
import { ErrorLog } from '../../../components/admin/ErrorLog';

export const SystemTab: React.FC<{ onChangePassword: () => void }> = ({ onChangePassword }) => (
    <div className="max-w-3xl space-y-6">
      <SystemStatus />
      <ErrorLog />

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
            onClick={onChangePassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            <KeyRound className="w-4 h-4" />
            <span>تغيير كلمة مرور مدير الموقع</span>
          </button>
        </div>
      </div>
    </div>
);
