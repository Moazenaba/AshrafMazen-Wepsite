// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_WELCOME } from '../../../services/data/welcomeSoundRules';

const h = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock('../../../services/data/siteContent', () => ({ getSiteContent: h.get, saveWelcomeSound: h.save, removeWelcomeSound: h.remove }));
vi.mock('../FileUploadButton', () => ({ FileUploadButton: () => <button type="button">رفع</button> }));

import { WelcomeSoundSettings } from './WelcomeSoundSettings';

const content = (welcome: object) => ({ welcome: { ...EMPTY_WELCOME, ...welcome } });

beforeEach(() => {
  h.get.mockReset().mockResolvedValue(content({ url: '/api/r2?file=audio%2Fw.mp3', enabled: false }));
  h.save.mockReset().mockImplementation(async (s) => s);
  h.remove.mockReset().mockResolvedValue(EMPTY_WELCOME);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('WelcomeSoundSettings', () => {
  it('saves once and confirms', async () => {
    render(<WelcomeSoundSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /^حفظ$/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('status')).toHaveTextContent('تم الحفظ');
  });

  it('shows the message when saving is refused', async () => {
    h.save.mockRejectedValue(new Error('أضف رابط الصوت'));
    render(<WelcomeSoundSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /^حفظ$/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('أضف رابط الصوت');
  });

  it('can remove the sound it lets you set', async () => {
    render(<WelcomeSoundSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /حذف/ }));
    await waitFor(() => expect(h.remove).toHaveBeenCalledTimes(1));
  });
});
