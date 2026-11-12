// Pure rules for the home page's side menu ("القائمة"): its items (every lesson, reels, the categories with lessons,
// the channel's playlists), in the admin's order, without the ones the admin hid. No database or screen here.
import { isSermonCategory, JUMUAH_LABEL, JUMUAH_PLAYLIST_ID } from '../../pages/home/sermons';

export interface MenuItem {
  // "link:search", "cat:<id>", "pl:<id>": stays the same when a title changes
  key: string;
  label: string;
  to: string;
}

export interface SideMenuConfig {
  order: string[];
  hidden: string[];
}

export const EMPTY_MENU: SideMenuConfig = { order: [], hidden: [] };

const keys = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((k): k is string => typeof k === 'string' && k.length < 200))] : []);

export function cleanSideMenu(data: Partial<SideMenuConfig> | undefined): SideMenuConfig {
  return { order: keys(data?.order), hidden: keys(data?.hidden) };
}

export function parseSideMenu(raw: string | null | undefined): SideMenuConfig {
  if (!raw) return EMPTY_MENU;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? cleanSideMenu(data) : EMPTY_MENU;
  } catch {
    return EMPTY_MENU;
  }
}

// Every item the menu can show, in the built-in order. The sermons category leads to the sermons playlist.
export function sideMenuItems(categories: { id: string; name: string; slug: string }[], playlists: { id: string; title: string }[]): MenuItem[] {
  return [
    { key: 'link:search', label: 'كل الدروس', to: '/search' },
    { key: 'link:reels', label: 'الريلز', to: '/reels' },
    ...categories.map((c) =>
      isSermonCategory(c.name) ? { key: `cat:${c.id}`, label: JUMUAH_LABEL, to: `/playlist/${JUMUAH_PLAYLIST_ID}` } : { key: `cat:${c.id}`, label: c.name, to: `/category/${c.slug}` }
    ),
    ...playlists.map((p) => ({ key: `pl:${p.id}`, label: p.title, to: `/playlist/${p.id}` })),
  ];
}

// The items in the admin's order (new ones keep their built-in place after the placed ones); hidden ones left out
// unless `withHidden` (the admin's editor shows them, marked)
export function arrangeMenu(items: MenuItem[], config: SideMenuConfig, withHidden = false): MenuItem[] {
  const rank = new Map(config.order.map((k, i) => [k, i]));
  const hidden = new Set(config.hidden);
  return items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => (rank.get(a.item.key) ?? config.order.length + a.i) - (rank.get(b.item.key) ?? config.order.length + b.i))
    .map(({ item }) => item)
    .filter((item) => withHidden || !hidden.has(item.key));
}

// One item a step up or down; `shown` is the list as the admin sees it now
export function moveMenuItem(config: SideMenuConfig, shown: MenuItem[], index: number, step: -1 | 1): SideMenuConfig {
  const target = index + step;
  if (target < 0 || target >= shown.length) return config;
  const order = shown.map((i) => i.key);
  [order[index], order[target]] = [order[target], order[index]];
  return { ...config, order };
}

export function toggleMenuItem(config: SideMenuConfig, key: string): SideMenuConfig {
  return { ...config, hidden: config.hidden.includes(key) ? config.hidden.filter((k) => k !== key) : [...config.hidden, key] };
}
