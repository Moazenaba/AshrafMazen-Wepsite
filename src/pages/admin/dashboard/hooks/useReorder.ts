// Moves an item one place up or down in a list the admin orders by hand (categories, series, books).
// Every item in the same group gets the number of its place, so lists whose numbers were equal or had gaps are repaired too.
import { useCallback, useState } from 'react';
import { moveItem, renumber } from '../../../../services/data/siteContentRules';

interface Options<T> {
  items: T[];
  // Items are ordered only against the others of their group (for example the series of one category)
  groupOf?: (item: T) => string;
  save: (id: string, sortOrder: number) => Promise<unknown>;
  reload: () => Promise<unknown> | void;
}

export function useReorder<T extends { id: string; sort_order: number }>({ items, groupOf, save, reload }: Options<T>) {
  const [busy, setBusy] = useState(false);

  const groupOfItem = useCallback((item: T) => items.filter((other) => !groupOf || groupOf(other) === groupOf(item)), [items, groupOf]);

  const canMove = useCallback(
    (item: T, step: -1 | 1) => {
      const group = groupOfItem(item);
      const index = group.findIndex((other) => other.id === item.id);
      return index + step >= 0 && index + step < group.length;
    },
    [groupOfItem]
  );

  const move = useCallback(
    async (item: T, step: -1 | 1) => {
      if (busy) return;
      const group = groupOfItem(item);
      const index = group.findIndex((other) => other.id === item.id);
      const changes = renumber(moveItem(group, index, step));
      if (changes.length === 0) return;
      setBusy(true);
      try {
        for (const change of changes) await save(change.id, change.sort_order);
      } catch (err: any) {
        window.alert(err?.message || 'تعذّر تغيير الترتيب. حاول مرة أخرى.');
      } finally {
        await reload();
        setBusy(false);
      }
    },
    [busy, groupOfItem, save, reload]
  );

  return { move, canMove, busy };
}
