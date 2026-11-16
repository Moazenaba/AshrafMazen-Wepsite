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
vi.mock('../../../services/data/videoInfo', () => ({ fetchVideoInfo: vi.fn(async () => ({ title: 'عنوان من الفيديو', author: 'قناة الفيديو' })) }));
vi.mock('../FileUploadButton', () => ({
  FileUploadButton: ({ kind, onUploaded }: { kind: string; onUploaded: (url: string) => void }) => {
    if (kind === 'hero') uploaded = onUploaded;
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

  it('Enter in the video box fills the title and the line under it, which stay editable', async () => {
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
    await userEvent.type(screen.getByLabelText('رابط فيديو يوتيوب (اختياري)'), 'https://youtu.be/loVFoAlqeCc{Enter}');
    await waitFor(() => expect(screen.getByLabelText('العنوان')).toHaveValue('عنوان من الفيديو'));
    expect(screen.getByLabelText('السطر تحت العنوان')).toHaveValue('قناة الفيديو');
    await userEvent.type(screen.getByLabelText('العنوان'), ' معدّل');
    expect(screen.getByLabelText('العنوان')).toHaveValue('عنوان من الفيديو معدّل');
  });

  it('a YouTube link alone is enough for the card to show', async () => {
    render(<HomeFeatureSettings />);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(FEATURE_STATUS_TEXT.off));
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.clear(screen.getByLabelText('أو رابط صورة'));
    await userEvent.type(screen.getByLabelText('رابط فيديو يوتيوب (اختياري)'), 'https://youtu.be/loVFoAlqeCc');
    expect(screen.getByText(FEATURE_STATUS_TEXT.shown)).toBeInTheDocument();
  });
});
