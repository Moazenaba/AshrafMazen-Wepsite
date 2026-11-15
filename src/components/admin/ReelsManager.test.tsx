// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_REELS } from '../../lib/reelsRules';

const h = vi.hoisted(() => ({ fetchShorts: vi.fn(), get: vi.fn(), save: vi.fn() }));
vi.mock('../../lib/reels', () => ({ fetchShorts: h.fetchShorts, reelsChanged: vi.fn() }));
vi.mock('../../services/data/reels', () => ({ getReelsSettings: h.get, saveReelsSettings: h.save }));

import { ReelsManager } from './ReelsManager';

beforeEach(() => {
  h.fetchShorts.mockReset().mockResolvedValue([{ id: 'aaaaaaaaaaa', title: 'مقطع أول' }]);
  h.get.mockReset().mockResolvedValue(EMPTY_REELS);
  h.save.mockReset().mockResolvedValue(undefined);
});

describe('ReelsManager', () => {
  it('adds a clip by link, then saves once', async () => {
    render(<ReelsManager />);
    await userEvent.type(await screen.findByLabelText('رابط مقطع من يوتيوب'), 'https://youtube.com/shorts/bbbbbbbbbbb');
    await userEvent.click(screen.getByRole('button', { name: /إضافة/ }));
    await userEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(JSON.stringify(h.save.mock.calls[0][0])).toContain('bbbbbbbbbbb');
  });

  it('refuses a link it does not understand and does not save', async () => {
    render(<ReelsManager />);
    await userEvent.type(await screen.findByLabelText('رابط مقطع من يوتيوب'), 'ليس رابطاً');
    await userEvent.click(screen.getByRole('button', { name: /إضافة/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('الرابط غير مفهوم');
    expect(h.save).not.toHaveBeenCalled();
  });

  it('shows the message when saving fails', async () => {
    h.save.mockRejectedValue(new Error('تعذّر الحفظ الآن'));
    render(<ReelsManager />);
    await userEvent.click((await screen.findAllByRole('button', { name: /^حذف/ }))[0]);
    await userEvent.click(screen.getByRole('button', { name: /حفظ التغييرات/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر الحفظ الآن');
  });
});
