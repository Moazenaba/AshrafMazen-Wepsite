// What the home card's button can open: any published lesson (video, audio or written), book, or channel video.
// Pure rules: building the list the admin picks from, and finding the matches for what the admin typed.
import { searchScore } from '../../utils/arabicSearch';

export type TargetKind = 'lesson' | 'book' | 'video';

export interface FeatureTarget {
  kind: TargetKind;
  id: string;
  title: string;
  href: string;
}

export const TARGET_KIND_LABEL: Record<TargetKind, string> = { lesson: 'درس', book: 'كتاب', video: 'فيديو القناة' };

export const targetHref = (kind: TargetKind, id: string) => (kind === 'lesson' ? `/lesson/${id}` : kind === 'book' ? `/book/${id}` : `/video/${id}`);

export interface TargetSources {
  lessons: { id: string; title: string }[];
  books: { id: string; title: string }[];
  videos: { id: string; title: string }[];
}

export function buildTargets({ lessons, books, videos }: TargetSources): FeatureTarget[] {
  const seen = new Set<string>();
  const out: FeatureTarget[] = [];
  const add = (kind: TargetKind, items: { id: string; title: string }[]) => {
    for (const item of items) {
      const key = `${kind}:${item.id}`;
      if (!item.id || !item.title || seen.has(key)) continue;
      seen.add(key);
      out.push({ kind, id: item.id, title: item.title, href: targetHref(kind, item.id) });
    }
  };
  add('lesson', lessons);
  add('book', books);
  add('video', videos);
  return out;
}

// Best matches first; with no text, the first few as they come (newest lessons first)
export function matchTargets(targets: FeatureTarget[], query: string, limit = 12): FeatureTarget[] {
  const text = query.trim();
  if (!text) return targets.slice(0, limit);
  return targets
    .map((t) => ({ t, score: searchScore(t.title, text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.t);
}
