// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SeriesModal } from './SeriesModal';
import { category } from '../../../test/factories';
import { submitForm } from '../../../test/formHelpers';

const open = (categories = [category({ id: 'c1', name: 'العقيدة' })]) => {
  const onSave = vi.fn(async () => {});
  const view = render(<SeriesModal isOpen onClose={() => {}} onSave={onSave} categories={categories} />);
  return { ...view, onSave };
};

describe('SeriesModal', () => {
  it('saves a valid series with the first category', async () => {
    const { container, onSave } = open();
    fireEvent.change(screen.getByPlaceholderText(/شرح كتاب التوحيد/), { target: { value: 'شرح الأصول' } });
    submitForm(container);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'شرح الأصول', category_id: 'c1' }));
  });

  it('refuses an empty title', () => {
    const { container, onSave } = open();
    submitForm(container);
    expect(screen.getByText('يرجى إدخال عنوان السلسلة')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('refuses a series without a category', () => {
    const { container, onSave } = open([]);
    fireEvent.change(screen.getByPlaceholderText(/شرح كتاب التوحيد/), { target: { value: 'س' } });
    submitForm(container);
    expect(screen.getByText('يرجى اختيار القسم التابع له السلسلة')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
