import React from 'react';
import { RefreshCw, X, Share2 } from 'lucide-react';
import { PLATFORMS_CONFIG } from '../../SocialIcons';
import { type SocialLink, type SocialPlatform } from '../../../types';

export interface SocialLinkForm {
  platform: SocialPlatform;
  url: string;
  is_active: boolean;
}

interface SocialLinkModalProps {
  editing: SocialLink | null;
  form: SocialLinkForm;
  urlError: string;
  saving: boolean;
  onFormChange: (form: SocialLinkForm) => void;
  onUrlError: (message: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

// The add / edit window for one social link (shown by SocialLinks while it is open)
export const SocialLinkModal: React.FC<SocialLinkModalProps> = ({ editing, form, urlError, saving, onFormChange, onUrlError, onSubmit, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
          <span>{editing ? 'تعديل رابط تواصل' : 'إضافة رابط تواصل جديد'}</span>
        </h3>
        <button
          type="button"
          onClick={() => onClose()}
          className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Platform Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            المنصة / الشبكة
          </label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-stone-200 dark:border-stone-800 rounded-xl">
            {Object.entries(PLATFORMS_CONFIG)
              .filter(([key]) => key !== 'default')
              .map(([key, config]) => {
                const IconComp = config.icon;
                const isSelected = form.platform === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onFormChange({ ...form, platform: key as SocialPlatform })}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:border-amber-400 text-emerald-900 dark:text-amber-300 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: config.brandColor }}
                    >
                      <IconComp className="w-3 h-3" />
                    </div>
                    <span className="text-xs truncate w-full text-center">{config.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* URL Input */}
        <div>
          <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
            الرابط الكامل (يبدأ بـ https:// أو mailto:)
          </label>
          <div className="relative">
            <input
              type="text"
              dir="ltr"
              value={form.url}
              onChange={(e) => {
                onFormChange({ ...form, url: e.target.value });
                if (urlError) onUrlError('');
              }}
              placeholder="https://t.me/sheikh_channel"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 transition-all text-left"
            />
          </div>
          {urlError && (
            <span className="text-red-500 text-xs mt-1 block font-medium">
              {urlError}
            </span>
          )}
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="social-active"
            checked={form.is_active}
            onChange={(e) => onFormChange({ ...form, is_active: e.target.checked })}
            className="rounded text-emerald-700 focus:ring-emerald-700 dark:bg-stone-800 dark:border-stone-700"
          />
          <label htmlFor="social-active" className="text-xs font-bold text-stone-700 dark:text-stone-300 cursor-pointer">
            تفعيل الرابط وإظهاره فوراً في الموقع
          </label>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => onClose()}
            className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{editing ? 'حفظ التعديلات' : 'إضافة الرابط'}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
);
