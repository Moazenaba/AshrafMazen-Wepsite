// The home page's featured card, written into the prerendered HTML with the same classes as
// src/pages/home/HomeFeatureCard.tsx. The stylesheet is in <head>, so the card (the biggest thing on a phone's first
// screen) is painted with the first response instead of after the scripts run: that moment is the page's LCP.
// The app then draws its own card in the same place. Keep the classes in step with HomeFeatureCard.tsx.
import { esc } from './prerenderParts.mjs';

const YT = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;
const ytId = (url = '') => url.match(YT)?.[1] ?? null;
const thumb = (url) => (ytId(url) ? `https://i.ytimg.com/vi/${ytId(url)}/hqdefault.jpg` : '');

// The admin's card from the site_settings rows (key home_feature), or null when it is off or has no picture
export function readFeature(settings = []) {
  const raw = settings.find((row) => row.key === 'home_feature')?.value;
  let f;
  try {
    f = JSON.parse(raw || 'null');
  } catch {
    return null;
  }
  if (!f?.enabled) return null;
  const image = f.imageUrl || thumb(f.imageFrom) || thumb(f.videoUrl);
  if (!image) return null;
  const url = String(f.videoUrl || '').trim();
  const id = ytId(url);
  const href = id ? `/video/${id}` : url;
  return { title: String(f.title || ''), subtitle: String(f.subtitle || ''), image, href, button: f.buttonLabel || 'شاهد واستمع الآن' };
}

export function featureCardHtml(feature) {
  if (!feature) return '';
  const { title, subtitle, image, href, button } = feature;
  const external = href && !href.startsWith('/');
  const link = href
    ? `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''} class="press inline-flex items-center whitespace-nowrap gap-1.5 min-[360px]:gap-2 h-11 sm:h-12 px-2.5 min-[360px]:px-4 sm:px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep text-[13px] min-[360px]:text-sm sm:text-base font-bold">${esc(button)}</a>`
    : '';
  return `<article class="rounded-xl bg-mushaf text-white overflow-hidden border-b-4 border-gold"><div class="grid grid-cols-[84px_minmax(0,1fr)] min-[360px]:grid-cols-[108px_minmax(0,1fr)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 sm:gap-6 p-4 sm:p-7 items-center"><div class="order-2 sm:order-none min-w-0 space-y-2 sm:space-y-4">${
    title ? `<h3 class="font-sans text-base min-[360px]:text-lg sm:text-3xl font-bold leading-snug text-balance line-clamp-3 sm:line-clamp-none">${esc(title)}</h3>` : ''
  }${subtitle ? `<p class="-mt-1 sm:-mt-2 text-xs sm:text-sm text-gold-soft">${esc(subtitle)}</p>` : ''}${link}</div><div class="order-1 sm:order-none"><span class="relative block aspect-video w-full overflow-hidden rounded-lg bg-mushaf-deep"><img src="${esc(image)}" alt="${esc(title)}" fetchpriority="high" class="absolute inset-0 w-full h-full object-cover"></span></div></div></article>`;
}

// The hero (the sheikh's name in the admin's font, and the hadith under it), with the classes of
// src/pages/home/HeroSection.tsx. On a phone the name is the biggest text on the first screen, so it is the LCP element;
// written here it is painted with the first response. The name is a <div>: the page's one <h1> stays the SEO heading.
const DEFAULT_NAME = 'أبو عبد الرحمن أشرف بن طه بن مازن';

export function heroHtml(settings = []) {
  const get = (key) => settings.find((row) => row.key === key)?.value;
  const name = String(get('banner_name') || DEFAULT_NAME).trim() || DEFAULT_NAME;
  let hero = null;
  try {
    hero = JSON.parse(get('hero_quote') || 'null');
  } catch {
    hero = null;
  }
  const words = name
    .split(' ')
    .map((word, i) => `<span class="hero-word" style="animation-delay:${(0.08 * i).toFixed(2)}s">${esc(word)}</span>`)
    .join(' ');
  const quote = hero?.text
    ? `<p class="hero-fade mx-auto max-w-xs sm:max-w-none font-amiri text-xl sm:text-3xl leading-relaxed sm:leading-loose text-gold-deep dark:text-gold text-balance">${
        hero.intro ? `<span class="block sm:inline text-base sm:text-3xl text-stone-600 dark:text-stone-400 sm:text-gold-deep sm:dark:text-gold">${esc(hero.intro)}</span> ` : ''
      }«${esc(hero.text)}»${hero.source ? `<span class="block mt-1 sm:mt-0 text-sm sm:text-base text-stone-600 dark:text-stone-400">${esc(hero.source)}</span>` : ''}</p>`
    : '';
  return `<section class="px-6 sm:px-8 pt-5 pb-5 sm:pt-20 sm:pb-12 text-center space-y-4 sm:space-y-5"><div class="font-name text-[2.5rem] sm:text-6xl lg:text-7xl leading-[1.25] sm:leading-[1.3] text-mushaf dark:text-gold-soft text-balance">${words}</div>${quote}</section>`;
}
