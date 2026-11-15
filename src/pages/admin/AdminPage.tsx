import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { checkAdminState, logout } from '../../services/dataService';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { AdminResetPassword } from './AdminResetPassword';
import type { AdminUser } from '../../types';

export const AdminPage: React.FC = () => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  // The check could not be completed (offline, timeout): neither signed in nor signed out
  const [unknown, setUnknown] = useState(false);
  const location = useLocation();

  const verifyAdmin = async () => {
    try {
      setLoading(true);
      setUnknown(false);
      const result = await checkAdminState();
      setUnknown(result.state === 'unknown');
      setAdmin(result.state === 'admin' ? result.user : null);
    } catch {
      setUnknown(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyAdmin();

    // Enforce noindex/nofollow on admin routes
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const createdMeta = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    const previousContent = meta.content;
    meta.content = 'noindex, nofollow';

    // Listen to Supabase auth state changes to protect admin routes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setAdmin(null);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Verify user against admins table
        const { data: adminRecord, error: adminError } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        // A failed request says nothing about who the user is: keep the screen as it is
        if (adminError) {
          setLoading(false);
          return;
        }
        if (adminRecord) {
          setAdmin({
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'مدير الموقع',
            role: 'admin',
          });
        } else {
          setAdmin(null);
          await supabase.auth.signOut();
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (createdMeta && meta?.parentNode) {
        meta.parentNode.removeChild(meta);
      } else if (meta) {
        meta.content = previousContent || '';
      }
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setAdmin(null);
  };

  // Dedicated reset password page
  if (location.pathname === '/admin/reset-password') {
    return <AdminResetPassword />;
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-800 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-stone-500 font-cairo">جاري التحقق من الصلاحيات...</span>
      </div>
    );
  }

  if (unknown) {
    return (
      <div role="alert" className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="font-semibold text-stone-800 dark:text-stone-100">تعذّر التحقق من الجلسة. تحقق من الاتصال.</p>
        <button type="button" onClick={verifyAdmin} className="h-11 px-5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold">
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="reset-password" element={<AdminResetPassword />} />
      <Route
        path="*"
        element={
          admin ? (
            <AdminDashboard admin={admin} onLogout={handleLogout} />
          ) : (
            <AdminLogin onLoginSuccess={verifyAdmin} />
          )
        }
      />
    </Routes>
  );
};
