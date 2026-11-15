// Uploading a lesson's recording to Cloudflare R2 (folder "audio/").
import { uploadToR2 } from '../r2';
import { checkFile } from '../../constants/fileRules';

export async function uploadAudioFile(file: File): Promise<string> {
  if (!file) throw new Error('لم يتم تحديد أي ملف صوتي.');
  const problem = checkFile('audio', file.name, file.size);
  if (problem) throw new Error(problem);
  return uploadToR2(file, 'audio');
}
