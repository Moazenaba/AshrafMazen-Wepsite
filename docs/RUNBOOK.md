# دليل التشغيل: ماذا أفعل عندما يفشل فحص المراقبة

يعمل الفحص (`scripts/smoke-test.mjs`) كل نصف ساعة داخل مهمة `Sync YouTube and check the site`. عند الفشل تفشل المهمة ويصلك بريد من GitHub،
ويظهر السبب أيضاً في «سجل الأخطاء» بتبويب «صحة الموقع والأخطاء». الأهداف: توفر الصفحة الرئيسية و`/api/site` ٩٩٫٥٪ شهرياً، ونسبة أخطاء الدوال أقل من ١٪.

| سطر `FAIL` | معناه | ما أفعله |
|---|---|---|
| `page /…` | صفحة لا تعطي هيكل التطبيق (`id="root"`) | افتح الصفحة؛ إن كانت 404 راجع `rewrites` في `vercel.json`، وإن كان النشر فاشلاً راجع Vercel ← Deployments ← آخر نشر |
| `home page has a title` | الصفحة الرئيسية بلا `<title>` | غالباً بناء ناقص: أعد النشر، وراجع `npm run build` محلياً |
| `security headers on /` | غابت ترويسة `Content-Security-Policy` أو `Strict-Transport-Security` | راجع قسم `headers` في `vercel.json` ثم أعد النشر. انظر `docs/TROUBLESHOOTING.md` |
| `sitemap.xml` | الخريطة غير موجودة أو أقل من ١٠٠ عنوان | شغّل `npm run sitemap` ثم أعد النشر؛ تأكد أن البناء لم يفشل في قراءة البيانات |
| `robots.txt` | الملف ناقص سطر `Sitemap:` | أعد توليده بـ `npm run sitemap` |
| `API /api/site has categories and lessons` | الدالة لا تجيب أو القوائم فارغة | راجع سجل الدالة في Vercel، ثم `SUPABASE_URL` و`SUPABASE_ANON_KEY` في متغيرات البيئة، ثم حالة Supabase |
| `API /api/live answers a yes or no` | دالة البث لا تعطي `live: true/false` | راجع سجل الدالة؛ الموقع يعمل بدونها (لا يظهر شريط البث) |
| `API /api/youtube-library` | قائمة قوائم التشغيل فارغة | راجع سجل الدالة؛ الموقع يعرض المكتبة المحفوظة في المستودع إلى أن تعود |
| `API /api/r2 refuses visitors` | الدالة ردّت على زائر بغير 403/501 | **أمان**: راجع `api/r2.ts` فوراً وتأكد أن التحقق من الأدمن يسبق كل عملية |
| `API /api/r2 serves only the site's own folders` | الدالة قدّمت ملفاً خارج مجلدات الموقع | **أمان**: راجع `PUBLIC_FOLDERS` في `api/r2.ts` |
| `API /api/submit …` | دالة طلبات الزوار لا تردّ كما يجب | راجع سجل الدالة و`SUPABASE_SERVICE_ROLE_KEY` في Vercel |

بعد الإصلاح شغّل يدوياً: `node scripts/smoke-test.mjs https://ashrafmazen.com` وانتظر `ALL PASSED`.

## قبل الدمج (Before merging)

شغّل فحوص المتصفح القراءة-فقط على عنوان المعاينة (Vercel preview) قبل دمج أي طلب سحب:

```
E2E_BASE_URL=<عنوان المعاينة> npm run e2e:live
```

وفحوص المتصفح المحلية (بيانات وهمية، بلا شبكة): `npm run e2e`.

## إعادة بناء قاعدة البيانات من الصفر (Rebuilding the database from nothing)

1. شغّل `docs/schema/schema.sql` في Supabase SQL Editor (يُنشأ بالأمر `npm run schema`).
2. شغّل كل ملف في `docs/migrations/` بالترتيب المذكور في README هناك.
3. شغّل `npm run health` وانتظر أن تكون كل البنود PASS.

## استرجاع المحتوى (Restoring content)

Supabase ← Database ← Backups (OWNER-07: تأكد أن النسخ الاحتياطية موجودة وجرّب استرجاع واحدة في مشروع تجريبي). وللقوائم الكبيرة (الكتب، الفصول والصور، إعدادات يوتيوب) زر «استرجاع النسخة السابقة» في تبويب «صحة الموقع والأخطاء».
