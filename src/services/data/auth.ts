// Admin sign-in with Supabase Auth and the admins table.
import { supabase } from '../../lib/supabase';
import { translateSupabaseError } from '../../utils/supabaseErrors';
import type { AdminUser } from '../../types';

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
    console.error('Login auth error:', authErr);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // Verify that the user exists in the "admins" table
  const { data: adminRecord, error: adminErr } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (adminErr || !adminRecord) {
    console.error('User not in admins table:', adminErr || 'Not found');
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

/**
 * Check if the current logged-in user is an admin
 */
export async function checkCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: adminRecord } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!adminRecord) {
      await supabase.auth.signOut();
      return null;
    }

    return {
      email: user.email || '',
      name: user.user_metadata?.name || 'مدير الموقع',
      role: 'admin',
    };
  } catch (err) {
    console.error('checkCurrentAdmin error:', err);
    return null;
  }
}

export async function logout(): Promise<boolean> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout error:', err);
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
    console.error('resetPasswordForEmail error:', error);
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
