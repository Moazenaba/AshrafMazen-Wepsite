import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  stored: true,
  getUser: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  admins: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  hasStoredSession: () => h.stored,
  supabase: {
    auth: { getUser: h.getUser, signOut: h.signOut },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: h.admins }) }) }),
  },
}));

import { checkAdminState, checkCurrentAdmin } from './auth';

const user = { id: 'u1', email: 'a@b.test', user_metadata: { name: 'م' } };

beforeEach(() => {
  h.stored = true;
  h.getUser.mockReset().mockResolvedValue({ data: { user }, error: null });
  h.signOut.mockClear();
  h.admins.mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('checkAdminState', () => {
  it('is signed-out with no stored session, without asking', async () => {
    h.stored = false;
    expect(await checkAdminState()).toEqual({ state: 'signed-out' });
    expect(h.getUser).not.toHaveBeenCalled();
  });

  it('is unknown (no sign-out) when the admins query fails', async () => {
    h.admins.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } });
    expect(await checkAdminState()).toEqual({ state: 'unknown' });
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it('is not-admin and signs out once when there is no row', async () => {
    h.admins.mockResolvedValue({ data: null, error: null });
    expect(await checkAdminState()).toEqual({ state: 'not-admin' });
    expect(h.signOut).toHaveBeenCalledTimes(1);
  });

  it('is admin with the user e-mail when there is a row', async () => {
    h.admins.mockResolvedValue({ data: { user_id: 'u1' }, error: null });
    const result = await checkAdminState();
    expect(result.state).toBe('admin');
    expect(result.state === 'admin' && result.user.email).toBe('a@b.test');
  });

  it('is unknown (no sign-out) when getUser rejects', async () => {
    h.getUser.mockRejectedValue(new Error('offline'));
    expect(await checkAdminState()).toEqual({ state: 'unknown' });
    expect(h.signOut).not.toHaveBeenCalled();
  });

  it('is unknown for a network error from getUser, signed-out for a rejected session', async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Failed to fetch' } });
    expect(await checkAdminState()).toEqual({ state: 'unknown' });
    h.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt', status: 401 } });
    expect(await checkAdminState()).toEqual({ state: 'signed-out' });
  });
});

describe('checkCurrentAdmin', () => {
  it('gives null for anything but an admin', async () => {
    h.admins.mockResolvedValue({ data: null, error: { message: 'x' } });
    expect(await checkCurrentAdmin()).toBeNull();
  });
});
