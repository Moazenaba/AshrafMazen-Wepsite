// Development only (route /dev/admin, never built into the production site): shows the admin panels with
// made-up data, so their layout and behaviour can be checked without an admin login or a database.
// It replaces the Supabase client's methods in this tab only; nothing is read from or written to the real database.
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { StatsPanel } from '../components/admin/StatsPanel';
import { SubmissionsManager } from '../components/admin/SubmissionsManager';
import { YoutubeManager } from '../components/admin/YoutubeManager';
import { SystemStatus } from '../components/admin/SystemStatus';
import { BooksManager } from '../components/admin/BooksManager';

const today = new Date();
const day = (back: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
};

const STATS = {
  live: 7,
  visitors_today: 64,
  visitors_7d: 412,
  visitors_30d: 1630,
  totals: { pageviews: 9120, views_video: 2410, views_audio: 380, views_read: 150, seconds_video: 412000, seconds_audio: 73000, seconds_read: 21000 },
  daily: Array.from({ length: 30 }, (_, i) => ({ day: day(29 - i), metric: 'views_video', value: 40 + ((i * 7) % 55) })).concat(
    Array.from({ length: 30 }, (_, i) => ({ day: day(29 - i), metric: 'seconds_video', value: 6000 + ((i * 911) % 9000) }))
  ),
  daily_visitors: Array.from({ length: 30 }, (_, i) => ({ day: day(29 - i), visitors: 20 + ((i * 13) % 60) })),
  items: [
    { key: 'yt:KN3BR-84F5w', views: 320, video_seconds: 51000, audio_seconds: 0, read_seconds: 0 },
    { key: 'lesson:9bd0e144-91f6-42b2-a9db-b0e0d7348c74', views: 210, video_seconds: 30000, audio_seconds: 9000, read_seconds: 4000 },
    { key: 'book:demo-book-0001', views: 55, video_seconds: 0, audio_seconds: 0, read_seconds: 8000 },
  ],
};

const SUBMISSIONS = [
  { id: '1', kind: 'book', title: 'شرح كتاب التوحيد (مقترح)', url: 'https://example.com/tawheed.pdf', author: 'مؤلف تجريبي', details: 'كتاب مفيد في العقيدة أقترح إضافته.', target: '', contact: 'name@example.com', status: 'pending', admin_note: '', created_at: new Date().toISOString(), reviewed_at: null },
  { id: '2', kind: 'correction', title: 'خطأ في عنوان درس', url: '', author: '', details: 'عنوان الدرس الثالث فيه خطأ إملائي في كلمة التوسل.', target: 'http://localhost:3000/lesson/abc', contact: '', status: 'pending', admin_note: '', created_at: new Date().toISOString(), reviewed_at: null },
  { id: '3', kind: 'removal', title: 'طلب إزالة', url: '', author: '', details: 'أرجو إزالة هذا المقطع لأن الرابط لا يعمل.', target: '', contact: '', status: 'pending', admin_note: '', created_at: new Date().toISOString(), reviewed_at: null },
];

type Rows = Record<string, unknown>[];
const rowsFor = (table: string): Rows => {
  if (table === 'submissions') return SUBMISSIONS;
  if (table === 'categories') return [{ id: 'c1', name: 'العقيدة', slug: 'aqeedah', sort_order: 1, color: 'emerald', icon: 'BookOpen' }];
  if (table === 'series') return [];
  return [];
};

// A query object that can be chained and awaited, like the real client's
function query(table: string) {
  let rows = rowsFor(table);
  const result = () => ({ data: rows, error: null, count: rows.length });
  const q: any = {
    select: () => q,
    order: () => q,
    limit: () => q,
    eq: (col: string, value: unknown) => {
      rows = rows.filter((r) => r[col] === value);
      return q;
    },
    update: () => q,
    delete: () => q,
    insert: () => q,
    upsert: () => q,
    maybeSingle: () => Promise.resolve({ data: table === 'site_settings' ? { value: '{}' } : rows[0] ?? null, error: null }),
    then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => Promise.resolve(result()).then(resolve, reject),
  };
  return q;
}

let installed = false;
function install() {
  if (installed) return;
  installed = true;
  const client = supabase as any;
  client.from = (table: string) => query(table);
  client.rpc = (name: string) => Promise.resolve({ data: name === 'admin_stats' ? STATS : null, error: null });
  client.auth.getSession = () => Promise.resolve({ data: { session: { access_token: 'fake-token' } }, error: null });
  const realFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.endsWith('/api/r2') && init?.method === 'POST') {
      const action = JSON.parse(String(init.body || '{}')).action;
      const body = action === 'status' ? { configured: true, bucket: 'sheikh-ashraf-mazen', publicAddress: false, write: true, remove: true } : { error: 'harness' };
      return Promise.resolve(new Response(JSON.stringify(body), { status: action === 'status' ? 200 : 400 }));
    }
    return realFetch(input, init);
  };
}

const TABS = ['stats', 'requests', 'videos', 'system', 'books'] as const;

export const AdminHarness: React.FC = () => {
  install();
  const [tab, setTab] = useState<(typeof TABS)[number]>('stats');
  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-6 space-y-4">
      <p className="text-sm text-amber-800 dark:text-amber-300 font-semibold">معاينة تطويرية ببيانات وهمية. لا علاقة لها بقاعدة البيانات الحقيقية.</p>
      <div className="flex gap-2 overflow-x-auto border-b border-stone-200 dark:border-stone-800">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-3 px-4 font-semibold text-sm border-b-2 whitespace-nowrap ${tab === t ? 'border-emerald-800 text-emerald-800 dark:border-amber-400 dark:text-amber-300' : 'border-transparent text-stone-500'}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'stats' && <StatsPanel lessons={[{ id: '9bd0e144-91f6-42b2-a9db-b0e0d7348c74', title: 'الأمن الفكري استقرار مجتمعي ووطني' }]} />}
      {tab === 'requests' && <SubmissionsManager />}
      {tab === 'videos' && <YoutubeManager />}
      {tab === 'system' && <SystemStatus />}
      {tab === 'books' && <BooksManager categories={[]} />}
    </div>
  );
};
