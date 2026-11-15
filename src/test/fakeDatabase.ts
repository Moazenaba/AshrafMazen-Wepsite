// An in-memory stand-in for the Supabase client, shared by the /dev/admin harness and the tests.
import { supabase } from '../lib/supabase';


const today = new Date();
const day = (back: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - back);
  return d.toISOString().slice(0, 10);
};
const iso = (back: number) => new Date(Date.now() - back * 86400000).toISOString();
const r2 = (key: string) => `/api/r2?file=${encodeURIComponent(key)}`;

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
    { key: 'lesson:lesson-1', views: 210, video_seconds: 30000, audio_seconds: 9000, read_seconds: 4000 },
    { key: 'book:book-published', views: 55, video_seconds: 0, audio_seconds: 0, read_seconds: 8000 },
  ],
};

export type Row = Record<string, any>;

// ---------------------------------------------------------------- the sample database
export function sampleData(): Record<string, Row[]> {
  const books = [
    { id: 'book-published', title: 'كتاب منشور للتجربة', author: 'مؤلف', description: '', category_id: 'cat-aqeedah', file_url: r2('library/files/published.pdf'), cover_url: r2('library/covers/published.jpg'), pages: 120, sort_order: 1, status: 'published', published_at: iso(10), created_at: iso(10) },
    { id: 'book-draft', title: 'كتاب مسودة للتجربة', author: 'مؤلف', description: '', category_id: null, file_url: r2('library/files/draft.pdf'), cover_url: null, pages: null, sort_order: 2, status: 'draft', published_at: null, created_at: iso(2) },
  ];
  return {
    categories: [
      { id: 'cat-aqeedah', name: 'العقيدة', slug: 'aqeedah', description: '', sort_order: 1, color: 'emerald', icon: 'BookOpen' },
      { id: 'cat-khutab', name: 'الخطب', slug: 'khutab', description: '', sort_order: 2, color: 'amber', icon: 'BookOpen' },
      { id: 'cat-empty', name: 'قسم فارغ', slug: 'empty', description: '', sort_order: 3, color: 'sky', icon: 'BookOpen' },
    ],
    series: [
      { id: 'series-1', category_id: 'cat-aqeedah', title: 'شرح الأصول الثلاثة', slug: 'usul', description: '', sort_order: 1 },
      { id: 'series-empty', category_id: 'cat-khutab', title: 'سلسلة فارغة', slug: 'empty-series', description: '', sort_order: 2 },
    ],
    lessons: [
      { id: 'lesson-1', series_id: 'series-1', lesson_number: 1, title: 'الدرس الأول', youtube_url: 'https://www.youtube.com/watch?v=loVFoAlqeCc', audio_url: r2('audio/lesson-1.mp3'), transcript: '', status: 'published', published_at: iso(30), created_at: iso(30), views: 47 },
      { id: 'lesson-2', series_id: 'series-1', lesson_number: 2, title: 'الدرس الثاني (مسودة)', youtube_url: '', audio_url: '', transcript: 'نص الدرس', status: 'draft', published_at: null, created_at: iso(1), views: 0 },
    ],
    site_settings: [
      { key: 'banner_name', value: 'أبو عبد الرحمن أشرف بن طه بن مازن' },
      { key: 'banner_logo_url', value: r2('branding/old-logo.png') },
      { key: 'about_sheikh', value: 'نبذة' },
      { key: 'library_books', value: JSON.stringify(books) },
    ],
    social_links: [
      { id: 'social-1', platform: 'youtube', url: 'https://youtube.com/@x', sort_order: 0, is_active: true },
      { id: 'social-2', platform: 'facebook', url: 'https://facebook.com/x', sort_order: 1, is_active: true },
    ],
    submissions: [
      { id: 'sub-book', kind: 'book', title: 'شرح كتاب التوحيد (مقترح)', url: 'https://example.com/tawheed.pdf', author: 'مؤلف تجريبي', details: 'كتاب مفيد في العقيدة.', target: '', contact: 'name@example.com', status: 'pending', admin_note: '', created_at: iso(0), reviewed_at: null },
      { id: 'sub-video', kind: 'video', title: 'خطبة مقترحة', url: 'https://youtu.be/loVFoAlqeCc', author: '', details: '', target: '', contact: '', status: 'pending', admin_note: '', created_at: iso(0), reviewed_at: null },
      { id: 'sub-audio', kind: 'audio', title: 'محاضرة صوتية مقترحة', url: 'https://example.com/lecture.mp3', author: '', details: '', target: '', contact: '', status: 'pending', admin_note: '', created_at: iso(0), reviewed_at: null },
      { id: 'sub-fix', kind: 'correction', title: 'خطأ في عنوان درس', url: '', author: '', details: 'عنوان الدرس الأول فيه خطأ.', target: '/lesson/lesson-1', contact: '', status: 'pending', admin_note: '', created_at: iso(0), reviewed_at: null },
    ],
    admins: [{ user_id: 'harness-admin' }],
    content_stats: [],
  };
}

export const db: Record<string, Row[]> = sampleData();
let idCounter = 0;
export const nextId = () => ++idCounter;
const newId = (table: string) => `${table}-new-${nextId()}`;
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

