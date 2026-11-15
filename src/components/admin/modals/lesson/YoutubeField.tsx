// Lesson form: The lesson's YouTube link.
import { Video } from 'lucide-react';
import type { FormProps } from './lessonForm';

export const YoutubeField = ({ form, update }: FormProps) => {
  return (
    <>
        {/* YouTube Video URL */}
        <div>
          <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
            رابط يوتيوب (مرئي)
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="url"
              autoComplete="off"
              value={form.youtubeUrl}
              onChange={(e) => update({ youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... أو https://youtu.be/..."
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono text-xs"
              dir="ltr"
            />
            <Video className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          <p className="text-xs text-stone-400 mt-1">
            يتم تحويل أي صيغة رابط يوتيوب تلقائياً لمشغل مدمج مناسب.
          </p>
        </div>

    </>
  );
};
