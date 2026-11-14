import React from 'react';
import type { Book } from '../types';
import { fileSrc } from '../lib/fileLinks';

// A book's cover at 3:4: the uploaded picture, or, when there is none, a cover set like the mushaf's binding:
// the deep green field, a gold frame, and the title in Ruqaa
export const BookCover: React.FC<{ book: Pick<Book, 'title' | 'author' | 'cover_url'>; className?: string }> = ({ book, className = '' }) => (
  <span aria-hidden="true" className={`relative block aspect-[3/4] overflow-hidden rounded-lg bg-mushaf ${className}`}>
    {book.cover_url ? (
      <img src={fileSrc(book.cover_url)} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <span className="absolute inset-[7%] flex flex-col items-center justify-center gap-[6%] rounded-md border-2 border-gold/80 px-[8%] text-center">
        <span className="pattern-stars absolute inset-0 opacity-[0.12]" />
        <span className="relative font-ruqaa text-gold-soft leading-snug text-[clamp(1rem,0.7rem+1.2vw,1.6rem)] line-clamp-4">{book.title}</span>
        {book.author && <span className="relative text-gold/90 text-xs sm:text-sm line-clamp-2">{book.author}</span>}
      </span>
    )}
  </span>
);
