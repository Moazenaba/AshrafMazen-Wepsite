import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getAdminStats } from '../../services/analytics';
import { getPendingSubmissionsCount } from '../../services/dataService';
import { timedFetch } from '../../lib/timedFetch';

type State = 'checking' | 'ok' | 'warn' | 'fail';
interface Check {
  id: string;
  name: string;
  state: State;
  detail: string;
  fix?: string;
}

const ICON: Record<State, React.ReactNode> = {
  checking: <Loader2 className="w-5 h-5 animate-spin text-stone-500" aria-label="جارٍ الفحص" />,
  ok: <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" aria-label="سليم" />,
  warn: <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400" aria-label="تنبيه" />,
  fail: <XCircle className="w-5 h-5 text-red-700 dark:text-red-400" aria-label="معطّل" />,
};

async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

// What really works right now, checked live, with what to do when it does not
async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  // 1. The database
  {
    const started = performance.now();
    const { error } = await supabase.from('site_settings').select('key').limit(1);
    const ms = Math.round(performance.now() - started);
    checks.push(
      error
        ? { id: 'db', name: 'قاعدة البيانات', state: 'fail', detail: error.message, fix: 'تحقق من VITE_SUPABASE_URL وVITE_SUPABASE_ANON_KEY، ومن أن مشروع Supabase يعمل.' }
        : { id: 'db', name: 'قاعدة البيانات', state: ms > 2500 ? 'warn' : 'ok', detail: `تستجيب خلال ${new Intl.NumberFormat('ar-EG').format(ms)} ملّي ثانية.` }
    );
  }

  // 2. File storage: the server holds the keys and proves it can write and remove a file
  {
    try {
      const jwt = await token();
      const response = await timedFetch('/api/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ action: 'status' }),
      });
      if (response.status === 501 || response.status === 404) {
        checks.push({
          id: 'r2',
          name: 'تخزين الصور والصوتيات والكتب',
          state: 'fail',
          detail: 'إعدادات R2 غير موجودة على الخادم، فلا يمكن رفع صوت أو كتب أو لوجو.',
          fix: 'أضف R2_ACCOUNT_ID وR2_BUCKET وR2_ACCESS_KEY_ID وR2_SECRET_ACCESS_KEY (وSUPABASE_URL وSUPABASE_ANON_KEY) في Vercel ← Settings ← Environment Variables ثم أعد النشر.',
        });
      } else if (response.status === 403) {
        checks.push({ id: 'r2', name: 'تخزين الصور والصوتيات والكتب', state: 'warn', detail: 'تعذّر التحقق: انتهت جلسة الإدارة.', fix: 'سجّل الخروج ثم الدخول مرة أخرى.' });
      } else {
        const data = await response.json();
        checks.push(
          data.write && data.remove
            ? {
                id: 'r2',
                name: 'تخزين الصور والصوتيات والكتب',
                state: 'ok',
                detail: `الحاوية ${data.bucket}: الكتابة والحذف يعملان. ${data.publicAddress ? 'لها عنوان عام.' : 'الحاوية خاصة، والموقع يقدّم الملفات بنفسه.'}`,
              }
            : {
                id: 'r2',
                name: 'تخزين الصور والصوتيات والكتب',
                state: 'fail',
                detail: 'المفاتيح موجودة لكن الكتابة أو الحذف مرفوضان.',
                fix: 'تأكد أن توكن R2 بصلاحية Object Read & Write على هذه الحاوية، وأن اسم الحاوية صحيح.',
              }
        );
      }
    } catch {
      checks.push({ id: 'r2', name: 'تخزين الصور والصوتيات والكتب', state: 'warn', detail: 'تعذّر الاتصال بدالة الخادم /api/r2 (طبيعي في معاينة ثابتة بلا خادم).' });
    }
  }

  // 3. The channel's videos
  {
    try {
      const response = await timedFetch('/api/youtube-library');
      const data = response.ok ? await response.json() : null;
      const stale = data?.updatedAt && Date.now() - Date.parse(data.updatedAt) > 3 * 3600_000;
      checks.push(
        stale
          ? { id: 'yt', name: 'فيديوهات القناة', state: 'warn', detail: `آخر تحديث للقائمة قديم (${new Date(data.updatedAt).toLocaleString('ar-EG')}).`, fix: 'يتأخر يوتيوب أحياناً؛ يعيد الخادم المحاولة تلقائياً.' }
          : data?.playlists?.length
          ? { id: 'yt', name: 'فيديوهات القناة', state: 'ok', detail: `${new Intl.NumberFormat('ar-EG').format(data.playlists.length)} قائمة${data.updatedAt ? `، آخر تحديث ${new Date(data.updatedAt).toLocaleString('ar-EG')}` : ' (من النسخة المضمّنة في الموقع)'}.` }
          : { id: 'yt', name: 'فيديوهات القناة', state: 'warn', detail: 'الخادم لا يرد، والموقع يعرض النسخة المضمّنة فقط (لن تظهر الفيديوهات الجديدة).', fix: 'تأكد أن دالة /api/youtube-library منشورة على Vercel.' }
      );
    } catch {
      checks.push({ id: 'yt', name: 'فيديوهات القناة', state: 'warn', detail: 'الخادم لا يرد، والموقع يعرض النسخة المضمّنة فقط.' });
    }
  }

  // 3b. The live-broadcast check
  {
    try {
      const response = await timedFetch('/api/live');
      const data = response.ok ? await response.json() : null;
      checks.push(
        typeof data?.live === 'boolean'
          ? { id: 'live', name: 'كشف البث المباشر', state: 'ok', detail: data.live ? 'القناة تبث الآن.' : 'لا يوجد بث الآن.' }
          : { id: 'live', name: 'كشف البث المباشر', state: 'warn', detail: 'الخادم لا يرد على فحص البث.' }
      );
    } catch {
      checks.push({ id: 'live', name: 'كشف البث المباشر', state: 'warn', detail: 'الخادم لا يرد على فحص البث.' });
    }
  }

  // 4. Statistics
  {
    try {
      await getAdminStats(1);
      checks.push({ id: 'stats', name: 'عدّاد الزيارات', state: 'ok', detail: 'جداول الإحصائيات والدوال تعمل.' });
    } catch (err: any) {
      checks.push({
        id: 'stats',
        name: 'عدّاد الزيارات',
        state: 'fail',
        detail: err?.message || 'تعذّر القراءة.',
        fix: 'شغّل docs/migrations/2026-11-04-analytics.sql في Supabase SQL Editor.',
      });
    }
  }

  // 5. Visitor requests
  {
    try {
      const { error } = await supabase.from('submissions').select('id', { head: true, count: 'exact' }).limit(1);
      if (error) throw error;
      const pending = await getPendingSubmissionsCount();
      checks.push({
        id: 'requests',
        name: 'طلبات الزوار',
        state: 'ok',
        detail: pending ? `${new Intl.NumberFormat('ar-EG').format(pending)} طلب بانتظار مراجعتك في تبويب «الطلبات».` : 'لا طلبات منتظرة.',
      });
    } catch (err: any) {
      checks.push({
        id: 'requests',
        name: 'طلبات الزوار',
        state: 'fail',
        detail: err?.message || 'تعذّر القراءة.',
        fix: 'شغّل docs/migrations/2026-11-04-hardening-and-contributions.sql في Supabase SQL Editor.',
      });
    }
  }

  return checks;
}

