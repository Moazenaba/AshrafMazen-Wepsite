import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TurnstileWidget, turnstileEnabled } from '../components/TurnstileWidget';
import { useSearchParams } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { timedFetch } from '../lib/timedFetch';

type Kind = 'book' | 'audio' | 'video' | 'correction' | 'removal';

const KINDS: { value: Kind; label: string; hint: string; needsUrl: boolean }[] = [
  { value: 'book', label: 'اقتراح كتاب', hint: 'كتاب أو رسالة بصيغة PDF تقترح إضافتها للمكتبة', needsUrl: true },
  { value: 'audio', label: 'اقتراح مادة صوتية', hint: 'رابط تسجيل صوتي تقترح إضافته', needsUrl: true },
  { value: 'video', label: 'اقتراح فيديو', hint: 'رابط فيديو تقترح إضافته', needsUrl: true },
  { value: 'correction', label: 'تصحيح خطأ', hint: 'خطأ في عنوان أو نص أو رابط أو معلومة', needsUrl: false },
  { value: 'removal', label: 'طلب إزالة', hint: 'محتوى تطلب إزالته من الموقع مع بيان السبب', needsUrl: false },
];

const field =
  'w-full min-h-12 px-4 rounded-lg bg-white dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-mushaf';
const label = 'block mb-1.5 font-semibold text-stone-800 dark:text-stone-200';

// Visitors cannot add, change or delete anything themselves: they send a request here, and it appears on the site
// only after the administration approves it. No account is needed.
export const Contribute: React.FC = () => {
  const [params] = useSearchParams();
  const initial = KINDS.find((k) => k.value === params.get('type'))?.value ?? 'book';
  const [kind, setKind] = useState<Kind>(initial);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [details, setDetails] = useState('');
  const [target, setTarget] = useState(params.get('target') || '');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // the hidden field: only bots fill it
  const [turnstile, setTurnstile] = useState('');
  const [widgetKey, setWidgetKey] = useState(0); // a new widget after a failed send: the old token is used up
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const openedAt = useRef(Date.now());
  const statusRef = useRef<HTMLParagraphElement>(null);

  const config = useMemo(() => KINDS.find((k) => k.value === kind)!, [kind]);
  const isReport = kind === 'correction' || kind === 'removal';

  useEffect(() => {
    document.title = 'شارك - الشيخ أشرف مازن';
  }, []);

  useEffect(() => {
    if (done || error) statusRef.current?.focus();
  }, [done, error]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const response = await timedFetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, title, url, author, details, target, contact, website, turnstile, t: openedAt.current }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'تعذّر إرسال الطلب. حاول مرة أخرى.');
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'تعذّر إرسال الطلب. حاول مرة أخرى.');
      setTurnstile('');
      setWidgetKey((k) => k + 1);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-6">
        <p
          ref={statusRef}
          tabIndex={-1}
          role="status"
          className="flex items-start gap-3 p-5 rounded-xl bg-mushaf text-gold-soft focus:outline-none"
        >
          <Check className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            <span className="block font-ruqaa text-2xl">جزاك الله خيراً</span>
            <span className="block mt-1 text-white">وصل طلبك إلى الإدارة. لن يظهر أو يتغيّر شيء في الموقع إلا بعد مراجعته والموافقة عليه.</span>
          </span>
        </p>
        <button
          type="button"
          onClick={() => {
            setDone(false);
            setTitle('');
            setUrl('');
            setAuthor('');
            setDetails('');
            setContact('');
            openedAt.current = Date.now();
          }}
          className="press inline-flex items-center h-12 px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep font-bold"
        >
          إرسال طلب آخر
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6 sm:space-y-8">
      <header className="space-y-2">
        <h1 className="font-ruqaa text-4xl sm:text-5xl text-mushaf dark:text-gold-soft">شارك</h1>
        <p className="text-stone-700 dark:text-stone-300 max-w-[60ch]">
          اقترح مادة تُضاف، أو بلّغ عن خطأ، أو اطلب إزالة محتوى. لا تحتاج إلى حساب. كل طلب يُراجَع من الإدارة، ولا يتغيّر
          شيء في الموقع إلا بعد موافقتها.
        </p>
      </header>

      <div role="tablist" aria-label="نوع الطلب" className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="tab"
            aria-selected={kind === k.value}
            onClick={() => setKind(k.value)}
            className={`min-h-11 px-4 rounded-full text-sm font-semibold transition-colors ${
              kind === k.value
                ? 'bg-mushaf text-gold-soft'
                : 'bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-gold-soft/40 dark:hover:bg-stone-700'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="rounded-xl bg-white dark:bg-stone-800 p-5 sm:p-7 space-y-5" noValidate>
        <p className="text-stone-700 dark:text-stone-300">{config.hint}</p>

        <div>
          <label htmlFor="c-title" className={label}>
            {isReport ? 'موضوع الطلب' : 'العنوان'} <span aria-hidden="true" className="text-red-700">*</span>
          </label>
          <input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className={`${field} bg-stone-100 dark:bg-stone-900`} />
        </div>

        {config.needsUrl && (
          <div>
            <label htmlFor="c-url" className={label}>
              الرابط <span aria-hidden="true" className="text-red-700">*</span>
            </label>
            <input
              id="c-url"
              type="url"
              dir="ltr"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              maxLength={600}
              className={`${field} bg-stone-100 dark:bg-stone-900`}
            />
          </div>
        )}

        {kind === 'book' && (
          <div>
            <label htmlFor="c-author" className={label}>المؤلف</label>
            <input id="c-author" value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={200} className={`${field} bg-stone-100 dark:bg-stone-900`} />
          </div>
        )}

        {isReport && (
          <div>
            <label htmlFor="c-target" className={label}>رابط الصفحة المقصودة</label>
            <input
              id="c-target"
              dir="ltr"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="https://..."
              maxLength={300}
              className={`${field} bg-stone-100 dark:bg-stone-900`}
            />
          </div>
        )}

        <div>
          <label htmlFor="c-details" className={label}>
            {isReport ? 'الشرح' : 'ملاحظات'} {isReport && <span aria-hidden="true" className="text-red-700">*</span>}
          </label>
          <textarea
            id="c-details"
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required={isReport}
            maxLength={2000}
            className="w-full px-4 py-3 rounded-lg bg-stone-100 dark:bg-stone-900 text-base text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-mushaf"
          />
        </div>

        <div>
          <label htmlFor="c-contact" className={label}>وسيلة تواصل (اختيارية)</label>
          <input
            id="c-contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={200}
            aria-describedby="c-contact-hint"
            className={`${field} bg-stone-100 dark:bg-stone-900`}
          />
          <p id="c-contact-hint" className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">
            بريد أو رقم تستخدمه الإدارة إن احتاجت إلى سؤالك. لا يظهر للزوار.
          </p>
        </div>

        {/* Hidden from people; bots fill it in, and the server then ignores the request */}
        <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="c-website">لا تملأ هذا الحقل</label>
          <input id="c-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        {error && (
          <p ref={statusRef} tabIndex={-1} role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-semibold focus:outline-none">
            {error}
          </p>
        )}

        <TurnstileWidget key={widgetKey} onToken={setTurnstile} />

        <button
          type="submit"
          disabled={sending || (turnstileEnabled && !turnstile)}
          className="press inline-flex items-center justify-center gap-2 h-12 px-8 rounded-lg bg-mushaf hover:bg-mushaf-deep text-gold-soft font-bold disabled:opacity-60"
        >
          {sending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          {sending ? 'جارٍ الإرسال...' : 'إرسال للمراجعة'}
        </button>
      </form>
    </div>
  );
};
