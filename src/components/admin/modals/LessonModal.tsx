import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Video, Headphones, FileText, Check, Loader2 } from 'lucide-react';
import { type Category, type Series, type Lesson, type LessonStatus, type LessonChapter } from '../../../types';
import { parseChaptersText, formatChaptersText } from '../../../utils/chapters';
import { uploadAudioFile } from '../../../services/dataService';
import { getYouTubeId } from '../../../lib/youtube';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    series_id: string;
    lesson_number: number;
    title: string;
    youtube_url: string;
    audio_url: string;
    transcript: string;
    chapters: LessonChapter[];
    featured: boolean;
    status: LessonStatus;
  }) => Promise<void>;
  seriesList: Series[];
  categories: Category[];
  initialData?: Lesson | null;
  // A new lesson's starting values (for example from a visitor's suggestion); ignored when editing
  prefill?: Partial<Lesson> | null;
  // Every lesson, to number a new one after the last of its series and to refuse a number already taken
  lessons?: Pick<Lesson, 'id' | 'series_id' | 'lesson_number'>[];
}

// The number after the last lesson of a series (1 for an empty series)
const nextLessonNumber = (lessons: Pick<Lesson, 'series_id' | 'lesson_number'>[], seriesId: string) =>
  lessons.filter((l) => l.series_id === seriesId).reduce((max, l) => Math.max(max, Number(l.lesson_number) || 0), 0) + 1;

