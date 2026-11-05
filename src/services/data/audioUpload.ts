// Uploading a lesson's recording to Cloudflare R2 (folder "audio/").
import { uploadToR2 } from '../r2';

const ALLOWED_EXTENSIONS = ['mp3', 'm4a', 'wav', 'ogg'];

export async function uploadAudioFile(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف صوتي.');
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new Error('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي بصيغة (mp3, m4a, wav, ogg).');
  }
  return uploadToR2(file, 'audio');
}
