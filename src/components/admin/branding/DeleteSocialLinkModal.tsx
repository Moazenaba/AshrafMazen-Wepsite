import React from 'react';
import { PLATFORMS_CONFIG } from '../../SocialIcons';
import { type SocialLink } from '../../../types';

// Asks before a social link is removed
export const DeleteSocialLinkModal: React.FC<{ target: SocialLink; onConfirm: () => void; onCancel: () => void }> = ({ target, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-4">
      <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
        حذف رابط التواصل
      </h4>
      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
        هل أنت متأكد من رغبتك في حذف رابط منصة{' '}
        <strong>{PLATFORMS_CONFIG[target.platform]?.name || target.platform}</strong>؟
      </p>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => onCancel()}
          className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
        >
          حذف الرابط
        </button>
      </div>
    </div>
  </div>
);