// The admin's live health panel: each part of the site, whether it works now, and what to do if not
export const SystemStatus: React.FC = () => {
  const [checks, setChecks] = useState<Check[]>([]);
  const [running, setRunning] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    setChecks(await runChecks());
    setRunning(false);
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  // Uploads a 1-pixel image from this browser straight to R2 and removes it: proves the keys AND the CORS rule
  const testUpload = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const jwt = await token();
      const sign = await timedFetch('/api/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ action: 'sign', kind: 'cover', filename: 'check.png', size: 68 }),
      });
      if (!sign.ok) throw new Error((await sign.json().catch(() => ({}))).error || 'رفض الخادم تجهيز الرفع.');
      const signed = await sign.json();
      const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), (c) => c.charCodeAt(0));
      let put: Response;
      try {
        put = await timedFetch(signed.uploadUrl, { method: 'PUT', headers: { 'Content-Type': signed.contentType }, body: png });
      } catch {
        throw new Error('منع المتصفح الرفع: أضف عنوان الموقع إلى قواعد CORS للحاوية (R2 ← الحاوية ← Settings ← CORS Policy، والصق docs/r2-cors.json).');
      }
      if (!put.ok) throw new Error(`رفض التخزين الملف (${put.status}).`);
      await timedFetch('/api/r2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ action: 'delete', url: signed.publicUrl }),
      });
      setTestResult('نجح: الرفع من المتصفح إلى R2 يعمل (المفاتيح وCORS سليمان).');
    } catch (err: any) {
      setTestResult(`فشل: ${err?.message || 'سبب غير معروف.'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">حالة الموقع الآن</h3>
          <p className="text-sm text-stone-600 dark:text-stone-400">فحص حيّ لكل جزء من الموقع، وما تفعله إن كان معطّلاً.</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} aria-hidden="true" />
          إعادة الفحص
        </button>
      </div>

      <ul className="space-y-2">
        {checks.map((check) => (
          <li key={check.id} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800">
            <span className="mt-0.5 shrink-0">{ICON[check.state]}</span>
            <div className="min-w-0 space-y-1">
              <p className="font-semibold text-stone-900 dark:text-stone-100">{check.name}</p>
              <p className="text-sm text-stone-700 dark:text-stone-300">{check.detail}</p>
              {check.fix && <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">الحل: {check.fix}</p>}
            </div>
          </li>
        ))}
        {running && checks.length === 0 && (
          <li className="flex items-center gap-3 p-3 text-stone-600 dark:text-stone-400">
            {ICON.checking} جارٍ الفحص...
          </li>
        )}
      </ul>

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={testUpload}
          disabled={testing}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm disabled:opacity-60"
        >
          {testing && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          جرّب الرفع الآن
        </button>
        {testResult && (
          <p role="status" className={`text-sm font-semibold ${testResult.startsWith('نجح') ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'}`}>
            {testResult}
          </p>
        )}
      </div>
    </div>
  );
};
