// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CategoryModal } from './CategoryModal';
import { submitForm } from '../../../test/formHelpers';

const open = (onSave = vi.fn(async () => {})) => {
  const onClose = vi.fn();
  const view = render(<CategoryModal isOpen onClose={onClose} onSave={onSave} />);
  return { ...view, onSave, onClose };
};

describe('CategoryModal', () => {
  it('saves a valid category once and closes', async () => {
    const { container, onSave, onClose } = open();
    fireEvent.change(screen.getByPlaceholderText(/العقيدة، الفقه/), { target: { value: ' الفقه ' } });
    submitForm(container);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'الفقه' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('refuses an empty name with a message and does not save', () => {
    const { container, onSave } = open();
    submitForm(container);
    expect(screen.getByText('يرجى إدخال اسم القسم')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the save error and stays open', async () => {
    const { container, onClose } = open(vi.fn(async () => { throw new Error('الاسم المختصر مستخدم'); }));
    fireEvent.change(screen.getByPlaceholderText(/العقيدة، الفقه/), { target: { value: 'س' } });
    submitForm(container);
    expect(await screen.findByText('الاسم المختصر مستخدم')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
