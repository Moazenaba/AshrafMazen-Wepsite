// Saving and deleting categories from the dashboard.
import { createCategory, deleteCategory, updateCategory } from '../../../../services/dataService';
import type { Category, Series } from '../../../../types';
import type { AskDelete } from './useDeleteConfirm';
import type { Editor } from './useEditor';

interface Options {
  editor: Editor<Category>;
  series: Series[];
  ask: AskDelete;
  reload: () => Promise<void>;
}

export function useCategoryActions({ editor, series, ask, reload }: Options) {
  const save = async (data: Partial<Category>) => {
    if (editor.editing) await updateCategory(editor.editing.id, data);
    else await createCategory(data);
    await reload();
  };

  const requestDelete = (category: Category) =>
    ask({
      title: `حذف قسم "${category.name}"`,
      message: 'هل أنت متأكد من رغبتك في حذف هذا القسم؟ لن يمكن استرجاعه.',
      blockedReason: series.some((s) => s.category_id === category.id)
        ? 'لا يمكن حذف هذا القسم لأنه يحتوي على سلاسل علمية. احذف السلاسل أو انقلها إلى قسم آخر أولاً.'
        : undefined,
      onConfirm: async () => {
        await deleteCategory(category.id);
        await reload();
      },
    });

  return { save, requestDelete };
}
