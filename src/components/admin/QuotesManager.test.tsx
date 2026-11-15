// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_HERO } from '../../services/data/siteContentRules';

const h = vi.hoisted(() => ({ get: vi.fn(), saveQuotes: vi.fn(), saveHero: vi.fn() }));
vi.mock('../../services/data/siteContent', () => ({ getSiteContent: h.get, saveQuotes: h.saveQuotes, saveHeroQuote: h.saveHero }));

import { QuotesManager } from './QuotesManager';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ quotes: [{ text: 'قول أول', source: 'مصدر' }], hero: DEFAULT_HERO });
  h.saveQuotes.mockReset().mockImplementation(async (q) => q);
});

describe('QuotesManager', () => {
  it('saves the edited quotes once', async () => {
    render(<QuotesManager />);
    const text = await screen.findByLabelText('نص الحديث 1');
    await userEvent.type(text, ' معدّل');
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    await waitFor(() => expect(h.saveQuotes).toHaveBeenCalledTimes(1));
    expect(h.saveQuotes.mock.calls[0][0][0].text).toContain('معدّل');
  });

  it('keeps save disabled until something changed', async () => {
    render(<QuotesManager />);
    await screen.findByLabelText('نص الحديث 1');
    expect(screen.getByRole('button', { name: /حفظ/ })).toBeDisabled();
  });

  it('shows the message when saving is refused', async () => {
    h.saveQuotes.mockRejectedValue(new Error('أضف نصاً للحديث'));
    render(<QuotesManager />);
    await userEvent.type(await screen.findByLabelText('نص الحديث 1'), 'س');
    await userEvent.click(screen.getByRole('button', { name: /حفظ/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('أضف نصاً للحديث');
  });

  it('can remove a quote', async () => {
    render(<QuotesManager />);
    await screen.findByLabelText('نص الحديث 1');
    await userEvent.click(screen.getAllByRole('button', { name: 'حذف' })[0]);
    expect(screen.queryByLabelText('نص الحديث 1')).toBeNull();
  });
});
