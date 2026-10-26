# موقع الشيخ أشرف مازن - الربط مع Supabase

موقع علمي ودعوي متكامل لعرض الدروس والمحاضرات والسلاسل العلمية للشيخ أشرف مازن، مع لوحة تحكم كاملة للمشرف.

---

## 1. إعداد المتغيرات البيئية (Environment Variables)

يتم تشغيل المشروع بالاتصال المباشر مع Supabase عبر مكتبة `@supabase/supabase-js`.
يتم تمرير المتغيرات البيئية عبر ملف `.env` أو من خلال لوحة المتغيرات الخاصة بالاستضافة، ولا يتم وضع أي مفاتيح سرية (Service Role Keys) في الكود نهائياً:

```env
# رابط مشروع Supabase (بدون مسار /rest/v1 وبدون شرطة مائلة نهائية)
VITE_SUPABASE_URL="https://uzdgvdovssrvaewfewkx.supabase.co"

# المفتاح العام القابل للنشر (Publishable / Anon Key)
VITE_SUPABASE_ANON_KEY="sb_publishable_..."
```

> **ملاحظة أمنية**:
> - لا يُطلب ولا يُستخدم أي مفتاح `service_role` سري داخل الواجهة الأمامية.
> - يتم حماية البيانات والعمليات بواسطة سياسات الأمان على مستوى الصفوف (Row Level Security - RLS).

---

## 2. هيكل الجداول في قاعدة البيانات (Database Schema)

يتوقع المشروع وجود الجداول التالية في قاعدة بيانات Supabase:

### أ. جدول الأقسام الشرعية (`categories`)
- `id` (uuid or text, primary key)
- `name` (text, not null) - اسم القسم الشرعي (مثل: التفسير، الفقه، العقيدة)
- `slug` (text, unique, not null) - الرابط اللطيف
- `description` (text, nullable) - وصف تعريفي بالقسم
- `color` (text, default 'emerald') - معرف اللون التنسيقي
- `icon` (text, nullable) - اسم الأيقونة (BookOpen, Bookmark, Sparkles, Layers)
- `sort_order` (integer, default 0) - ترتيب العرض

### ب. جدول السلاسل العلمية (`series`)
- `id` (uuid or text, primary key)
- `category_id` (foreign key to `categories.id`, not null)
- `title` (text, not null) - عنوان السلسلة العلمية
- `slug` (text, unique, not null) - الرابط اللطيف
- `description` (text, nullable) - وصف محتوى السلسلة
- `sort_order` (integer, default 0) - ترتيب العرض
- `created_at` (timestamp with time zone)

### ج. جدول الدروس (`lessons`)
- `id` (uuid or text, primary key)
- `series_id` (foreign key to `series.id`, not null)
- `lesson_number` (integer, not null) - رقم الدرس في السلسلة
- `title` (text, not null) - عنوان الدرس
- `youtube_url` (text, nullable) - رابط المقطع على يوتيوب
- `audio_url` (text, nullable) - رابط الملف الصوتي
- `transcript` (text, nullable) - النص المفرغ / قراءة الدرس
- `status` (text, default 'draft') - حالة الدرس (`'published'` أو `'draft'`)
- `published_at` (timestamp with time zone, nullable) - تاريخ ووقت النشر (يُحدد تلقائياً عند النشر)
- `created_at` (timestamp with time zone, default now())

### د. جدول المشرفين (`admins`)
- `user_id` (uuid, primary key, references `auth.users.id`)
> يتم التحقق من وجود المستخدم المسجل دخوله في هذا الجدول قبل منحه صلاحيات الدخول للوحة التحكم (`/admin`).

---

## 3. مساحة التخزين للملفات الصوتية (Storage Bucket)

- **اسم الحاوية**: `audio`
- يُستخدم لرفع المقاطع الصوتية بصيغ (`mp3`, `m4a`, `wav`, `ogg`).
- يتم إنشاء أسماء ملفات فريدة ونظيفة باستخدام UUID مع اللاحقة الأصلية.
- يدعم التطبيق كذلك وضع روابط صوتية خارجية مباشرة دون رفع.

---

## 4. نظام المصادقة والأمان (Admin Auth)

- تسجيل الدخول إلى `/admin` يتم عبر `supabase.auth.signInWithPassword`.
- التحقق الفوري من صلاحية المستخدم عبر جدول `admins`.
- حماية الدخول بنظام تأمين: قفل المحاولات بعد 5 محاولات خاطئة لمدة 60 ثانية.
- استعادة كلمة المرور عبر البريد الإلكتروني عبر المسار المخصص `/admin/reset-password`، مع اشتراط كلمة مرور قوية (10 خانات على الأقل تحتوي أحرفاً وأرقاماً).
- إمكانية تغيير كلمة المرور للمشرف مباشرة من داخل لوحة التحكم.
- لا توجد أي روابط علنية للمسار `/admin` أو استعادة كلمة المرور في صفحات الموقع العامة حرصاً على الخصوصية.

---

## 5. معالجة الأخطاء باللغة العربية

- تترجم كافة أخطاء Supabase إلى رسائل واضحة وسلسة باللغة العربية (أخطاء الشبكة، عدم توفر الصلاحية، تكرار الرابط slug).
- في حالة نقص في تهيئة الجداول أو مساحة التخزين، تظهر رسالة لطيفة: **"إعداد قاعدة البيانات غير مكتمل"** مع الاحتفاظ بالتفاصيل البرمجية داخل نافذة المطورين (Console) فقط.
