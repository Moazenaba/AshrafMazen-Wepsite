// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { submitForm } from '../../../test/formHelpers';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  upload: vi.fn(),
}));
vi.mock('../../../services/dataService', () => ({ getSiteSettings: h.get, saveSiteSettings: h.save, uploadBrandingLogo: h.upload }));

import { BannerSettings } from './BannerSettings';

const NAME = 'أبو عبد الرحمن أشرف بن طه بن مازن';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ banner_name: 'الاسم', banner_logo_url: '', banner_font: 'default', about_sheikh: '' });
  h.save.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('BannerSettings', () => {
  it('saves the settings once', async () => {
    const { container } = render(<BannerSettings />);
    const name = await screen.findByPlaceholderText(NAME);
    fireEvent.change(name, { target: { value: 'اسم جديد' } });
    submitForm(container);
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ banner_name: 'اسم جديد' }));
  });

  it('shows the error when saving fails', async () => {
    h.save.mockRejectedValue(new Error('تعذّر الحفظ الآن'));
    const { container } = render(<BannerSettings />);
    await screen.findByPlaceholderText(NAME);
    submitForm(container);
    expect(await screen.findByText(/تعذّر الحفظ الآن/)).toBeInTheDocument();
  });

  it('refuses a logo of a wrong type before uploading', async () => {
    const { container } = render(<BannerSettings />);
    await screen.findByPlaceholderText(NAME);
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [new File(['x'], 'logo.svg', { type: 'image/svg+xml' })] } });
    expect(await screen.findByText(/غير مدعومة/)).toBeInTheDocument();
    expect(h.upload).not.toHaveBeenCalled();
  });
});
