// Saving and deleting series from the dashboard.
import { createSeries, deleteSeries, updateSeries } from '../../../../services/dataService';
import type { Lesson, Series } from '../../../../types';
import type { AskDelete } from './useDeleteConfirm';
import type { Editor } from './useEditor';

interface Options {
  editor: Editor<Series>;
  lessons: Pick<Lesson, 'series_id'>[];
  ask: AskDelete;
  reload: () => Promise<void>;
}

export function useSeriesActions({ editor, lessons, ask, reload }: Options) {
  const save = async (data: Partial<Series>) => {
    if (editor.editing) await updateSeries(editor.editing.id, data);
    else await createSeries(data);
    await reload();
  };

  const requestDelete = (series: Series) =>
    ask({
      title: `حذف سلسلة "${series.title}"`,
      message: 'هل أنت متأكد من رغبتك في حذف هذه السلسلة العلمية؟',
      blockedReason: lessons.some((l) => l.series_id === series.id)
        ? 'لا يمكن حذف هذه السلسلة لأنها تحتوي على دروس. احذف الدروس أو انقلها إلى سلسلة أخرى أولاً.'
        : undefined,
      onConfirm: async () => {
        await deleteSeries(series.id);
        await reload();
      },
    });

  return { save, requestDelete };
}