// ---------------------------------------------------------------- a query builder like the real client's
export function query(table: string) {
  const rows = (db[table] ??= []);
  let op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  let payload: Row[] = [];
  let patch: Row = {};
  let conflict = 'id';
  let returning = false;
  let head = false;
  let single: 'one' | 'maybe' | null = null;
  let limitTo: number | null = null;
  const orders: { col: string; asc: boolean }[] = [];
  const filters: ((r: Row) => boolean)[] = [];

  const run = () => {
    const matching = () => rows.filter((r) => filters.every((f) => f(r)));
    let data: Row[] = [];
    if (op === 'select') {
      data = matching();
      for (const { col, asc } of [...orders].reverse()) {
        data = [...data].sort((a, b) => (a[col] === b[col] ? 0 : (a[col] ?? '') > (b[col] ?? '') ? (asc ? 1 : -1) : asc ? -1 : 1));
      }
      if (limitTo !== null) data = data.slice(0, limitTo);
    } else if (op === 'insert') {
      data = payload.map((r) => ({ id: newId(table), created_at: new Date().toISOString(), ...r }));
      rows.push(...data);
    } else if (op === 'update') {
      data = matching();
      data.forEach((r) => Object.assign(r, patch));
    } else if (op === 'delete') {
      data = matching();
      db[table] = rows.filter((r) => !data.includes(r));
    } else if (op === 'upsert') {
      data = payload.map((r) => {
        const existing = rows.find((x) => x[conflict] === r[conflict]);
        if (existing) return Object.assign(existing, r);
        const added = { ...r };
        rows.push(added);
        return added;
      });
    }
    const count = data.length;
    const out = head ? null : copy(data);
    if (single) {
      const first = out?.[0] ?? null;
      if (single === 'one' && !first) return { data: null, error: { message: 'no rows', code: 'PGRST116' }, count };
      return { data: first, error: null, count };
    }
    return { data: op === 'select' || returning ? out : null, error: null, count };
  };

  const q: any = {
    select: (_cols?: string, opts?: { head?: boolean }) => {
      if (op !== 'select') returning = true;
      if (opts?.head) head = true;
      return q;
    },
    insert: (r: Row | Row[]) => ((op = 'insert'), (payload = Array.isArray(r) ? r : [r]), q),
    upsert: (r: Row | Row[], opts?: { onConflict?: string }) => ((op = 'upsert'), (payload = Array.isArray(r) ? r : [r]), (conflict = opts?.onConflict || 'id'), q),
    update: (p: Row) => ((op = 'update'), (patch = p), q),
    delete: () => ((op = 'delete'), q),
    eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), q),
    neq: (c: string, v: unknown) => (filters.push((r) => r[c] !== v), q),
    in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), q),
    not: (c: string, operator: string, v: unknown) => (filters.push((r) => (operator === 'is' && v === null ? r[c] !== null && r[c] !== undefined : r[c] !== v)), q),
    ilike: (c: string, pattern: string) => {
      const needle = pattern.replace(/%/g, '').toLowerCase();
      filters.push((r) => String(r[c] ?? '').toLowerCase().includes(needle));
      return q;
    },
    order: (col: string, opts?: { ascending?: boolean }) => (orders.push({ col, asc: opts?.ascending !== false }), q),
    limit: (n: number) => ((limitTo = n), q),
    single: () => ((single = 'one'), Promise.resolve(run())),
    maybeSingle: () => ((single = 'maybe'), Promise.resolve(run())),
    then: (resolve: (v: unknown) => void, reject?: (e: unknown) => void) => Promise.resolve().then(run).then(resolve, reject),
  };
  return q;
}

export function rpc(name: string, args: Row = {}) {
  if (name === 'save_setting_if_unchanged') {
    const rows = (db.site_settings ??= []);
    const existing = rows.find((r) => r.key === args.p_key);
    if ((existing?.value ?? null) !== (args.p_previous ?? null)) return Promise.resolve({ data: false, error: null });
    if (existing) existing.value = args.p_next;
    else rows.push({ key: args.p_key, value: args.p_next });
    return Promise.resolve({ data: true, error: null });
  }
  if (name === 'admin_stats') return Promise.resolve({ data: STATS, error: null });
  if (name === 'published_books') {
    const library = JSON.parse(db.site_settings.find((r) => r.key === 'library_books')?.value || '[]');
    return Promise.resolve({ data: library.filter((b: Row) => b.status === 'published'), error: null });
  }
  return Promise.resolve({ data: null, error: null });
}


/** Points the Supabase client at the fake rows (client methods only; nothing else is touched). */
export function installFakeDatabase(rows?: Record<string, Row[]>) {
  if (rows) {
    for (const k of Object.keys(db)) delete db[k];
    Object.assign(db, copy(rows));
  }
  const client = supabase as any;
  client.from = (table: string) => query(table);
  client.rpc = rpc;
}

/** Back to the sample rows. */
export function resetFakeDatabase() {
  for (const k of Object.keys(db)) delete db[k];
  Object.assign(db, sampleData());
}
