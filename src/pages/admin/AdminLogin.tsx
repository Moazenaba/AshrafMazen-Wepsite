import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowLeft, Eye, EyeOff, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';
import { login, requestPasswordReset } from '../../services/dataService';
import { ThemeToggle } from '../../components/ThemeToggle';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const LOCKOUT_KEY = 'sheikh_mazen_auth_lockout';
const ATTEMPTS_KEY = 'sheikh_mazen_failed_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password reset flow state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Lockout state
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    const checkLockout = () => {
      try {
        const lockoutUntil = parseInt(localStorage.getItem(LOCKOUT_KEY) || '0', 10);
        const now = Date.now();
        if (lockoutUntil > now) {
          setLockoutRemaining(Math.ceil((lockoutUntil - now) / 1000));
        } else {
          setLockoutRemaining(0);
        }
      } catch {
        setLockoutRemaining(0);
      }
    };

    checkLockout();
    const interval = setInterval(checkLockout, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFailedAttempt = () => {
    try {
      const current = parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(current));

      if (current >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
        localStorage.setItem(LOCKOUT_KEY, String(lockoutTime));
        localStorage.removeItem(ATTEMPTS_KEY);
        setLockoutRemaining(60);
      }
    } catch (e) {
      console.error('Lockout error:', e);
    }
  };

  const handleSuccessfulAttempt = () => {
    try {
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockoutRemaining > 0) {
      setError(`تم تعليق محاولات تسجيل الدخول مؤقتاً. يرجى الانتظار ${lockoutRemaining} ثانية.`);
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      handleSuccessfulAttempt();
      onLoginSuccess();
      navigate('/admin');
    } catch (err: any) {
      handleFailedAttempt();
      setError(err.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetLoading(true);
    try {
      await requestPasswordReset(resetEmail);
    } catch (err) {
      console.error('Password reset request error:', err);
    } finally {
      setResetLoading(false);
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-stone-200 dark:border-stone-800 space-y-6 relative">
        <div className="absolute top-6 left-6">
          <ThemeToggle size="sm" />
        </div>

        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 flex items-center justify-center mx-auto shadow-md border border-amber-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="font-amiri text-3xl font-bold text-stone-900 dark:text-stone-100">
            {isResetMode ? 'استعادة كلمة المرور' : 'إدارة الموقع'}
          </h1>
          <p className="text-sm font-semibold text-stone-700 dark:text-stone-300 font-cairo">
            بوابة الإدارة الخاصة بموقع الشيخ أشرف مازن
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            هذه البوابة مخصصة لمديري الموقع فقط
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lockout Warning Banner */}
        {lockoutRemaining > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-semibold text-center border border-amber-200 dark:border-amber-800">
            تم إيقاف المحاولات مؤقتاً لتجاوز الحد المسموح. يرجى الانتظار {lockoutRemaining} ثانية.
          </div>
        )}

        {/* Mode 1: Standard Login Form */}
        {!isResetMode ? (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  dir="ltr"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-stone-700 dark:text-stone-300">
                  كلمة المرور
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(true);
                    setError('');
                  }}
                  className="text-xs text-emerald-700 dark:text-amber-400 hover:underline font-semibold"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 pl-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 p-1"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutRemaining > 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-50 mt-2"
            >
              {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </button>
          </form>
        ) : (
          /* Mode 2: Reset Password Form */
          <div className="space-y-4 text-sm">
            {resetSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 space-y-3 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-sm">
                  إذا كان البريد مسجلاً فسيصلك رابط الاستعادة.
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  يرجى تفقد صندوق الوارد أو البريد غير الهام (Spam).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setResetSent(false);
                    setError('');
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-800 text-white font-semibold text-xs transition-colors"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  أدخل بريدك الإلكتروني المسجل في النظام وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور:
                </p>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                      dir="ltr"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(false);
                      setError('');
                    }}
                    className="w-1/2 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-1/2 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                  >
                    {resetLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-800 dark:hover:text-amber-400 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>العودة إلى الموقع</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
