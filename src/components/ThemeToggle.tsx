import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي';

  const sizeClasses = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-11 h-11 p-3',
  }[size];

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center rounded-xl text-stone-600 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400 bg-stone-100/80 dark:bg-stone-900 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 border border-stone-200/80 dark:border-stone-800 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-amber-400 overflow-hidden ${sizeClasses} ${className}`}
    >
      {/* Sun Icon for Dark Mode (active when isDark) */}
      <Sun
        className={`${iconSizes} text-amber-400 absolute transition-all duration-300 ease-in-out ${
          isDark
            ? 'rotate-0 scale-100 opacity-100'
            : 'rotate-90 scale-0 opacity-0'
        }`}
      />

      {/* Moon Icon for Light Mode (active when not isDark) */}
      <Moon
        className={`${iconSizes} text-stone-700 dark:text-stone-300 absolute transition-all duration-300 ease-in-out ${
          isDark
            ? '-rotate-90 scale-0 opacity-0'
            : 'rotate-0 scale-100 opacity-100'
        }`}
      />

      <span className="sr-only">{label}</span>
    </button>
  );
};
