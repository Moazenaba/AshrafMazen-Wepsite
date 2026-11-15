// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const h = vi.hoisted(() => ({ check: vi.fn() }));

vi.mock('../../services/dataService', () => ({ checkAdminState: h.check, logout: vi.fn() }));
vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) } },
}));
vi.mock('./AdminLogin', () => ({ AdminLogin: () => <input type="password" aria-label="كلمة المرور" /> }));
vi.mock('./AdminDashboard', () => ({ AdminDashboard: () => <p>لوحة</p> }));
vi.mock('./AdminResetPassword', () => ({ AdminResetPassword: () => <p>reset</p> }));

import { AdminPage } from './AdminPage';

describe('AdminPage gate', () => {
  it('shows a retry button, not the sign-in form, when the check is unknown', async () => {
    h.check.mockResolvedValue({ state: 'unknown' });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminPage />
      </MemoryRouter>,
    );
    const retry = await screen.findByRole('button', { name: 'إعادة المحاولة' });
    expect(screen.queryByLabelText('كلمة المرور')).toBeNull();
    h.check.mockResolvedValue({ state: 'signed-out' });
    await userEvent.click(retry);
    await waitFor(() => expect(h.check).toHaveBeenCalledTimes(2));
    expect(await screen.findByLabelText('كلمة المرور')).toBeInTheDocument();
  });
});
