// Admin: Header name, logo and live preview.
import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Check, Image as ImageIcon, AlertCircle, Eye, RefreshCw, Sun, Moon } from 'lucide-react';
import { getSiteSettings, saveSiteSettings, uploadBrandingLogo } from '../../../services/dataService';
import { type SiteSettings } from '../../../types';
import { acceptOf, checkFile, describeRule } from '../../../constants/fileRules';

export const BannerSettings: React.FC = () => {
  // Banner Settings State
  const [settings, setSettings] = useState<SiteSettings>({
    banner_name: 'أبو عبد الرحمن أشرف بن طه بن مازن',
    banner_logo_url: null,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Live Preview Theme
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');

  // Load the saved settings
  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch((err: any) => {
        console.error('Error loading banner settings:', err);
        setSettingsMessage({ type: 'error', text: err?.message || 'تعذّر تحميل الاسم والشعار.' });
      })
      .finally(() => setLoadingSettings(false));
  }, []);

  // Handle Logo File Select & Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const problem = checkFile('logo', file.name, file.size);
    if (problem) {
      setSettingsMessage({ type: 'error', text: problem });
      return;
    }

    try {
      setUploadingLogo(true);
      setSettingsMessage(null);
      const publicUrl = await uploadBrandingLogo(file);
      setSettings((prev) => ({ ...prev, banner_logo_url: publicUrl }));
      setSettingsMessage({
        type: 'success',
        text: 'تم رفع الشعار بنجاح. لا تنسَ الضغط على "حفظ".',
      });
    } catch (err: any) {
      console.error('Failed to upload logo:', err);
      setSettingsMessage({
        type: 'error',
        text: err?.message || 'تعذر رفع الشعار. حاول مرة أخرى.',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    setSettings((prev) => ({ ...prev, banner_logo_url: null }));
    setSettingsMessage({
      type: 'success',
      text: 'تمت إزالة الشعار. اضغط "حفظ" لتطبيق التغيير.',
    });
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      setSettingsMessage(null);
      await saveSiteSettings(settings);
      setSettingsMessage({
        type: 'success',
        text: 'تم الحفظ بنجاح وتحديث الموقع.',
      });
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setSettingsMessage({
        type: 'error',
        text: `تعذّر حفظ الإعدادات: ${err?.message || 'حاول مرة أخرى.'}`,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <>
      {/* ======================================================== */}
      {/* 1. SECTION: BANNER SETTINGS (أعلى الصفحة) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400" />
              <span>اسم الشيخ والشعار في أعلى كل صفحة</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              التحكم في نص الاسم والخط أو رفع شعار مصور مخصص يظهر في أعلى صفحات الموقع.
            </p>
          </div>
        </div>

        {settingsMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              settingsMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {settingsMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{settingsMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Banner Full Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                الاسم الذي يظهر في أعلى الصفحة (بخط الرقعة)
              </label>
              <input
                type="text"
                value={settings.banner_name}
                onChange={(e) => setSettings({ ...settings, banner_name: e.target.value })}
                placeholder="أبو عبد الرحمن أشرف بن طه بن مازن"
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 transition-all font-ruqaa text-base"
              />
              <span className="text-xs text-stone-400 mt-1 block">
                افتراضي: "أبو عبد الرحمن أشرف بن طه بن مازن"
              </span>
            </div>
          </div>

          {/* Logo Uploader */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl p-5 bg-stone-50/60 dark:bg-stone-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                  <span>الشعار (اختياري)</span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  إذا قمت برفع شعار مخصص، فسيظهر بدلاً من النص الخطي في أعلى الصفحة ({describeRule('logo')}).
                </p>
              </div>
            </div>

            {settings.banner_logo_url ? (
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                <div className="h-20 w-48 sm:w-60 flex items-center justify-center p-2 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  <img
                    src={settings.banner_logo_url}
                    alt="معاينة الشعار"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex-1 space-y-1 text-center sm:text-right">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 block">
                    الشعار الحالي مفعل
                  </span>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate max-w-md font-mono">
                    {settings.banner_logo_url}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 hover:border-emerald-700 text-xs font-semibold text-stone-700 dark:text-stone-200 transition-colors">
                    <span>تغيير</span>
                    <input
                      type="file"
                      accept={acceptOf('logo')}
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة الشعار</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl p-6 text-center hover:border-emerald-700 dark:hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  id="logo-upload"
                  accept={acceptOf('logo')}
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-amber-400 flex items-center justify-center">
                    {uploadingLogo ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-stone-800 dark:text-stone-200">
                    {uploadingLogo ? 'جاري رفع الشعار...' : 'انقر لاختيار ملف الشعار أو اسحبه هنا'}
                  </div>
                  <div className="text-xs text-stone-400">
                    {describeRule('logo')}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings || uploadingLogo}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>حفظ</span>
            </button>
          </div>
        </form>

        {/* Live Banner Preview */}
        <div className="border-t border-stone-200 dark:border-stone-800 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                هكذا يظهر أعلى الصفحة
              </span>
            </div>
            {/* Light / Dark Preview Switcher */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewTheme('light')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewTheme === 'light'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>الوضع النهاري</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTheme('dark')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  previewTheme === 'dark'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>الوضع الليلي</span>
              </button>
            </div>
          </div>

          {/* Render Preview Box */}
          <div
            className={`rounded-2xl border p-6 text-center relative overflow-hidden transition-colors ${
              previewTheme === 'dark'
                ? 'bg-[#0d1612] border-[#22302a] text-stone-100'
                : 'bg-gradient-to-b from-[#fbf8f2] via-[#f7f3eb] to-[#f4ede0] border-amber-300/40 text-stone-900'
            }`}
          >
            {/* Subtle Star overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none select-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l5 15 15-5-5 15 15 5-15 5 5 15-15-5-5 15-5-15-15 5 5-15-15-5 15-5-5-15 15 5z' fill='%230f5c43' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                backgroundSize: '48px 48px',
              }}
            />

            {settings.banner_logo_url ? (
              <div className="min-h-[80px] flex items-center justify-center py-2 relative z-10">
                <img
                  src={settings.banner_logo_url}
                  alt={settings.banner_name}
                  className="max-h-[90px] w-auto max-w-full object-contain filter drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="min-h-[80px] flex flex-col items-center justify-center py-2 relative z-10">
                <h2
                  className={`font-ruqaa font-bold text-2xl sm:text-3xl ${
                    previewTheme === 'dark' ? 'text-emerald-100' : 'text-emerald-950'
                  }`}
                >
                  {settings.banner_name || 'أبو عبد الرحمن أشرف بن طه بن مازن'}
                </h2>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
