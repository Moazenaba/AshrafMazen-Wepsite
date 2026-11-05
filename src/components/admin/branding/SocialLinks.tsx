// Admin: the social links list, with its add/edit window and delete confirmation.
import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, ArrowUp, ArrowDown, ExternalLink, AlertCircle, RefreshCw, Share2 } from 'lucide-react';
import { getAllSocialLinksAdmin, createSocialLink, updateSocialLink, deleteSocialLink } from '../../../services/dataService';
import { PLATFORMS_CONFIG, isValidSocialUrl } from '../../SocialIcons';
import { type SocialLink, type SocialPlatform } from '../../../types';
import { SocialLinkModal } from './SocialLinkModal';
import { DeleteSocialLinkModal } from './DeleteSocialLinkModal';

export const SocialLinks: React.FC = () => {
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
  // The last thing that failed here, in words (null while everything works)
  const [dbIncomplete, setDbIncomplete] = useState<string | null>(null);

  const loadLinks = async () => {
    try {
      setDbIncomplete(null);
      setLoadingSocial(true);
      setSocialLinks(await getAllSocialLinksAdmin());
    } catch (err: any) {
      console.error('Error loading social links:', err);
      setDbIncomplete(err?.message || 'تعذّر تحميل روابط التواصل.');
    } finally {
      setLoadingSocial(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

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
      await loadLinks();
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

      await loadLinks();
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
      await loadLinks();
    } catch (err: any) {
      console.error('Failed to delete social link:', err);
      setDbIncomplete(`تعذّر حذف الرابط: ${err?.message || ''}`);
    }
  };

  return (
    <>
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

      {isSocialModalOpen && (
        <SocialLinkModal
          editing={editingSocial}
          form={socialFormData}
          urlError={formUrlError}
          saving={savingSocial}
          onFormChange={setSocialFormData}
          onUrlError={setFormUrlError}
          onSubmit={handleSaveSocial}
          onClose={() => setIsSocialModalOpen(false)}
        />
      )}

      {deleteTarget && (
        <DeleteSocialLinkModal target={deleteTarget} onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </>
  );
};
