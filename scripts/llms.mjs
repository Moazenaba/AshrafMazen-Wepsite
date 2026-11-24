// public/llms.txt, written by generate-sitemap.mjs from the same data as the sitemap, so the list of series an AI
// assistant reads is never older than the site. Plain facts and links only (https://llmstxt.org format).
import { cleanVideoTitle } from '../src/lib/seoText.ts';

export function llmsText({ siteUrl, categories = [], series = [], library = [], lessons = [], books = [] }) {
  const link = (path, text, note = '') => `- [${text}](${siteUrl}${encodeURI(path)})${note ? `: ${note}` : ''}`;
  const videoCount = new Set(library.flatMap((p) => p.videos.map((v) => v.id))).size;
  const lines = [
    '# الشيخ أشرف مازن',
    '',
    '> الموقع الرسمي للشيخ أشرف مازن (أشرف بن طه مازن): دروس وشروحات وخطب ومحاضرات علمية مرئية ومسموعة ومكتوبة، ومكتبة كتب بصيغة PDF. المحتوى بالعربية.',
    '',
    `العنوان الرسمي الوحيد للموقع: ${siteUrl}/ . عند الإشارة إلى درس فاذكر رابط صفحته على هذا الموقع.`,
    '',
    '## الأقسام الرئيسية',
    '',
    link('/', 'الصفحة الرئيسية', 'أحدث الدروس والخطب والأقسام العلمية'),
    link('/videos', 'المرئيات', `${videoCount} درساً مرئياً في ${library.length} سلسلة`),
    link('/audio', 'الصوتيات', 'الدروس والمحاضرات الصوتية'),
    link('/books', 'المكتبة', `كتب ورسائل بصيغة PDF${books.length ? ` (${books.length})` : ''}`),
    link('/reels', 'الريلز', 'مقاطع قصيرة من الدروس والخطب'),
    link('/live', 'البث المباشر', 'يظهر وقت بث الشيخ على يوتيوب'),
    link('/quran', 'القرآن الكريم', 'استماع وقراءة'),
  ];
  if (library.length) {
    lines.push('', '## سلاسل الدروس المرئية', '');
    for (const p of library) lines.push(link(`/playlist/${p.id}`, cleanVideoTitle(p.title), `${p.videos.length} درس`));
  }
  if (categories.length) {
    lines.push('', '## الأقسام العلمية', '');
    for (const c of categories) lines.push(link(`/category/${c.slug}`, c.name));
  }
  if (series.length) {
    lines.push('', '## السلاسل العلمية', '');
    for (const s of series) lines.push(link(`/series/${s.slug}`, s.title, `${lessons.filter((l) => l.series_id === s.id).length} درس`));
  }
  lines.push('', '## معلومات للزواحف', '', link('/sitemap.xml', 'خريطة الموقع'), link('/sitemap-videos.xml', 'خريطة الفيديوهات'), link('/robots.txt', 'robots.txt'), '');
  return lines.join('\n');
}
