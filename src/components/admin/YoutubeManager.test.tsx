// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_OVERRIDES } from '../../services/data/youtube';

const h = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn() }));
vi.mock('../../services/dataService', () => ({
  readYoutubeOverrides: h.read,
  saveYoutubeOverridesIfUnchanged: h.save,
  getCategories: vi.fn(async () => []),
}));
vi.mock('../../lib/youtubeLibrary', () => ({ overridesChanged: vi.fn(), useRawYoutubeLibrary: () => [] }));
vi.mock('./FileUploadButton', () => ({ FileUploadButton: () => <button type="button">رفع</button> }));
vi.mock('../../lib/timedFetch', () => ({ timedFetch: vi.fn(async () => new Response(JSON.stringify({ title: 'عنوان' }))) }));

import { YoutubeManager } from './YoutubeManager';

beforeEach(() => {
  h.read.mockReset().mockResolvedValue({ value: EMPTY_OVERRIDES, raw: null });
  h.save.mockReset().mockResolvedValue('{}');
});

const addList = async (link: string, title: string) => {
  await userEvent.type(await screen.findByLabelText('رابط الفيديو أو القائمة'), link);
  if (title) await userEvent.type(screen.getByLabelText('العنوان'), title);
  await userEvent.click(screen.getByRole('button', { name: /إضافة/ }));
};

describe('YoutubeManager', () => {
  it('adds a playlist and saves once', async () => {
    render(<YoutubeManager />);
    await addList('https://www.youtube.com/playlist?list=PLabcdefghijklmnop', 'سلسلة جديدة');
    await userEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(h.save.mock.calls[0][0].extraPlaylists).toEqual([{ id: 'PLabcdefghijklmnop', title: 'سلسلة جديدة' }]);
  });

  it('refuses a playlist without a title and saves nothing', async () => {
    render(<YoutubeManager />);
    await addList('https://www.youtube.com/playlist?list=PLabcdefghijklmnop', '');
    expect(await screen.findByRole('alert')).toHaveTextContent('اكتب عنواناً للقائمة');
    expect(screen.getByRole('button', { name: /حفظ التغييرات/ })).toBeDisabled();
    expect(h.save).not.toHaveBeenCalled();
  });

  it('shows the message when saving fails', async () => {
    h.save.mockRejectedValue(new Error('تعذّر الحفظ الآن'));
    render(<YoutubeManager />);
    await addList('https://www.youtube.com/playlist?list=PLabcdefghijklmnop', 'سلسلة');
    await userEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر الحفظ الآن');
  });
});