export const LessonModal: React.FC<LessonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  seriesList,
  categories,
  initialData,
  prefill = null,
  lessons = [],
}) => {
  const [seriesId, setSeriesId] = useState('');
  const [lessonNumber, setLessonNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioInputType, setAudioInputType] = useState<'url' | 'file'>('url');
  const [audioUrl, setAudioUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [chaptersText, setChaptersText] = useState('');
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<LessonStatus>('published');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setSeriesId(initialData.series_id);
      setLessonNumber(initialData.lesson_number);
      setTitle(initialData.title);
      setYoutubeUrl(initialData.youtube_url || '');
      setAudioUrl(initialData.audio_url || '');
      setAudioInputType('url');
      setTranscript(initialData.transcript || '');
      setChaptersText(formatChaptersText(initialData.chapters));
      setFeatured(Boolean(initialData.featured));
      setStatus(initialData.status);
    } else {
      const firstSeries = prefill?.series_id || seriesList[0]?.id || '';
      setChaptersText('');
      setFeatured(false);
      setSeriesId(firstSeries);
      setLessonNumber(nextLessonNumber(lessons, firstSeries));
      setTitle(prefill?.title || '');
      setYoutubeUrl(prefill?.youtube_url || '');
      setAudioUrl(prefill?.audio_url || '');
      setAudioInputType('url');
      setTranscript(prefill?.transcript || '');
      setStatus(prefill?.status || 'published');
    }
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isOpen, seriesList, prefill]);

  if (!isOpen) return null;

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const allowed = ['mp3', 'm4a', 'wav', 'ogg'];
    if (!allowed.includes(extension)) {
      setError('صيغة الملف غير مدعومة. يرجى اختيار ملف صوتي بصيغة (mp3, m4a, wav, ogg).');
      return;
    }

    try {
      setUploadingAudio(true);
      const publicUrl = await uploadAudioFile(file);
      setAudioUrl(publicUrl);
    } catch (err: any) {
      setError(err.message || 'فشل رفع الملف الصوتي');
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('يرجى إدخال عنوان الدرس');
      return;
    }
    if (!seriesId) {
      setError('يرجى اختيار السلسلة العلمية');
      return;
    }
    const number = Number(lessonNumber) || 1;
    const taken = lessons.find((l) => l.series_id === seriesId && Number(l.lesson_number) === number && l.id !== initialData?.id);
    if (taken) {
      setError(`رقم الدرس ${number} مستخدم في هذه السلسلة. الرقم التالي المتاح: ${nextLessonNumber(lessons, seriesId)}.`);
      return;
    }
    if (youtubeUrl.trim() && !getYouTubeId(youtubeUrl)) {
      setError('رابط يوتيوب غير صحيح. الصق رابط الفيديو كما يظهر في يوتيوب (youtube.com/watch?v=... أو youtu.be/...).');
      return;
    }
    if (status === 'published' && !youtubeUrl.trim() && !audioUrl.trim() && !transcript.trim()) {
      setError('لا يمكن نشر درس بلا فيديو ولا صوت ولا تفريغ. أضف واحداً منها، أو احفظه مسودة.');
      return;
    }

    try {
      setLoading(true);
      await onSave({
        series_id: seriesId,
        lesson_number: number,
        title: title.trim(),
        youtube_url: youtubeUrl.trim(),
        audio_url: audioUrl.trim(),
        transcript: transcript.trim(),
        chapters: parseChaptersText(chaptersText),
        featured,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الدرس');
    } finally {
      setLoading(false);
    }
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4 sticky top-0 bg-white dark:bg-stone-900 z-10">
          <div>
            <h3 className="font-amiri text-2xl font-bold text-stone-900 dark:text-stone-100">
              {initialData ? 'تعديل الدرس' : 'إضافة درس جديد'}
            </h3>
            <p className="text-xs text-stone-500">
              أدخل بيانات الدرس، روابط التسجيل الصوتي والمرئي والتفريغ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Series & Lesson Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                السلسلة العلمية <span className="text-red-500">*</span>
              </label>
              {seriesList.length === 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
                  تنبيه: لا توجد سلاسل مضافة حتى الآن. يرجى إضافة سلسلة علمية أولاً لتتمكن من إدراج الدروس فيها.
                </div>
              ) : (
                <select
                  required
                  value={seriesId}
                  onChange={(e) => {
                    setSeriesId(e.target.value);
                    // A new lesson follows the last lesson of the series it is moved to
                    if (!initialData) setLessonNumber(nextLessonNumber(lessons, e.target.value));
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {categoryMap.get(s.category_id) ? `[${categoryMap.get(s.category_id)}] ` : ''}
                      {s.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                رقم الدرس <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={lessonNumber}
                onChange={(e) => setLessonNumber(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Lesson Title */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              عنوان الدرس <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: باب فضل التوحيد وما يكفر من الذنوب..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-amiri text-base font-bold"
            />
          </div>

          {/* YouTube Video URL */}
          <div>
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              رابط يوتيوب (مرئي)
            </label>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
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
                  onClick={() => setAudioInputType('url')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    audioInputType === 'url'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  رابط URL
                </button>
                <button
                  type="button"
                  onClick={() => setAudioInputType('file')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    audioInputType === 'file'
                      ? 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-amber-300 shadow-xs'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  رفع ملف من الجهاز
                </button>
              </div>
            </div>

            {audioInputType === 'url' ? (
              <div className="relative">
                <input
                  type="url"
                  value={audioUrl.startsWith('data:') ? '' : audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
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
                  onChange={handleAudioFileUpload}
                  disabled={uploadingAudio}
                  className="w-full text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-800 file:text-white hover:file:bg-emerald-700 cursor-pointer disabled:opacity-50"
                />

                {uploadingAudio && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>جاري رفع الملف الصوتي إلى التخزين السحابي (Cloudflare R2)...</span>
                  </div>
                )}

                {audioUrl && !uploadingAudio && (
                  <div className="p-3 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <Check className="w-4 h-4" />
                      <span>تم حفظ رابط الملف الصوتي بنجاح:</span>
                    </div>
                    <p className="font-mono text-xs text-stone-600 dark:text-stone-300 truncate" dir="ltr">
                      {audioUrl}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transcript */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                <span>التفريغ النصي المكتوب</span>
              </label>
              <span className="text-xs text-stone-400">
                (يمكن كتابة نص تجريبي للمعاينة)
              </span>
            </div>
            <textarea
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="اكتب تفريغ الدرس هنا لمساعدة طالب العلم على القراءة والمتابعة..."
              className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none font-amiri text-base leading-relaxed"
            />
          </div>

          {/* Chapters: one per line, so the visitor can jump to a point in the lesson */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="lesson-chapters" className="font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-700 dark:text-amber-400" />
                <span>فصول الدرس</span>
              </label>
              <span className="text-xs text-stone-500 dark:text-stone-400">(كل فصل في سطر: ٠٠:٠٠ عنوان الفصل)</span>
            </div>
            <textarea
              id="lesson-chapters"
              rows={4}
              dir="auto"
              value={chaptersText}
              onChange={(e) => setChaptersText(e.target.value)}
              placeholder={'00:00 المقدمة\n05:30 الشرح الأول\n1:12:00 الخاتمة'}
              className="w-full px-4 py-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none tabular-nums text-base leading-relaxed"
            />
          </div>

          {/* Featured: this lesson is shown in the "اخترنا لك" block on the home page */}
          <label className="flex items-center gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="w-5 h-5 accent-emerald-800"
            />
            <span className="font-semibold text-stone-700 dark:text-stone-300">عرض هذا الدرس في "اخترنا لك" بالصفحة الرئيسية</span>
          </label>

          {/* Status (Draft vs Published) */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700">
            <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-2">
              حالة الدرس
            </label>
            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                  className="w-4 h-4 text-emerald-700 focus:ring-emerald-700"
                />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  منشور (يظهر للزوار في الموقع)
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-600"
                />
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  مسودة (خاص بالإدارة فقط)
                </span>
              </label>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              ملاحظة: عند تحويل الدرس إلى «منشور» يتم تسجيل تاريخ ووقت النشر تلقائياً.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || seriesList.length === 0}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الدرس'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
