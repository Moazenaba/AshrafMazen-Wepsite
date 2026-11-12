// Pure rules for the reels (the channel's YouTube Shorts): what visitors see, in which order.
// The list from YouTube updates by itself; the admin's saved list decides the order, and what the admin removed
// never comes back, even when YouTube still has it. Shorts YouTube adds later appear at the top until the admin orders them.

export interface ReelItem {
  id: string;
  title: string;
}

export interface ReelsSettings {
  // The admin's order (shorts from YouTube and ones the admin added by link)
  items: ReelItem[];
  // Removed by the admin: never shown again
  hidden: string[];
  // Titles the admin wrote instead of YouTube's
  titles: Record<string, string>;
}

export const EMPTY_REELS: ReelsSettings = { items: [], hidden: [], titles: {} };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export interface AdminReel extends ReelItem {
  // From YouTube and not yet in the admin's saved order
  fresh: boolean;
}

export function parseReelsSettings(raw: unknown): ReelsSettings {
  let data: any = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw || '{}');
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== 'object') return EMPTY_REELS;
  const items: ReelItem[] = Array.isArray(data.items)
    ? data.items.filter((r: any) => VIDEO_ID.test(r?.id)).map((r: any) => ({ id: r.id, title: String(r.title ?? '').trim() }))
    : [];
  const hidden: string[] = Array.isArray(data.hidden) ? data.hidden.filter((id: unknown) => typeof id === 'string') : [];
  const titles: Record<string, string> = data.titles && typeof data.titles === 'object' ? data.titles : {};
  return { items, hidden, titles };
}

// Everything the admin manages, in the order visitors will see it: YouTube's new ones first, then the saved order
export function adminReels(fetched: ReelItem[], settings: ReelsSettings): AdminReel[] {
  const hidden = new Set(settings.hidden);
  const saved = new Set(settings.items.map((r) => r.id));
  const fetchedTitle = new Map(fetched.map((r) => [r.id, r.title]));
  const fresh = fetched.filter((r) => !saved.has(r.id) && !hidden.has(r.id)).map((r) => ({ ...r, fresh: true }));
  const kept = settings.items
    .filter((r) => !hidden.has(r.id))
    .map((r) => ({ id: r.id, title: r.title || fetchedTitle.get(r.id) || '', fresh: false }));
  const seen = new Set<string>();
  return [...fresh, ...kept].filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

// What visitors see: the same list with the admin's titles
export function visibleReels(fetched: ReelItem[], settings: ReelsSettings): ReelItem[] {
  return adminReels(fetched, settings).map(({ id, title }) => ({ id, title: settings.titles[id]?.trim() || title }));
}

// The admin saves the list as it stands on screen; removed ones go to "hidden" so YouTube cannot bring them back
export function settingsFromAdmin(list: ReelItem[], removed: string[], titles: Record<string, string>): ReelsSettings {
  const ids = new Set(list.map((r) => r.id));
  const cleanTitles = Object.fromEntries(Object.entries(titles).filter(([id, t]) => ids.has(id) && t.trim()).map(([id, t]) => [id, t.trim()]));
  return { items: list.map(({ id, title }) => ({ id, title })), hidden: [...new Set(removed)].filter((id) => !ids.has(id)), titles: cleanTitles };
}
