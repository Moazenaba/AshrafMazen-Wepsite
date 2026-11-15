// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({ info: vi.fn(), restore: vi.fn() }));
vi.mock('../../services/data/recordAdmin', async (orig) => ({ ...(await orig<typeof import('../../services/data/recordAdmin')>()), getRecordInfo: h.info, restorePrevious: h.restore }));

import { RecordSizes } from './RecordSizes';

const info = (over: object = {}) => ({ key: 'library_books', label: 'المكتبة (الكتب)', bytes: 12000, items: 7, hasPrevious: true, level: 'ok', ...over });

beforeEach(() => {
  h.info.mockReset().mockResolvedValue([info(), info({ key: 'lesson_extras', label: 'الدروس', bytes: 650000, items: 3, hasPrevious: false, level: 'warn' })]);
  h.restore.mockReset().mockResolvedValue(undefined);
});

describe('RecordSizes', () => {
  it('shows sizes and counts, and flags a list near the limit', async () => {
    render(<RecordSizes />);
    expect(await screen.findByText(/12 ك.ب · 7 عنصر/)).toBeInTheDocument();
    expect(screen.getByText(/650 ك.ب · 3 عنصر · يقترب من الحد/)).toBeInTheDocument();
  });

  it('asks for a confirm before restoring, and restores once', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<RecordSizes />);
    const button = await screen.findByRole('button', { name: 'استرجاع النسخة السابقة' });
    await userEvent.click(button);
    expect(confirm).toHaveBeenCalled();
    expect(h.restore).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(button);
    await waitFor(() => expect(h.restore).toHaveBeenCalledWith('library_books'));
  });

  it('shows the message when the restore fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    h.restore.mockRejectedValue(new Error('لا توجد نسخة سابقة لهذا السجل.'));
    render(<RecordSizes />);
    await userEvent.click(await screen.findByRole('button', { name: 'استرجاع النسخة السابقة' }));
    expect(await screen.findByRole('status')).toHaveTextContent('لا توجد نسخة سابقة');
  });
});
