import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateUserPassword } from '../../services/dataService';
import { ThemeToggle } from '../../components/ThemeToggle';

export const AdminResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check current session or listen to PASSWORD_RECOVERY event
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsRecoveryReady(true);
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setIsRecoveryReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 10) {
      return 'يجب ألا يقل طول كلمة المرور عن 10 خانات.';
    }
    const hasLetter = /[a-zA-Z\u0621-\u064A]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    if (!hasLetter || !hasNumber) {
      return 'يجب أن تحتوي كلمة المرور على أحرف وأرقام معاً.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين، يرجى التأكد من التطابق.');
      return;
    }

    setLoading(true);

    try {
      await updateUserPassword(password);
      setSuccess(true);
      // Sign out and redirect after 2 seconds
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate('/admin');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-200 dark:border-stone-800 space-y-6 relative">
        <div className="absolute top-6 left-6">
          <ThemeToggle size="sm" />
        </div>

        {/* Brand & Title */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center mx-auto shadow-md border border-amber-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">
            تعيين كلمة مرور جديدة
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            يرجى إدخال كلمة مرور قوية وجديدة لحساب الإدارة
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="font-amiri text-xl font-bold">تم تغيير كلمة المرور بنجاح</h3>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              سيتم نقلك تلقائياً إلى صفحة تسجيل الدخول...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                كلمة المرور الجديدة <span className="text-stone-400 font-normal text-xs">(10 خانات كحد أدنى تشمل حروفاً وأرقاماً)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-2.5 pr-10 pl-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full px-4 py-2.5 pr-10 pl-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? 'جاري حفظ كلمة المرور...' : 'حفظ كلمة المرور وتأكيد الحساب'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
