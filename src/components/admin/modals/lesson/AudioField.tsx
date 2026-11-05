// Lesson form: The recording: a link, or a file uploaded to R2.
import React from 'react';
import { Link as LinkIcon, Headphones, Check, Loader2 } from 'lucide-react';
import type { FormProps } from './lessonForm';

export const AudioField = ({ form, update, uploading, onFile }: FormProps & { uploading: boolean; onFile: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <>
        {/* Audio (URL vs File) */}
        <div className="space-y-2 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
              <span>الملف الصوتي (مسموع)</span>
            </label>

            {/* Mode switch */}
            <div className="flex items-center gap-1 bg-stone-200 dark:bg-stone-700 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => update({ audioInputType: 'url' })}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  form.audioInputType === 'url'
                    ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                رابط URL
              </button>
              <button
                type="button"
                onClick={() => update({ audioInputType: 'file' })}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  form.audioInputType === 'file'
                    ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                رفع ملف من الجهاز
              </button>
            </div>
          </div>

          {form.audioInputType === 'url' ? (
            <div className="relative">
              <input
                type="url"
                value={form.audioUrl.startsWith('data:') ? '' : form.audioUrl}
                onChange={(e) => update({ audioUrl: e.target.value })}
                placeholder="https://example.com/audio/lesson-1.mp3"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono text-xs"
                dir="ltr"
              />
              <LinkIcon className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="file"
                accept=".mp3,.m4a,.wav,.ogg,audio/*"
                onChange={onFile}
                disabled={uploading}
                className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer disabled:opacity-50"
              />

              {uploading && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جاري رفع الملف الصوتي إلى التخزين السحابي (Cloudflare R2)...</span>
                </div>
              )}

              {form.audioUrl && !uploading && (
                <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <Check className="w-4 h-4" />
                    <span>تم حفظ رابط الملف الصوتي بنجاح:</span>
                  </div>
                  <p className="font-mono text-xs text-stone-600 dark:text-stone-300 truncate" dir="ltr">
                    {form.audioUrl}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

    </>
  );
};
