// Admin: the contact details and the two closing lines shown in the footer of every page.
import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { getSiteContent, saveContactInfo } from '../../../services/data/siteContent';
import { DEFAULT_CONTACT, QUOTE_LIMITS, isEmail, type ContactInfo } from '../../../services/data/siteContentRules';

const field =
  'w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700';

export const ContactSettings: React.FC = () => {
  const [form, setForm] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getSiteContent(true)
      .then((content) => setForm(content.contact))
      .catch(() => setMessage({ type: 'error', text: 'تعذّر تحميل بيانات التواصل الحالية.' }));
  }, []);

  const set = (patch: Partial<ContactInfo>) => {
    setForm((current) => ({ ...current, ...patch }));
    setMessage(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email.trim() && !isEmail(form.email.trim())) {
      setMessage({ type: 'error', text: 'البريد الإلكتروني غير صحيح. مثال: name@example.com' });
      return;
    }
    setSaving(true);
    try {
      setForm(await saveContactInfo(form));
      setMessage({ type: 'success', text: 'تم الحفظ، وظهر التغيير في أسفل كل صفحات الموقع.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'تعذّر الحفظ. حاول مرة أخرى.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 shadow-xs space-y-5" aria-labelledby="contact-title">
      <div>
        <h3 id="contact-title" className="text-lg font-bold text-stone-900 dark:text-stone-100">
          بيانات التواصل ونصوص أسفل الموقع
        </h3>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          البريد والهاتف يظهران في أسفل الصفحات. اترك الحقل فارغاً لإخفائه. روابط واتساب وفيسبوك وغيرها تُدار من «روابط التواصل الاجتماعي» أدناه.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          البريد الإلكتروني
          <input type="email" dir="ltr" className={`${field} mt-1.5`} placeholder="name@example.com" maxLength={QUOTE_LIMITS.email} value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </label>
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          رقم الهاتف
          <input type="tel" dir="ltr" className={`${field} mt-1.5`} placeholder="+20 100 000 0000" maxLength={QUOTE_LIMITS.phone} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          سطر الحقوق (يسبقه رمز © والسنة تلقائياً)
          <input className={`${field} mt-1.5`} maxLength={QUOTE_LIMITS.footer} value={form.copyright} onChange={(e) => set({ copyright: e.target.value })} />
        </label>
        <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
          الدعاء الختامي
          <input className={`${field} mt-1.5`} maxLength={QUOTE_LIMITS.footer} value={form.dua} onChange={(e) => set({ dua: e.target.value })} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm disabled:opacity-50">
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {saving ? 'جارٍ الحفظ...' : 'حفظ بيانات التواصل'}
        </button>
        {message && (
          <span role={message.type === 'error' ? 'alert' : 'status'} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${message.type === 'success' ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {message.text}
          </span>
        )}
      </div>
    </form>
  );
};
