// The one list of what may be uploaded: folder, extensions, size. api/r2.ts enforces it; every screen shows it.
// Plain JavaScript so the server function can import it with the ".js" extension (like nameFontList.js).
// aac: iPhone recordings; opus: WhatsApp voice notes. Videos: R2 takes a single upload of up to 5 GB.
export const FILE_RULES = {
  pdf: { folder: 'library/files', extensions: ['pdf'], maxMb: 200, type: 'application/pdf' },
  cover: { folder: 'library/covers', extensions: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 5, type: '' },
  audio: { folder: 'audio', extensions: ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus'], maxMb: 500, type: '' },
  logo: { folder: 'branding', extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 2, type: '' },
  hero: { folder: 'branding/hero', extensions: ['png', 'jpg', 'jpeg', 'webp'], maxMb: 8, type: '' },
  video: { folder: 'media/video', extensions: ['mp4', 'webm', 'mov', 'm4v'], maxMb: 4000, type: '' },
};

// For an <input type="file" accept="...">
export const acceptOf = (kind) => FILE_RULES[kind].extensions.map((e) => `.${e}`).join(',');

// For a hint under the button
export const describeRule = (kind) => `${FILE_RULES[kind].extensions.join('، ')} (حتى ${FILE_RULES[kind].maxMb} ميجابايت)`;

// An Arabic message saying what is wrong with the file, or null when it may be uploaded
export function checkFile(kind, name, size) {
  const rule = FILE_RULES[kind];
  if (!rule) return 'نوع الملف غير معروف.';
  const parts = String(name || '').split('.');
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : '';
  if (!rule.extensions.includes(extension)) {
    return `صيغة الملف (${extension ? `.${extension}` : 'بدون امتداد'}) غير مدعومة. الصيغ المقبولة: ${rule.extensions.join('، ')}.`;
  }
  if (Number(size) > rule.maxMb * 1024 * 1024) return `حجم الملف أكبر من ${rule.maxMb} ميجابايت.`;
  return null;
}
