// The order of the pinned lessons on the home page ("اخترنا لك"): loads it, moves one lesson up or down, and saves.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { readLessonExtras, saveFeaturedOrder } from '../../../../services/data/extras';
import { canMoveId, moveId, pinnedOrder } from '../../../../services/data/featuredOrder';
import type { LessonAdminItem } from '../types';

export function useFeaturedOrder(lessons: LessonAdminItem[]) {
  const pinned = useMemo(() => lessons.filter((l) => l.featured), [lessons]);
  const pinnedKey = pinned.map((l) => l.id).join(',');
  const [order, setOrder] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const saved = (await readLessonExtras()).featured;
    setOrder(pinnedOrder(saved, pinnedKey ? pinnedKey.split(',') : []));
  }, [pinnedKey]);

  useEffect(() => {
    load().catch(() => setError('تعذّر تحميل ترتيب الدروس.'));
  }, [load]);

  const items = order.map((id) => pinned.find((l) => l.id === id)).filter((l): l is LessonAdminItem => !!l);

  const move = async (id: string, step: -1 | 1) => {
    if (busy) return;
    const next = moveId(order, id, step);
    if (next === order) return;
    setBusy(true);
    setError('');
    try {
      await saveFeaturedOrder(next);
      setOrder(next);
    } catch (err: any) {
      setError(err?.message || 'تعذّر حفظ الترتيب.');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return { items, busy, error, canMove: (id: string, step: -1 | 1) => canMoveId(order, id, step), move };
}
