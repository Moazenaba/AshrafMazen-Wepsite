// @vitest-environment jsdom
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DEFAULT_CONTACT } from '../../../services/data/siteContentRules';
import { submitForm } from '../../../test/formHelpers';

const h = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn() }));
vi.mock('../../../services/data/siteContent', () => ({ getSiteContent: h.get, saveContactInfo: h.save }));

import { ContactSettings } from './ContactSettings';

beforeEach(() => {
  h.get.mockReset().mockResolvedValue({ contact: DEFAULT_CONTACT });
  h.save.mockReset().mockImplementation(async (c) => c);
});

describe('ContactSettings', () => {
  it('saves a valid e-mail once', async () => {
    const { container } = render(<ContactSettings />);
    fireEvent.change(await screen.findByPlaceholderText('name@example.com'), { target: { value: 'a@b.test' } });
    submitForm(container);
    await waitFor(() => expect(h.save).toHaveBeenCalledTimes(1));
    expect(h.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.test' }));
  });

  it('refuses an invalid e-mail with the message and does not save', async () => {
    const { container } = render(<ContactSettings />);
    fireEvent.change(await screen.findByPlaceholderText('name@example.com'), { target: { value: 'not-an-email' } });
    submitForm(container);
    expect(await screen.findByText(/البريد الإلكتروني غير صحيح/)).toBeInTheDocument();
    expect(h.save).not.toHaveBeenCalled();
  });
});
