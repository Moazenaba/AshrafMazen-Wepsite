// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_LIVE } from '../../../services/data/liveStreamRules';

const h = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../../services/data/siteContent', () => ({ getSiteContent: h.get, saveLiveStream: h.save }));
vi.mock('../../../lib/timedFetch', () => ({ timedFetch: vi.fn(async () => new Response(JSON.stringify({ live: false }))) }));

import { LiveStreamSettings } from './LiveStreamSettings';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ live: EMPTY_LIVE });
  h.save.mockReset().mockImplementation(async (l) => l);
});

describe('LiveStreamSettings', () => {
  it('saves once with the Telegram link', async () => {
    render(<LiveStreamSettings />);
    await userEvent.type(await screen.findByLabelText('رابط البث على تليجرام'), 'https://t.me/x');
    await userEvent.click(screen.getByRole('button', { name: /^حفظ$/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ telegramUrl: 'https://t.me/x' }));
  });

  it('shows the refusal message from the save rule', async () => {
    h.save.mockRejectedValue(new Error('رابط تليجرام غير صحيح.'));
    render(<LiveStreamSettings />);
    await screen.findByLabelText('رابط البث على تليجرام');
    await userEvent.click(screen.getByRole('button', { name: /^حفظ$/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('رابط تليجرام غير صحيح.');
  });
});
