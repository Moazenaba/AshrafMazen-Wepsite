import { describe, expect, it } from 'vitest';
import { cleanVideoTitle, namedTitle, videoDescription } from './seoText';

describe('cleanVideoTitle (search titles without the hashtag tail)', () => {
  it.each([
    ['الوابل الصيب (22)| تعظيم أوامر الله عزوجل ونواهيه (1) | # الشيخ _ أشرف _ مازن', 'الوابل الصيب (22) | تعظيم أوامر الله عزوجل ونواهيه (1)'],
    ['كتاب التوبة (13)/ حقيقة أعذار الخليقة فى التوبة إلى الله عزوجل/# لفضيلة الشيخ أشرف -مازن', 'كتاب التوبة (13)/ حقيقة أعذار الخليقة فى التوبة إلى الله عزوجل'],
    ['الأصول من علم الأصول (4) | باب الأمر | #الشيخ_أشرف_مازن', 'الأصول من علم الأصول (4) | باب الأمر'],
    ['ملخص خطبة الجمعة | واعتصموا بحبل الله جميعا ولا تفرقوا| #الشيخ_أشرف_بن_طه_آل_مازن', 'ملخص خطبة الجمعة | واعتصموا بحبل الله جميعا ولا تفرقوا'],
  ])('%s', (raw, clean) => {
    expect(cleanVideoTitle(raw)).toBe(clean);
  });
  it('leaves a title without hashtags as it is, dates included', () => {
    const t = 'من شروط لا اله الا الله الصدق والاخلاص والمحبه 24 /11 / 2017الشيخ اشرف مازن';
    expect(cleanVideoTitle(t)).toBe(t);
    expect(cleanVideoTitle('البرُّ بالأوطَانِ مِن شمائلِ الإيمَانِ')).toBe('البرُّ بالأوطَانِ مِن شمائلِ الإيمَانِ');
  });
  it('never returns an empty title', () => {
    expect(cleanVideoTitle('#الشيخ_أشرف_مازن')).toBe('#الشيخ_أشرف_مازن');
  });
});

describe('namedTitle and videoDescription', () => {
  it('adds the official name once, after the hashtag is gone', () => {
    expect(namedTitle('الأصول من علم الأصول (4) | باب الأمر | #الشيخ_أشرف_مازن')).toBe('الأصول من علم الأصول (4) | باب الأمر - الشيخ أشرف مازن');
    expect(namedTitle('القول المفيد ( 4) /لفضيلة الشيخ أشرف بن طه مازن')).toBe('القول المفيد ( 4) /لفضيلة الشيخ أشرف بن طه مازن');
  });
  it('describes a video by its clean title and playlist', () => {
    expect(videoDescription('باب الأمر | #الشيخ_أشرف_مازن', 'الأصول من علم الأصول')).toBe('باب الأمر - من «الأصول من علم الأصول» للشيخ أشرف مازن.');
  });
});
