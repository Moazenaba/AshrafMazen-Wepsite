import { describe, expect, it } from 'vitest';
import { lesson } from '../../../../test/factories';
import { formFromLesson, newLessonForm, nextLessonNumber, toSaveData, validateLessonForm, type LessonFormState } from './lessonForm';

const existing = [
  { id: 'l1', series_id: 's1', lesson_number: 1 },
  { id: 'l2', series_id: 's1', lesson_number: 2 },
  { id: 'l9', series_id: 's2', lesson_number: 9 },
];

const valid = (over: Partial<LessonFormState> = {}): LessonFormState => ({
  ...newLessonForm(null, 's1', existing),
  title: 'عنوان',
  youtubeUrl: 'https://youtu.be/loVFoAlqeCc',
  ...over,
});

describe('nextLessonNumber', () => {
  it('follows the last lesson of the series', () => expect(nextLessonNumber(existing, 's1')).toBe(3));
  it('starts at 1 for an empty series', () => expect(nextLessonNumber(existing, 'empty')).toBe(1));
  it('only looks at the chosen series', () => expect(nextLessonNumber(existing, 's2')).toBe(10));
});

describe('newLessonForm', () => {
  it('numbers a new lesson after the last of its series', () => {
    expect(newLessonForm(null, 's1', existing).lessonNumber).toBe(3);
  });
  it('is published by default and starts empty', () => {
    const form = newLessonForm(null, 's1', existing);
    expect(form).toMatchObject({ status: 'published', title: '', youtubeUrl: '', featured: false });
  });
  it('takes the values of a visitor suggestion, and its series when it names one', () => {
    const form = newLessonForm({ title: 'مقترح', youtube_url: 'https://youtu.be/loVFoAlqeCc', status: 'draft', series_id: 's2' }, 's1', existing);
    expect(form).toMatchObject({ title: 'مقترح', status: 'draft', seriesId: 's2', lessonNumber: 10 });
  });
});

describe('formFromLesson', () => {
  it('writes the chapters back as text and starts the audio field on "link"', () => {
    const form = formFromLesson(lesson({ chapters: [{ seconds: 65, title: 'المقدمة' }], audio_url: 'https://x/a.mp3' }));
    expect(form.chaptersText).toBe('01:05 المقدمة');
    expect(form.audioInputType).toBe('url');
  });
});

describe('validateLessonForm', () => {
  it('accepts a complete lesson', () => expect(validateLessonForm(valid(), existing)).toBeNull());

  it('accepts a recording uploaded to the site (a site link, not a full address) and a full https link', () => {
    expect(validateLessonForm(valid({ audioUrl: '/api/r2?file=audio%2Fx.ogg' }), existing)).toBeNull();
    expect(validateLessonForm(valid({ audioUrl: 'https://example.com/a.mp3' }), existing)).toBeNull();
  });

  it('refuses an audio link that is neither', () => {
    expect(validateLessonForm(valid({ audioUrl: 'example.com/a.mp3' }), existing)).toMatch(/رابط الملف الصوتي/);
    expect(validateLessonForm(valid({ audioUrl: 'javascript:alert(1)' }), existing)).toMatch(/رابط الملف الصوتي/);
  });

  it('needs a title', () => expect(validateLessonForm(valid({ title: '  ' }), existing)).toBe('يرجى إدخال عنوان الدرس'));
  it('needs a series', () => expect(validateLessonForm(valid({ seriesId: '' }), existing)).toBe('يرجى اختيار السلسلة العلمية'));

  it('refuses a number already used in the series and names the next free one', () => {
    const message = validateLessonForm(valid({ lessonNumber: 2 }), existing);
    expect(message).toContain('رقم الدرس 2 مستخدم');
    expect(message).toContain('3');
  });
  it('lets a lesson keep its own number while it is edited', () => {
    expect(validateLessonForm(valid({ lessonNumber: 2 }), existing, 'l2')).toBeNull();
  });
  it('allows the same number in another series', () => {
    expect(validateLessonForm(valid({ seriesId: 's2', lessonNumber: 1 }), existing)).toBeNull();
  });

  it('refuses a link that is not a YouTube video', () => {
    expect(validateLessonForm(valid({ youtubeUrl: 'https://example.com/x' }), existing)).toContain('رابط يوتيوب غير صحيح');
  });

  it('refuses to publish a lesson with no video, audio or transcript', () => {
    expect(validateLessonForm(valid({ youtubeUrl: '', audioUrl: '', transcript: '' }), existing)).toContain('لا يمكن نشر درس');
  });
  it('accepts a published lesson that has only a transcript, or only a recording', () => {
    expect(validateLessonForm(valid({ youtubeUrl: '', transcript: 'نص' }), existing)).toBeNull();
    expect(validateLessonForm(valid({ youtubeUrl: '', audioUrl: 'https://x/a.mp3' }), existing)).toBeNull();
  });
  it('accepts an empty draft', () => {
    expect(validateLessonForm(valid({ youtubeUrl: '', status: 'draft' }), existing)).toBeNull();
  });
});

describe('toSaveData', () => {
  it('trims the text, reads the chapters and keeps the status and featured flag', () => {
    const data = toSaveData(valid({ title: '  عنوان  ', youtubeUrl: ' https://youtu.be/loVFoAlqeCc ', chaptersText: '00:10 أ\n01:00 ب', featured: true, status: 'draft' }));
    expect(data).toMatchObject({ title: 'عنوان', youtube_url: 'https://youtu.be/loVFoAlqeCc', featured: true, status: 'draft', series_id: 's1' });
    expect(data.chapters).toEqual([
      { seconds: 10, title: 'أ' },
      { seconds: 60, title: 'ب' },
    ]);
  });
  it('turns an invalid number into 1', () => {
    expect(toSaveData(valid({ lessonNumber: Number.NaN })).lesson_number).toBe(1);
  });
});
