import React from 'react';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '../services/bookmarkService';

// Saves a lesson ("<id>"), a channel video ("yt:<video id>") or a book ("book:<id>") in this browser
export const BookmarkButton: React.FC<{ id: string; className?: string }> = ({ id, className = '' }) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(id);
  return (
    <button
      type="button"
      onClick={() => toggleBookmark(id)}
      aria-pressed={saved}
      className={`press inline-flex items-center gap-2 h-11 px-4 rounded-lg text-sm font-semibold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 ${className}`}
    >
      <Bookmark className={`w-4 h-4 ${saved ? 'fill-current text-gold-deep dark:text-gold' : ''}`} aria-hidden="true" />
      {saved ? 'محفوظ' : 'حفظ'}
    </button>
  );
};
