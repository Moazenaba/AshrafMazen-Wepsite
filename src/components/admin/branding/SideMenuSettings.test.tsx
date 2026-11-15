// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_MENU } from '../../../services/data/sideMenuRules';

const h = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../../services/data/siteContent', () => ({ getSiteContent: h.get, saveSideMenu: h.save }));
vi.mock('../../../services/data/portal', () => ({ getCategoriesWithPortalData: vi.fn(async () => []) }));
vi.mock('../../../lib/youtubeLibrary', () => ({ useYoutubeLibrary: () => [] }));

import { SideMenuSettings } from './SideMenuSettings';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ menu: EMPTY_MENU });
  h.save.mockReset().mockImplementation(async (m) => m);
});

describe('SideMenuSettings', () => {
  it('saves once and confirms', async () => {
    render(<SideMenuSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /حفظ/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('status')).toHaveTextContent('تم الحفظ');
  });

  it('shows the message when saving fails', async () => {
    h.save.mockRejectedValue(new Error('تعذّر الحفظ الآن'));
    render(<SideMenuSettings />);
    await userEvent.click(await screen.findByRole('button', { name: /حفظ/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر الحفظ الآن');
  });
});
