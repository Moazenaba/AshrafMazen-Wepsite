// Saving, deleting and starting lessons from the dashboard, including the lesson started from a visitor's suggestion.
import { useState } from 'react';
import { createLesson, deleteLesson, reviewSubmission, updateLesson, type Submission } from '../../../../services/dataService';
import { getYouTubeId } from '../../../../lib/youtube';
import type { Lesson } from '../../../../types';
import type { LessonSaveData } from '../../../../components/admin/modals/lesson/lessonForm';
import type { AskDelete } from './useDeleteConfirm';
import { useEditor } from './useEditor';

interface Options {
  ask: AskDelete;
  reload: () => Promise<void>;
  // Called after a visitor's request was accepted by saving the lesson made from it
  onRequestAccepted: () => void;
}

// The starting values of a lesson made from a visitor's video or audio suggestion
function lessonFromSuggestion(item: Submission): Partial<Lesson> {
  const isYoutube = !!getYouTubeId(item.url);
  return {
    title: item.title,
    youtube_url: item.kind === 'video' || isYoutube ? item.url : '',
    audio_url: item.kind === 'audio' && !isYoutube ? item.url : '',
    transcript: '',
    status: 'draft',
  };
}

export function useLessonActions({ ask, reload, onRequestAccepted }: Options) {
  const editor = useEditor<Lesson>();
  // A lesson started from a suggestion: its values, and the request to accept once it is saved
  const [prefill, setPrefill] = useState<Partial<Lesson> | null>(null);
  const [fromSubmission, setFromSubmission] = useState<string | null>(null);

  const openFromSubmission = (item: Submission) => {
    setPrefill(lessonFromSuggestion(item));
    setFromSubmission(item.id);
    editor.openNew();
  };

  const close = () => {
    editor.close();
    setPrefill(null);
    setFromSubmission(null);
  };

  const save = async (data: LessonSaveData) => {
    if (editor.editing) {
      await updateLesson(editor.editing.id, data);
    } else {
      await createLesson(data);
      if (fromSubmission) {
        await reviewSubmission(fromSubmission, 'approved', 'أُنشئ منه درس');
        onRequestAccepted();
      }
    }
    await reload();
  };

  const requestDelete = (lesson: Lesson) =>
    ask({
      title: `حذف درس "${lesson.title}"`,
      message: 'هل أنت متأكد من رغبتك في حذف هذا الدرس نهائياً؟',
      onConfirm: async () => {
        await deleteLesson(lesson.id);
        await reload();
      },
    });

  return { editor, prefill, close, save, requestDelete, openFromSubmission };
}
