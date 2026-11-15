// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { submitForm } from '../../../test/formHelpers';

const h = vi.hoisted(() => ({ create: vi.fn(async () => ({})), update: vi.fn(async () => ({})), upload: vi.fn() }));
vi.mock('../../../services/dataService', () => ({ createBook: h.create, updateBook: h.update, uploadBookFile: h.upload }));

import { BookModal } from './BookModal';

const open = () => {
  const onSaved = vi.fn();
  const view = render(<BookModal initial={null} categories={[]} onClose={() => {}} onSaved={onSaved} />);
  return { ...view, onSaved };
};

beforeEach(() => {
  h.create.mockClear();
});

describe('BookModal', () => {
  it('saves a book with a title and a PDF link', async () => {
    const { container, onSaved } = open();
    fireEvent.change(container.querySelector('#book-title')!, { target: { value: 'كتاب التوحيد' } });
    fireEvent.change(screen.getByLabelText('رابط ملف PDF'), { target: { value: '/api/r2?file=library%2Ffiles%2Fa.pdf' } });
    submitForm(container);
    await waitFor(() => expect(h.create).toHaveBeenCalledTimes(1));
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'كتاب التوحيد', file_url: '/api/r2?file=library%2Ffiles%2Fa.pdf' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it('refuses a book without a title', () => {
    const { container } = open();
    submitForm(container);
    expect(screen.getByText('يرجى إدخال عنوان الكتاب.')).toBeInTheDocument();
    expect(h.create).not.toHaveBeenCalled();
  });

  it('refuses a book without a PDF', () => {
    const { container } = open();
    fireEvent.change(container.querySelector('#book-title')!, { target: { value: 'كتاب' } });
    submitForm(container);
    expect(screen.getByText('يرجى رفع ملف PDF أو لصق رابطه.')).toBeInTheDocument();
    expect(h.create).not.toHaveBeenCalled();
  });
});
