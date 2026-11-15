// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SocialLinkModal, type SocialLinkForm } from './SocialLinkModal';
import { submitForm } from '../../../test/formHelpers';

const form: SocialLinkForm = { platform: 'telegram', url: 'https://t.me/x', is_active: true };

const open = (over: Partial<React.ComponentProps<typeof SocialLinkModal>> = {}) => {
  const props = {
    editing: null,
    form,
    urlError: '',
    saving: false,
    onFormChange: vi.fn(),
    onUrlError: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onClose: vi.fn(),
    ...over,
  };
  const view = render(<SocialLinkModal {...props} />);
  return { ...view, props };
};

describe('SocialLinkModal', () => {
  it('hands the submit to the owner once', () => {
    const { container, props } = open();
    submitForm(container);
    expect(props.onSubmit).toHaveBeenCalledTimes(1);
  });

  it('typing a link updates the form and clears an old error', () => {
    const { props } = open({ urlError: 'الرابط غير صحيح' });
    fireEvent.change(screen.getByPlaceholderText('https://t.me/sheikh_channel'), { target: { value: 'https://t.me/y' } });
    expect(props.onFormChange).toHaveBeenCalledWith({ ...form, url: 'https://t.me/y' });
    expect(props.onUrlError).toHaveBeenCalledWith('');
  });

  it('shows the link error and disables saving while it saves', () => {
    open({ urlError: 'الرابط غير صحيح', saving: true });
    expect(screen.getByText('الرابط غير صحيح')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /إضافة الرابط/ })).toBeDisabled();
  });

  it('the link field is not type=url', () => {
    const { container } = open();
    expect((container.querySelector('input[placeholder="https://t.me/sheikh_channel"]') as HTMLInputElement).type).toBe('text');
  });
});
