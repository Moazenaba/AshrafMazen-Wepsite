// Development only (route /dev/admin, never built into the production site): the whole admin area running on a
// made-up database kept in this tab's memory, so every screen and every rule (adding, editing, deleting, approving,
// uploading) can be tried without an admin login or the real database.
// It replaces the Supabase client's methods and the file storage calls in this tab only; nothing is read from or
// written to the real database or to Cloudflare R2. Reloading the page starts again from the sample data.
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { getSiteSettings } from '../services/dataService';
import { db, nextId, query, rpc, type Row } from '../test/fakeDatabase';
const r2 = (key: string) => `/api/r2?file=${encodeURIComponent(key)}`;

export const storageLog: string[] = [];
const logStorage = (line: string) => {
  storageLog.unshift(`${new Date().toLocaleTimeString('ar-EG')} — ${line}`);
  window.dispatchEvent(new Event('harness_storage'));
};


let installed = false;
function install() {
  if (installed) return;
  installed = true;
  const client = supabase as any;
  client.from = (table: string) => query(table);
  client.rpc = rpc;
  const user = { id: 'harness-admin', email: 'harness@example.test', user_metadata: { name: 'مشرف التجربة' } };
  client.auth.getSession = () => Promise.resolve({ data: { session: { access_token: 'fake-token', user } }, error: null });
  client.auth.getUser = () => Promise.resolve({ data: { user }, error: null });
  client.auth.signOut = () => Promise.resolve({ error: null });
  client.auth.updateUser = () => Promise.resolve({ data: { user }, error: null });

  // The file storage: signing an upload, deleting a file, the status check. Uploads go nowhere and are logged.
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/r2') && init?.method === 'POST') {
      const body = JSON.parse(String(init.body || '{}'));
      let reply: unknown = { error: 'harness' };
      if (body.action === 'status') reply = { configured: true, bucket: 'harness', publicAddress: false, write: true, remove: true };
      if (body.action === 'sign') {
        const folder = { pdf: 'library/files', cover: 'library/covers', audio: 'audio', logo: 'branding' }[body.kind as string] || 'other';
        const key = `${folder}/harness-${nextId()}.${String(body.filename).split('.').pop()}`;
        reply = { uploadUrl: `harness-upload://${key}`, publicUrl: r2(key), contentType: 'application/octet-stream' };
        logStorage(`رفع: ${key}`);
      }
      if (body.action === 'delete') {
        reply = { deleted: body.url };
        logStorage(`حذف: ${decodeURIComponent(String(body.url).split('file=')[1] || body.url)}`);
      }
      return Promise.resolve(new Response(JSON.stringify(reply), { status: body.action === 'sign' || body.action === 'delete' || body.action === 'status' ? 200 : 400 }));
    }
    return realFetch(input, init);
  };
  // The upload itself (XMLHttpRequest, for its progress): succeeds at once for the fake links above
  const open = XMLHttpRequest.prototype.open;
  const send = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __harness?: boolean }, method: string, url: string | URL, ...rest: any[]) {
    this.__harness = String(url).startsWith('harness-upload://');
    return (open as any).call(this, method, this.__harness ? 'data:,' : url, ...rest);
  };
  XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __harness?: boolean }, body?: any) {
    if (!this.__harness) return send.call(this, body);
    Object.defineProperty(this, 'status', { value: 200 });
    setTimeout(() => this.onload?.(new ProgressEvent('load') as any), 50);
  };
}

// Lets a test read the made-up database (window.__harnessDb) to check what a screen wrote
declare global {
  interface Window {
    __harnessDb?: Record<string, Row[]>;
  }
}

export const AdminHarness: React.FC = () => {
  install();
  window.__harnessDb = db;
  const [, bump] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onLog = () => bump((n) => n + 1);
    window.addEventListener('harness_storage', onLog);
    // The site header asked the real database for the settings before this page switched to the made-up one;
    // let that answer arrive, then read the settings again from here so the cached copy is the made-up one
    const timer = window.setTimeout(() => {
      getSiteSettings(true).finally(() => setReady(true));
    }, 1500);
    return () => {
      window.removeEventListener('harness_storage', onLog);
      window.clearTimeout(timer);
    };
  }, []);

  if (!ready) return <p className="max-w-6xl mx-auto px-4 py-10 text-stone-600">جارٍ تجهيز البيانات التجريبية...</p>;

  return (
    <div className="space-y-4">
      <p className="max-w-6xl mx-auto px-4 pt-4 text-sm text-amber-800 dark:text-amber-300 font-semibold">
        معاينة تطويرية: لوحة الإدارة كاملة على قاعدة بيانات وهمية في ذاكرة هذه الصفحة. لا شيء يصل إلى قاعدة البيانات الحقيقية أو إلى R2. إعادة
        تحميل الصفحة تعيد البيانات التجريبية.
      </p>
      <AdminDashboard admin={{ email: 'harness@example.test', name: 'مشرف التجربة', role: 'admin' }} onLogout={() => {}} />
      <section aria-label="سجل التخزين" className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="font-semibold text-stone-900 dark:text-stone-100">سجل التخزين (R2 وهمي)</h2>
        <ul id="harness-storage-log" className="text-sm text-stone-700 dark:text-stone-300 list-disc ps-6">
          {storageLog.length === 0 ? <li>لا شيء بعد</li> : storageLog.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      </section>
    </div>
  );
};
