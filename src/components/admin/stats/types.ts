// Shapes used by the statistics screen.
export type ItemRow = {
  key: string;
  title: string;
  kind: 'lesson' | 'yt' | 'book';
  views: number;
  video: number;
  audio: number;
  read: number;
};

export type Sort = 'views' | 'time';
export type ChartMetric = 'visitors' | 'views' | 'hours';

export const KIND_LABEL: Record<ItemRow['kind'], string> = { lesson: 'درس', yt: 'فيديو القناة', book: 'كتاب' };

// The admin's "الإحصائيات" tab: who is here now, how much is watched, heard and read, and by which item
