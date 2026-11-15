// The library: books as PDF files, kept as one JSON record in site_settings.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import { isR2Url, r2DownloadUrl, uploadToR2 } from '../r2';
import { deleteIfUnused } from './fileUsage';
import type { Category, Book } from '../../types';
import { getCategories } from './catalog';
import { updateSiteRecord } from './jsonRecord';

export interface BookWithCategory extends Book {
  category?: Category | null;
}

const LIBRARY_KEY = 'library_books';

// The stored text (or nothing / something unreadable) as a list of books
export function parseBooks(raw: string | null): Book[] {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function readLibrary(): Promise<Book[]> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', LIBRARY_KEY).maybeSingle();
  if (error) throw new Error(translateSupabaseError(error));
  return parseBooks(data?.value ?? null);
}

// A change to the list, applied to the latest saved copy (another admin's books are kept)
const updateLibrary = (mutate: (books: Book[]) => Book[]) => updateSiteRecord(LIBRARY_KEY, parseBooks, mutate);

// What visitors may see of the library: published books only. Since docs/migrations/2026-11-05-security.sql the
// library record is readable by admins only, and visitors get it through the published_books() function, which
// leaves the drafts (and their file links) out. Before that migration runs, the record is read and filtered here.
async function readPublishedLibrary(): Promise<Book[]> {
  const { data, error } = await supabase.rpc('published_books');
  if (!error) return Array.isArray(data) ? (data as Book[]) : [];
  return (await readLibrary()).filter((b) => b.status === 'published');
}

const byShelfOrder = (a: Book, b: Book) =>
  (a.sort_order || 0) - (b.sort_order || 0) || (b.published_at || b.created_at).localeCompare(a.published_at || a.created_at);

async function attachBookCategories(books: Book[]): Promise<BookWithCategory[]> {
  if (books.length === 0) return [];
  const catMap = new Map((await getCategories()).map((c) => [c.id, c]));
  return books.map((b) => ({ ...b, category: b.category_id ? catMap.get(b.category_id) || null : null }));
}

export async function getPublishedBooks(): Promise<BookWithCategory[]> {
  const books = (await readPublishedLibrary()).sort(byShelfOrder);
  return attachBookCategories(books);
}

export async function getBook(id: string, includeDrafts = false): Promise<BookWithCategory | null> {
  const list = includeDrafts ? await readLibrary() : await readPublishedLibrary();
  const book = list.find((b) => b.id === id && (includeDrafts || b.status === 'published'));
  return book ? (await attachBookCategories([book]))[0] : null;
}

export async function getAllBooksAdmin(): Promise<BookWithCategory[]> {
  return attachBookCategories((await readLibrary()).sort(byShelfOrder));
}

function cleanBook(bookData: Partial<Book>, base: Book): Book {
  const status = bookData.status ?? base.status;
  return {
    ...base,
    title: (bookData.title ?? base.title).trim(),
    author: (bookData.author ?? base.author ?? '').trim(),
    description: (bookData.description ?? base.description ?? '').trim(),
    category_id: bookData.category_id !== undefined ? bookData.category_id || null : base.category_id,
    file_url: (bookData.file_url ?? base.file_url).trim(),
    cover_url: bookData.cover_url !== undefined ? (bookData.cover_url ? bookData.cover_url.trim() : null) : base.cover_url,
    pages: bookData.pages !== undefined ? (bookData.pages ? Number(bookData.pages) : null) : base.pages,
    sort_order: bookData.sort_order !== undefined ? Number(bookData.sort_order) || 0 : base.sort_order,
    status,
    published_at: status === 'published' ? base.published_at || new Date().toISOString() : base.published_at,
  };
}

// With bookData.id, a book that already has that id is returned as it is, so repeating the call adds nothing
export async function createBook(bookData: Partial<Book>): Promise<Book> {
  if (!(bookData.title || '').trim()) throw new Error('يرجى إدخال عنوان الكتاب.');
  if (!(bookData.file_url || '').trim()) throw new Error('يرجى رفع ملف الكتاب (PDF) أو إدخال رابطه.');
  if (bookData.id) {
    const existing = (await readLibrary()).find((b) => b.id === bookData.id);
    if (existing) return existing;
  }
  const id =
    bookData.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const base: Book = {
    id,
    title: '',
    author: '',
    description: '',
    category_id: null,
    file_url: '',
    cover_url: null,
    pages: null,
    sort_order: 0,
    status: 'published',
    published_at: null,
    created_at: new Date().toISOString(),
  };
  const book = cleanBook(bookData, base);
  await updateLibrary((books) => (books.some((b) => b.id === book.id) ? books : [...books, book]));
  return book;
}

export async function updateBook(id: string, bookData: Partial<Book>): Promise<Book> {
  let previous!: Book;
  let book!: Book;
  let after: Book[] = [];
  await updateLibrary((books) => {
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('هذا الكتاب لم يعد موجوداً.');
    const edited = cleanBook(bookData, books[index]);
    if (!edited.title) throw new Error('يرجى إدخال عنوان الكتاب.');
    if (!edited.file_url) throw new Error('يرجى رفع ملف الكتاب (PDF) أو إدخال رابطه.');
    previous = books[index];
    book = edited;
    after = books.map((b, i) => (i === index ? edited : b));
    return after;
  });
  // A replaced PDF or cover is no longer used by anything
  for (const [oldUrl, newUrl] of [
    [previous.file_url, book.file_url],
    [previous.cover_url, book.cover_url],
  ] as const) {
    if (oldUrl && oldUrl !== newUrl) await deleteIfUnused(oldUrl);
  }
  return book;
}

// Deletes the book and the files it uploaded; a file that cannot be removed does not block the delete
export async function deleteBook(book: Pick<Book, 'id' | 'file_url' | 'cover_url'>): Promise<boolean> {
  let remaining: Book[] = [];
  await updateLibrary((books) => (remaining = books.filter((b) => b.id !== book.id)));
  for (const url of [book.file_url, book.cover_url]) {
    await deleteIfUnused(url);
  }
  return true;
}

const BOOK_FILE_RULES = {
  pdf: { extensions: ['pdf'], maxMb: 200, message: 'يرجى اختيار ملف بصيغة PDF.' },
  cover: { extensions: ['jpg', 'jpeg', 'png', 'webp'], maxMb: 5, message: 'يرجى اختيار صورة غلاف بصيغة jpg أو png أو webp.' },
} as const;

export async function uploadBookFile(file: File, kind: 'pdf' | 'cover'): Promise<string> {
  const rules = BOOK_FILE_RULES[kind];
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  if (!(rules.extensions as readonly string[]).includes(extension)) throw new Error(rules.message);
  if (file.size > rules.maxMb * 1024 * 1024) throw new Error(`حجم الملف أكبر من ${rules.maxMb} ميجابايت.`);

  return uploadToR2(file, kind);
}

// A link that downloads the file with the book's title as its name; a file hosted elsewhere is linked as it is
export function bookDownloadUrl(book: Pick<Book, 'file_url' | 'title'>): string {
  if (!isR2Url(book.file_url)) return book.file_url;
  const name = `${book.title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'book'}.pdf`;
  return r2DownloadUrl(book.file_url, name);
}
