// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EMPTY_FEATURE, FEATURE_STATUS_TEXT } from '../../../services/data/homeFeatureRules';

let uploaded: ((url: string) => void) | undefined;
const h = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../../../services/data/siteContent', () => ({
  getSiteContent: vi.fn(async () => ({ feature: { ...EMPTY_FEATURE, imageUrl: 'https://x.test/p.jpg', enabled: false } })),
  saveHomeFeature: h.save,
}));
vi.mock('../FileUploadButton', () => ({
  FileUploadButton: ({ onUploaded }: { onUploaded: (url: string) => void }) => {
    uploaded = onUploaded;
    return <button type="button">رفع</button>;
  },
}));

import { HomeFeatureSettings } from './HomeFeatureSettings';

describe('HomeFeatureSettings', () => {
  it('says the card is off when it is not enabled', async () => {
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
  });

  it('switches the card on after a picture is uploaded', async () => {
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
    act(() => uploaded!('https://x.test/new.jpg'));
    await waitFor(() => expect(screen.getByRole('checkbox')).toBeChecked());
    expect(screen.getByText(FEATURE_STATUS_TEXT.shown)).toBeInTheDocument();
  });

  it('saves once', async () => {
    h.save.mockReset().mockImplementation(async (f) => f);
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
  });

  it('shows the message when saving is refused', async () => {
    h.save.mockReset().mockRejectedValue(new Error('أضف صورة أولاً'));
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('أضف صورة أولاً');
  });
});
