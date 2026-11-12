import { describe, expect, it } from 'vitest';
import { categoryOfPlaylist, channelVideos, guessCategory, NO_CATEGORY } from './channelSearch';

const cats = [
  { name: 'العقيدة', slug: 'aqeedah' },
  { name: 'مصطلح الحديث', slug: 'mustalah' },
  { name: 'الفقه', slug: 'fiqh' },
  { name: 'أصول الفقه', slug: 'usul' },
  { name: 'الخطب', slug: 'khutab' },
];

describe('playlist categories', () => {
  it("guesses from the playlist's title", () => {
    expect(guessCategory('شرح العقيدة الواسطية', cats)).toBe('aqeedah');
    expect(guessCategory('القول المفيد فى شرح كتاب التوحيد', cats)).toBe('aqeedah');
    expect(guessCategory('المسيح الدجال', cats)).toBe('aqeedah');
    expect(guessCategory('الأصول من علم الأصول', cats)).toBe('usul');
    expect(guessCategory('خطب الجمعة', cats)).toBe('khutab');
    expect(guessCategory('فقه الصيام', cats)).toBe('fiqh');
    expect(guessCategory('٢٠٠ سؤال وجواب', cats)).toBeUndefined();
  });

  it("follows the admin's choice, including no category", () => {
    expect(categoryOfPlaylist({ title: 'شرح العقيدة الواسطية', category: 'fiqh' }, cats)).toBe('fiqh');
    expect(categoryOfPlaylist({ title: 'شرح العقيدة الواسطية', category: NO_CATEGORY }, cats)).toBeUndefined();
  });
});

describe('channelVideos', () => {
  const library = [
    { id: 'P1', title: 'شرح العقيدة الواسطية', videos: [{ id: 'a', title: 'الدرس الأول', published: '2024-01-01' }, { id: 'b', title: 'الدرس الثاني', published: '2024-02-01' }] },
    { id: 'P2', title: 'خطب الجمعة', videos: [{ id: 'c', title: 'خطبة التوبة', published: '2024-03-01' }, { id: 'a', title: 'الدرس الأول' }] },
    { id: 'P3', title: 'مرفوعات', videos: [{ id: 'up-1', title: 'ملف', src: 'https://x/v.mp4' }] },
  ];

  it('lists every channel video once, newest first, without a search word', () => {
    expect(channelVideos(library, { query: '', categorySlug: '', categories: cats }).map((v) => v.id)).toEqual(['c', 'b', 'a']);
  });

  it("keeps one category's videos", () => {
    expect(channelVideos(library, { query: '', categorySlug: 'khutab', categories: cats }).map((v) => v.id)).toEqual(['c', 'a']);
    expect(channelVideos(library, { query: '', categorySlug: 'aqeedah', categories: cats }).map((v) => v.id)).toEqual(['b', 'a']);
  });

  it('finds by words', () => {
    expect(channelVideos(library, { query: 'التوبة', categorySlug: '', categories: cats }).map((v) => v.id)).toEqual(['c']);
  });
});
