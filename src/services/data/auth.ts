// Admin sign-in with Supabase Auth and the admins table.
import { hasStoredSession, supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { AdminUser } from '../../types';

// Logs only a message and a status, never a whole error object (it can carry tokens and addresses)
const logError = (label: string, err: unknown) => {
  const e = err as { message?: string; status?: number } | null;
  console.error(label, e?.message ?? String(err), e?.status ?? '');
};

/**
 * Login with Supabase Auth and verify existence in admins table
 */
export async function login(email: string, password: string): Promise<AdminUser> {
  const cleanEmail = email.trim().toLowerCase();

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (authErr || !authData.user) {
    logError('Login auth error:', authErr);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // Verify that the user exists in the "admins" table
  const { data: adminRecord, error: adminErr } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (adminErr || !adminRecord) {
    logError('User not in admins table:', adminErr || 'Not found');
    await supabase.auth.signOut();
    throw new Error('ليس لديك صلاحية الدخول');
  }

  const adminUser: AdminUser = {
    email: authData.user.email || cleanEmail,
    name: authData.user.user_metadata?.name || 'مدير النظام',
    role: 'admin',
  };

  return adminUser;
}

export type AdminCheck = { state: 'admin'; user: AdminUser } | { state: 'not-admin' } | { state: 'signed-out' } | { state: 'unknown' };

/**
 * Who is signed in, and are they an admin? A failed request (offline, timeout) is `unknown`: it never signs anyone out.
 */
export async function checkAdminState(): Promise<AdminCheck> {
  // No saved session in this browser: not signed in, and no need to download the sign-in client to find that out
  if (!hasStoredSession()) return { state: 'signed-out' };
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      // An expired or rejected session is a real sign-out; a network failure is not
      const status = (userError as { status?: number }).status;
      return status === 401 || status === 403 ? { state: 'signed-out' } : { state: 'unknown' };
    }
    if (!user) return { state: 'signed-out' };

    const { data: adminRecord, error } = await supabase.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error) {
      logError('checkAdminState admins query:', error);
      return { state: 'unknown' };
    }
    if (!adminRecord) {
      await supabase.auth.signOut();
      return { state: 'not-admin' };
    }
    return { state: 'admin', user: { email: user.email || '', name: user.user_metadata?.name || 'مدير الموقع', role: 'admin' } };
  } catch (err) {
    logError('checkAdminState error:', err);
    return { state: 'unknown' };
  }
}

/**
 * Check if the current logged-in user is an admin
 */
export async function checkCurrentAdmin(): Promise<AdminUser | null> {
  const result = await checkAdminState();
  return result.state === 'admin' ? result.user : null;
}

export async function logout(): Promise<boolean> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    logError('Logout error:', err);
  }
  return true;
}

/**
 * Request password recovery email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const redirectTo = `${window.location.origin}/admin/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo,
  });

  if (error) {
    logError('resetPasswordForEmail error:', error);
  }
  // Neutral message always displayed as per requirement
}

/**
 * Update the user password (used in reset-password flow or inside dashboard)
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new Error(translateSupabaseError(error));
  }
}
