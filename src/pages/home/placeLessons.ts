// Each lesson is placed once on the home page. Sections take their lessons in this order, skipping any already placed:
// the featured lesson, the continue-watching lesson (reserved), each category's newest, the newest, the most viewed,
// the sermons, and the sidebar video.
import type { CategoryWithPortalData, LessonWithRelations } from '../../services/dataService';
import type { RecentLesson } from '../../services/recentLessonService';

export interface PlacementInput {
  featuredList: LessonWithRelations[];
  categories: CategoryWithPortalData[];
  latestList: LessonWithRelations[];
  viewedList: LessonWithRelations[];
  sermonList: LessonWithRelations[];
  recentLesson: RecentLesson | null;
}

export function placeLessons({ featuredList, categories, latestList, viewedList, sermonList, recentLesson }: PlacementInput) {
  // The featured lesson is pinned by the admin, so it is placed first; the continue-watching lesson is reserved after it
  const used = new Set<string>();
  const pick = (list: LessonWithRelations[], n: number, accept: (l: LessonWithRelations) => boolean = () => true) => {
    const out: LessonWithRelations[] = [];
    for (const lesson of list) {
      if (out.length >= n) break;
      if (used.has(lesson.id) || !accept(lesson)) continue;
      used.add(lesson.id);
      out.push(lesson);
    }
    return out;
  };

  const featured = pick(featuredList, 1)[0] ?? null;
  if (recentLesson && !recentLesson.id.startsWith('yt:')) used.add(recentLesson.id);
  const categoryBlocks = categories
    .filter((cat) => cat.lessonCount > 0)
    .map((cat) => ({ cat, newest: pick(cat.recentLessons, 1)[0] ?? null }));
  const newest = pick(latestList, 4);
  const viewed = pick(viewedList, 3);
  const sermons = pick(sermonList, 4);
  const video = pick(latestList, 1, (l) => Boolean(l.youtube_url))[0] ?? null;
  return { featured, categoryBlocks, newest, viewed, sermons, video };
}

export type Placed = ReturnType<typeof placeLessons>;
