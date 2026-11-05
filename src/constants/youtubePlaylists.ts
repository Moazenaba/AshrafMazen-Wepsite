// NOTE: the site itself does not import this file. It is the list of playlists that scripts/sync-youtube.mjs and
// scripts/build-youtube-library.mjs read to produce src/data/youtube-library.ts (what the site shows).
// To add a playlist: add it here, then run `npm run sync:youtube` and `npm run build:library`.
// Playlists of the sheikh's YouTube channel, in the order the channel shows them.
// Titles and counts are copied from https://www.youtube.com/@Ashrafmazen/playlists.
// latestVideoId is the first video at the top of each playlist when it was read.

export interface YouTubePlaylist {
  id: string;
  title: string;
  count: string;
  latestVideoId: string;
}

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@Ashrafmazen/playlists';

export const YOUTUBE_PLAYLISTS: YouTubePlaylist[] = [
  { id: 'PLHcd1VuAeT_NcmgwOimYSUQVJVK9WwM3_', title: 'خطب الجمعة', count: '136 فيديو', latestVideoId: 'KN3BR-84F5w' },
  { id: 'PLHcd1VuAeT_OaS9laiTEk1qiTT4Tvcm2E', title: '٢٠٠ سؤال وجواب', count: '86 فيديو', latestVideoId: 'pyWf1uZYg2U' },
  { id: 'PLHcd1VuAeT_OgW1l36gkouA-wJXTN9FGS', title: 'شرح العقيدة الواسطية', count: '38 حلقة', latestVideoId: 'XQsZO9DV1pE' },
  { id: 'PLHcd1VuAeT_O8g0Gr5mJuncnu7L2t_AhA', title: 'كتاب التوبة', count: '37 فيديو', latestVideoId: 'nZdaWhpy50Q' },
  { id: 'PLHcd1VuAeT_OGrX6jYN80Rw8XaCkBqGTW', title: 'الوابل الصيب', count: '18 فيديو', latestVideoId: 'mkeduM7jxtM' },
  { id: 'PLHcd1VuAeT_PX5Rfu5CKPj-Ok9GAYYUGm', title: 'المعتقد الصحيح', count: '14 فيديو', latestVideoId: 'VSVNqNKUbok' },
  { id: 'PLHcd1VuAeT_MeMnXSZEeaJ0byi2Zpp9bR', title: 'الأصول من علم الأصول', count: '14 حلقة', latestVideoId: 'j9O47ibQy2A' },
  { id: 'PLHcd1VuAeT_P1ubsSD1cgCgRjMAxUhcOg', title: 'المسيح الدجال', count: '10 فيديو', latestVideoId: 'TMXKlnBXfQ4' },
  { id: 'PLHcd1VuAeT_MtAkP7tyneXYrhj-4OE8UB', title: 'أخلاق حملة القرآن', count: '8 فيديو', latestVideoId: '9WD-gAenSSI' },
  { id: 'PLHcd1VuAeT_PiOe9ozUxHwjOKDruxtlnD', title: 'دعائم منهاج النبوة', count: '6 فيديو', latestVideoId: 'rdaqBQ1HKIY' },
  { id: 'PLHcd1VuAeT_N4_Vb6tGkmZ1ZkW0UJ-qdE', title: 'القول المفيد فى شرح كتاب التوحيد', count: '5 فيديو', latestVideoId: 'CyuMgq4kfE4' },
  { id: 'PLHcd1VuAeT_MPiOc-VRay0sMlslQ3mq2r', title: 'سلسلة عداوة الشيطان للإنسان', count: '5 فيديو', latestVideoId: 'yUfeBP65p_4' },
  { id: 'PLHcd1VuAeT_OW6FmnOfwQzbZvEOQed3yB', title: 'دعائم منهاج النبوة', count: 'فيديو واحد', latestVideoId: 'tygzOfwnScE' },
  { id: 'PLHcd1VuAeT_Ok9U3ZDEsBCigGbTHC-jN9', title: 'رفع الملام عن الأئمة الأعلام', count: 'فيديو واحد', latestVideoId: 'ZOfBrKGJRGQ' },
];
