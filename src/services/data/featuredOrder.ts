// Pure rules for the order of the "اخترنا لك" lessons: the first one is the one the home page shows.
// The stored order is a list of lesson ids; a move swaps an id with its neighbour, nothing else changes.

export function moveId(ids: string[], id: string, step: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const target = index + step;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function canMoveId(ids: string[], id: string, step: -1 | 1): boolean {
  const index = ids.indexOf(id);
  return index >= 0 && index + step >= 0 && index + step < ids.length;
}

// The order the admin sees: only the lessons still pinned, in their saved order, then any pinned lesson not yet in the order
export function pinnedOrder(saved: string[], pinned: string[]): string[] {
  const pinnedSet = new Set(pinned);
  const kept = saved.filter((id) => pinnedSet.has(id));
  const rest = pinned.filter((id) => !kept.includes(id));
  return [...kept, ...rest];
}
