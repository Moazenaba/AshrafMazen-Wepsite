// Vercel serverless function: a visitor's suggestion, correction or removal request.
// Nobody signs in. The request is checked here, then saved as "pending" in the submissions table, and nothing on
// the site changes until an admin approves it from the admin's "الطلبات" tab.
//
//   POST /api/submit  { kind, title, url?, author?, details?, target?, contact?, website (must stay empty), t }
//
// Checks: size limits, links must be http(s), a hidden field bots fill in, a minimum time spent on the form,
// and a few requests per hour per address. The database enforces its own limits again (see the migration).

const KINDS = ['book', 'audio', 'video', 'correction', 'removal'] as const;
type Kind = (typeof KINDS)[number];

const LIMITS = { title: 200, url: 600, author: 200, details: 2000, target: 300, contact: 200 };
const PER_HOUR = 5;
const MIN_FORM_SECONDS = 4;

// Best effort: each server instance remembers its own recent senders
const recent = new Map<string, number[]>();

const send = (res: any, status: number, body: unknown) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).send(JSON.stringify(body));
};

const clean = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

function tooMany(ip: string): boolean {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  if (hits.length >= PER_HOUR) {
    recent.set(ip, hits);
    return true;
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) for (const key of recent.keys()) recent.delete(key);
  return false;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method-not-allowed' });

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  if (!supabaseUrl || !anonKey) return send(res, 503, { error: 'خدمة الاستقبال غير مُعدّة بعد.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // A bot fills every field, including the one people cannot see; pretend it worked
    if (clean(body.website, 50)) return send(res, 200, { ok: true });

    const kind = clean(body.kind, 20) as Kind;
    if (!KINDS.includes(kind)) return send(res, 400, { error: 'نوع الطلب غير معروف.' });

    const sentAt = Number(body.t);
    if (Number.isFinite(sentAt) && Date.now() - sentAt < MIN_FORM_SECONDS * 1000) {
      return send(res, 429, { error: 'تم إرسال النموذج بسرعة كبيرة. اقرأه ثم أعد المحاولة.' });
    }

    const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    if (tooMany(forwarded || req.socket?.remoteAddress || 'unknown')) {
      return send(res, 429, { error: 'وصلتَ للحد المسموح به من الطلبات هذه الساعة. حاول لاحقاً.' });
    }

    const row = {
      kind,
      title: clean(body.title, LIMITS.title),
      url: clean(body.url, LIMITS.url),
      author: clean(body.author, LIMITS.author),
      details: clean(body.details, LIMITS.details),
      target: clean(body.target, LIMITS.target),
      contact: clean(body.contact, LIMITS.contact),
    };

    if (row.title.length < 2) return send(res, 400, { error: 'اكتب عنواناً من حرفين على الأقل.' });
    if (row.url && !isHttpUrl(row.url)) return send(res, 400, { error: 'الرابط يجب أن يبدأ بـ http:// أو https://' });
    if (['book', 'audio', 'video'].includes(kind) && !row.url) return send(res, 400, { error: 'أضف رابط المادة المقترحة.' });
    if (['correction', 'removal'].includes(kind) && row.details.length < 5) {
      return send(res, 400, { error: 'اشرح المطلوب في جملة على الأقل.' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('submission rejected by the database:', response.status, text.slice(0, 300));
      return send(res, 502, {
        error: /row-level security|violates/i.test(text)
          ? 'الطلبات المنتظرة وصلت الحد الأقصى حالياً. حاول لاحقاً.'
          : 'تعذّر حفظ الطلب الآن. حاول مرة أخرى بعد قليل.',
      });
    }
    return send(res, 201, { ok: true });
  } catch (err) {
    console.error('submit function error:', err);
    return send(res, 500, { error: 'حدث خطأ غير متوقع. حاول مرة أخرى.' });
  }
}
