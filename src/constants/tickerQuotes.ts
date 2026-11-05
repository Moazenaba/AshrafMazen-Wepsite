// Sayings shown on the quote ticker on the home page.
// Hadiths here are well-known and sourced. Sayings of the sheikh should be added with
// their real source (the lesson or book they come from) so every line can be checked.

export interface TickerQuote {
  text: string;
  source: string;
}

export const TICKER_QUOTES: TickerQuote[] = [
  { text: 'إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.', source: 'رواه البخاري ومسلم' },
  { text: 'الدين النصيحة.', source: 'رواه مسلم' },
  { text: 'تبسّمك في وجه أخيك لك صدقة.', source: 'رواه الترمذي' },
  { text: 'المؤمن للمؤمن كالبنيان يشدّ بعضه بعضًا.', source: 'متفق عليه' },
];
