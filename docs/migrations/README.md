# ملفات قاعدة البيانات (Supabase)

تُشغَّل في **Supabase ← SQL Editor**، وكلها آمنة عند إعادة تشغيلها (idempotent).

| الترتيب | الملف | ما يفعله |
|---|---|---|
| 1 | `2026-11-04-hardening-and-contributions.sql` | يقفل جدول `admin_users` القديم (كان مكشوفاً)، وينشئ جدول `submissions` لطلبات الزوار مع صلاحياتها وسقف ٥٠٠ طلب منتظر |
| 2 | `2026-11-04-analytics.sql` | جداول ودوال الإحصائيات: من على الموقع الآن، والمشاهدات، وساعات المتابعة، وكل محتوى على حدة |

**الجداول الأساسية** (`categories` و`series` و`lessons` و`admins` و`site_settings` و`social_links` ودالتا `is_admin` و`increment_lesson_views`) أُنشئت في المرحلة الأولى للمشروع ولا ملف لها هنا. لو أنشأت مشروع Supabase جديداً من الصفر فستحتاج إنشاءها أولاً (راجع الأعمدة في `src/types.ts`).

## اختبار سريع بعد التشغيل

```bash
npm run health
```

يجب أن تكون كل النتائج `PASS`، وخصوصاً بنود «protected from visitors».

## جدول `admin_users`

جدول قديم (من خادم Express محذوف) فيه عمود `password` وصف واحد. الموقع **لا يستخدمه**، والملف الأول يقفله. الأفضل حذفه نهائياً بعد أن تتأكد أنك لا تحتاجه:

```sql
drop table public.admin_users;
```
