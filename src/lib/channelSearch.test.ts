import { describe, expect, it } from 'vitest';
import { categoryOfPlaylist, channelPlaylists, channelVideos, guessCategory, NO_CATEGORY } from './channelSearch';

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

describe('channelPlaylists', () => {
  const lists = [
    { id: 'P1', title: 'شرح العقيدة الواسطية', count: '38 فيديو' },
    { id: 'P2', title: 'خطب الجمعة', count: '130 فيديو' },
    { id: 'P3', title: 'الوابل الصيب', count: '17 فيديو' },
  ];
  it("finds a playlist by its name, even though no video's title has the word", () => {
    expect(channelPlaylists(lists, { query: 'الواسطية', categorySlug: '', categories: cats }).map((p) => p.id)).toEqual(['P1']);
    expect(channelPlaylists(lists, { query: 'الوابل', categorySlug: '', categories: cats })[0]).toMatchObject({ id: 'P3', count: '17 فيديو' });
  });
  it('lists the playlists of a chosen category when there are no words', () => {
    expect(channelPlaylists(lists, { query: '', categorySlug: 'aqeedah', categories: cats }).map((p) => p.id)).toEqual(['P1']);
    expect(channelPlaylists(lists, { query: '', categorySlug: 'khutab', categories: cats }).map((p) => p.id)).toEqual(['P2']);
  });
  it('finds nothing for words no playlist has', () => {
    expect(channelPlaylists(lists, { query: 'زززز', categorySlug: '', categories: cats })).toEqual([]);
  });
});
