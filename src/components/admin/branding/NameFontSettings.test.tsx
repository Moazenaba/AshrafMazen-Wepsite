// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NAME_FONTS } from '../../../constants/nameFonts';

const h = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../../services/dataService', () => ({ getSiteSettings: h.get, saveSiteSettings: h.save }));
vi.mock('../../../lib/applyNameFont', () => ({ applyNameFont: vi.fn() }));

import { NameFontSettings } from './NameFontSettings';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ banner_name: 'الاسم', banner_font: NAME_FONTS[0].id });
  h.save.mockReset().mockResolvedValue(undefined);
});

describe('NameFontSettings', () => {
  it('saves the chosen font once', async () => {
    render(<NameFontSettings />);
    const other = NAME_FONTS[1];
    // the unchosen fonts are the buttons with aria-pressed=false; the second font is the first of them
    await userEvent.click((await screen.findAllByRole('button', { pressed: false }))[0]);
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(h.save).toHaveBeenCalledWith({ banner_font: other.id });
  });

  it('keeps save disabled until another font is chosen', async () => {
    render(<NameFontSettings />);
    await screen.findAllByRole('button', { pressed: true });
    expect(screen.getByRole('button', { name: /حفظ/ })).toBeDisabled();
    expect(h.save).not.toHaveBeenCalled();
  });

  it('shows the message when saving fails', async () => {
    h.save.mockRejectedValue(new Error('تعذّر الحفظ الآن'));
    render(<NameFontSettings />);
    await userEvent.click((await screen.findAllByRole('button', { pressed: false }))[0]);
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('تعذّر الحفظ الآن');
  });
});
