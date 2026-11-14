// Uploading a lesson's recording to Cloudflare R2 (folder "audio/").
import { uploadToR2 } from '../r2';

// The same list api/r2.ts accepts. aac: iPhone recordings; opus: WhatsApp voice notes.
export const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'aac', 'wav', 'ogg', 'opus'];

export async function uploadAudioFile(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف صوتي.');
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!AUDIO_EXTENSIONS.includes(extension)) {
    throw new Error(`صيغة الملف (${extension ? `.${extension}` : 'بدون امتداد'}) غير مدعومة. الصيغ المقبولة: ${AUDIO_EXTENSIONS.join('، ')}.`);
  }
  return uploadToR2(file, 'audio');
}
