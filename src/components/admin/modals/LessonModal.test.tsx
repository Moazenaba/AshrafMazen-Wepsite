// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LessonModal } from './LessonModal';
import { category, series } from '../../../test/factories';
import { submitForm } from '../../../test/formHelpers';

vi.mock('../../../services/dataService', () => ({ uploadAudioFile: vi.fn() }));

const open = (extra: Partial<React.ComponentProps<typeof LessonModal>> = {}) => {
  const onSave = vi.fn(async () => {});
  const view = render(
    <LessonModal isOpen onClose={() => {}} onSave={onSave} seriesList={[series({ id: 's1' })]} categories={[category()]} {...extra} />,
  );
  return { ...view, onSave };
};
const title = () => screen.getByPlaceholderText(/باب فضل التوحيد/);

describe('LessonModal', () => {
  it('saves a valid lesson once', async () => {
    const { container, onSave } = open();
    fireEvent.change(title(), { target: { value: 'درس جديد' } });
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'نص التفريغ' } });
    submitForm(container);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: 'درس جديد', series_id: 's1', transcript: 'نص التفريغ' }));
  });

  it('refuses an empty title with the message and does not save', () => {
    const { container, onSave } = open();
    submitForm(container);
    expect(screen.getByText('يرجى إدخال عنوان الدرس')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('refuses a published lesson with nothing to play or read', () => {
    const { container, onSave } = open();
    fireEvent.change(title(), { target: { value: 'درس' } });
    submitForm(container);
    expect(screen.getByText(/لا يمكن نشر درس بلا فيديو/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
