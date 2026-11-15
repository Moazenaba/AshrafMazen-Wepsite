// How many saved bookmarks still point at something that exists. A lesson that was deleted, or unpublished, stays in the
// visitor's browser storage forever; counting it would show "المحفوظات (3)" over a page that lists two.
// `known` is every lesson id of the site and every library video id; null when that list is not available (then all count).
export function countExisting(ids: string[], known: Set<string> | null): number {
  if (!known) return ids.length;
  return ids.filter((id) => known.has(id)).length;
}
