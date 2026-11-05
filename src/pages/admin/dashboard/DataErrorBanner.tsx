// Shown when the dashboard could not load its data: the reason, and a retry button.
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DataErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 text-xs sm:text-sm font-medium flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 w-full w-full">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <span>
          <strong>تعذّر تحميل بيانات اللوحة:</strong> {message}
        </span>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-900 dark:text-amber-100 rounded-lg text-xs font-bold transition-colors"
      >
        إعادة المحاولة
      </button>
    </div>
);
