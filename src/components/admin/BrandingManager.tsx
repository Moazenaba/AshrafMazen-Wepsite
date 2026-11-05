import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Edit2,
  Plus,
  ArrowUp,
  ArrowDown,
  Check,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  Eye,
  RefreshCw,
  Sun,
  Moon,
  Link2,
  X,
  Share2,
} from 'lucide-react';
import {
  getSiteSettings,
  saveSiteSettings,
  uploadBrandingLogo,
  getAllSocialLinksAdmin,
  createSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from '../../services/dataService';
import { PLATFORMS_CONFIG, isValidSocialUrl } from '../SocialIcons';
import type { SiteSettings, SocialLink, SocialPlatform } from '../../types';

export const BrandingManager: React.FC = () => {
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

  // Social Links State
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(true);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Social Modal State
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<SocialLink | null>(null);
  const [socialFormData, setSocialFormData] = useState<{
    platform: SocialPlatform;
    url: string;
    is_active: boolean;
  }>({
    platform: 'facebook',
    url: '',
    is_active: true,
  });
  const [formUrlError, setFormUrlError] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);

  // Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<SocialLink | null>(null);

  // The last thing that failed on this tab, in words (null while everything works)
  const [dbIncomplete, setDbIncomplete] = useState<string | null>(null);

  // Load Data
  const loadBrandingData = async () => {
    try {
      setDbIncomplete(null);
      setLoadingSettings(true);
      setLoadingSocial(true);

      const [loadedSettings, loadedLinks] = await Promise.all([
        getSiteSettings(),
        getAllSocialLinksAdmin(),
      ]);

      setSettings(loadedSettings);
      setSocialLinks(loadedLinks);
    } catch (err: any) {
      console.error('Error loading branding data:', err);
      setDbIncomplete(err?.message || 'تعذّر تحميل إعدادات الواجهة وروابط التواصل.');
    } finally {
      setLoadingSettings(false);
      setLoadingSocial(false);
    }
  };

  useEffect(() => {
    loadBrandingData();
  }, []);

  // Handle Logo File Select & Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setSettingsMessage({
        type: 'error',
        text: 'حجم ملف الشعار يتجاوز 2 ميجابايت. يرجى اختيار ملف أصغر.',
      });
      return;
    }

    try {
      setUploadingLogo(true);
      setSettingsMessage(null);
      const publicUrl = await uploadBrandingLogo(file);
      setSettings((prev) => ({ ...prev, banner_logo_url: publicUrl }));
      setSettingsMessage({
        type: 'success',
        text: 'تم رفع الشعار بنجاح. لا تنسَ الضغط على "حفظ إعدادات الترويسة".',
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
      text: 'تمت إزالة الشعار. اضغط "حفظ إعدادات الترويسة" لتطبيق التغيير.',
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
        text: 'تم حفظ إعدادات الترويسة بنجاح وتحديث الموقع.',
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

  // Open Add Social Link Modal
  const handleOpenAddSocial = () => {
    setEditingSocial(null);
    setSocialFormData({
      platform: 'facebook',
      url: '',
      is_active: true,
    });
    setFormUrlError('');
    setIsSocialModalOpen(true);
  };

  // Open Edit Social Link Modal
  const handleOpenEditSocial = (link: SocialLink) => {
    setEditingSocial(link);
    setSocialFormData({
      platform: link.platform,
      url: link.url,
      is_active: link.is_active,
    });
    setFormUrlError('');
    setIsSocialModalOpen(true);
  };

  // Save Social Link (Create or Update)
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    const urlTrimmed = socialFormData.url.trim();

    if (!urlTrimmed) {
      setFormUrlError('يرجى إدخال الرابط');
      return;
    }

    if (!isValidSocialUrl(urlTrimmed)) {
      setFormUrlError('يجب أن يبدأ الرابط بـ https:// أو http:// أو mailto:');
      return;
    }

    try {
      setSavingSocial(true);
      setFormUrlError('');

      if (editingSocial) {
        await updateSocialLink(editingSocial.id, {
          platform: socialFormData.platform,
          url: urlTrimmed,
          is_active: socialFormData.is_active,
        });
      } else {
        const nextOrder = socialLinks.length > 0 ? Math.max(...socialLinks.map((l) => l.sort_order)) + 1 : 0;
        await createSocialLink({
          platform: socialFormData.platform,
          url: urlTrimmed,
          sort_order: nextOrder,
          is_active: socialFormData.is_active,
        });
      }

      setIsSocialModalOpen(false);
      await loadBrandingData();
    } catch (err: any) {
      console.error('Error saving social link:', err);
      setFormUrlError(`تعذّر الحفظ: ${err?.message || 'حاول مرة أخرى.'}`);
    } finally {
      setSavingSocial(false);
    }
  };

  // Toggle Social Active Status
  const handleToggleActive = async (link: SocialLink) => {
    try {
      await updateSocialLink(link.id, { is_active: !link.is_active });
      setSocialLinks((prev) =>
        prev.map((item) => (item.id === link.id ? { ...item, is_active: !link.is_active } : item))
      );
    } catch (err: any) {
      console.error('Failed to toggle active status:', err);
      setDbIncomplete(`تعذّر تغيير حالة الرابط: ${err?.message || ''}`);
    }
  };

  // Move Order Up/Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= socialLinks.length) return;

    const currentItem = socialLinks[index];
    const targetItem = socialLinks[targetIndex];

    try {
      // Swap sort_order values
      const currentOrder = currentItem.sort_order;
      const targetOrder = targetItem.sort_order;

      await Promise.all([
        updateSocialLink(currentItem.id, { sort_order: targetOrder }),
        updateSocialLink(targetItem.id, { sort_order: currentOrder }),
      ]);

      await loadBrandingData();
    } catch (err: any) {
      console.error('Failed to reorder social links:', err);
      setDbIncomplete(`تعذّر تغيير الترتيب: ${err?.message || ''}`);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSocialLink(deleteTarget.id);
      setDeleteTarget(null);
      await loadBrandingData();
    } catch (err: any) {
      console.error('Failed to delete social link:', err);
      setDbIncomplete(`تعذّر حذف الرابط: ${err?.message || ''}`);
    }
  };

  return (
    <div className="space-y-10 font-cairo">
      {/* Database Setup Warning (Only inside admin) */}
      {dbIncomplete && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">حدث خطأ</h4>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">{dbIncomplete}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SECTION: BANNER SETTINGS (الترويسة) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-amber-400" />
              <span>إعدادات ترويسة الموقع (البانر الرئيسي)</span>
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
                الاسم الكامل في الترويسة (بخط الرقعة العربي)
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
                  <span>الشعار المصور للترويسة (اختياري)</span>
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  إذا قمت برفع شعار مخصص، فسيظهر بدلاً من النص الخطي في الترويسة (يدعم PNG، SVG، JPG، WEBP بحد أقصى 2MB).
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
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
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
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
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
                    PNG, SVG, JPG, WEBP (الحد الأقصى 2 ميجابايت)
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
              <span>حفظ إعدادات الترويسة</span>
            </button>
          </div>
        </form>

        {/* Live Banner Preview */}
        <div className="border-t border-stone-200 dark:border-stone-800 pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                معاينة حية لشكل الترويسة
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

      {/* ======================================================== */}
      {/* 2. SECTION: SOCIAL MEDIA LINKS (روابط التواصل الاجتماعي) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-700 dark:text-amber-400" />
              <span>إدارة روابط التواصل الاجتماعي ({socialLinks.length})</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              تظهر هذه الأيقونات في شريط الخدمات أعلى الموقع وكذلك في التذييل. يمكنك إضافة المنصات وترتيبها وتفعيلها.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddSocial}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة رابط جديد</span>
          </button>
        </div>

        {/* Social Links List */}
        {loadingSocial ? (
          <div className="py-12 text-center text-xs text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-700" />
            <span>جاري تحميل روابط التواصل...</span>
          </div>
        ) : socialLinks.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-6 space-y-2">
            <Share2 className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
              لا توجد روابط تواصل مضافة حالياً
            </p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              اضغط على "إضافة رابط جديد" لإضافة قنوات التيليجرام أو اليوتيوب أو حسابات فيسبوك وغيرها.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-stone-400 font-medium">
                  <th className="py-3 px-3">الترتيب</th>
                  <th className="py-3 px-3">المنصة</th>
                  <th className="py-3 px-3">الرابط</th>
                  <th className="py-3 px-3 text-center">الحالة</th>
                  <th className="py-3 px-3 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {socialLinks.map((link, index) => {
                  const platformConfig = PLATFORMS_CONFIG[link.platform] || PLATFORMS_CONFIG.default;
                  const IconComp = platformConfig.icon;

                  return (
                    <tr
                      key={link.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors"
                    >
                      {/* Sort Controls */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, 'up')}
                            disabled={index === 0}
                            aria-label="تقديم الترتيب"
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveOrder(index, 'down')}
                            disabled={index === socialLinks.length - 1}
                            aria-label="تأخير الترتيب"
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-xs text-stone-400 px-1">
                            #{index + 1}
                          </span>
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: platformConfig.brandColor }}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-stone-800 dark:text-stone-200">
                            {platformConfig.name}
                          </span>
                        </div>
                      </td>

                      {/* URL */}
                      <td className="py-3 px-3 max-w-xs truncate">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-600 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-amber-400 font-mono text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span className="truncate">{link.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(link)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                            link.is_active
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
                              : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400 border border-stone-300/40'
                          }`}
                        >
                          {link.is_active ? 'مفعل' : 'معطل'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSocial(link)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(link)}
                            className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SOCIAL LINK */}
      {/* ======================================================== */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-md p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <h3 className="font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                <span>{editingSocial ? 'تعديل رابط تواصل' : 'إضافة رابط تواصل جديد'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSocialModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-4">
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
                      const isSelected = socialFormData.platform === key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSocialFormData({ ...socialFormData, platform: key as SocialPlatform })}
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
                    value={socialFormData.url}
                    onChange={(e) => {
                      setSocialFormData({ ...socialFormData, url: e.target.value });
                      if (formUrlError) setFormUrlError('');
                    }}
                    placeholder="https://t.me/sheikh_channel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-700 dark:focus:ring-amber-400 transition-all text-left"
                  />
                </div>
                {formUrlError && (
                  <span className="text-red-500 text-xs mt-1 block font-medium">
                    {formUrlError}
                  </span>
                )}
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="social-active"
                  checked={socialFormData.is_active}
                  onChange={(e) => setSocialFormData({ ...socialFormData, is_active: e.target.checked })}
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
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingSocial}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingSocial && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSocial ? 'حفظ التعديلات' : 'إضافة الرابط'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DELETE CONFIRM */}
      {/* ======================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl w-full max-w-sm p-6 border border-stone-200 dark:border-stone-800 shadow-xl space-y-4">
            <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
              حذف رابط التواصل
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف رابط منصة{' '}
              <strong>{PLATFORMS_CONFIG[deleteTarget.platform]?.name || deleteTarget.platform}</strong>؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                حذف الرابط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
