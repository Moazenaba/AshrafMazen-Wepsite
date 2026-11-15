import React from 'react';
import { reportError } from '../lib/reportError';

interface Props {
  children: React.ReactNode;
}
interface State {
  error: Error | null;
}

const RELOAD_FLAG = 'sheikh_mazen_reloaded_for_chunk';

// A page file that cannot load usually means the site was updated while this tab was open (the old file names are
// gone). One automatic reload fetches the new version; a second failure is shown instead of looping.
export function reloadOnceForNewVersion(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) return false;
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export const isChunkError = (error: Error) => /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(error.message);

// Catches a crash in one page so the rest of the site (the header, the audio player, the footer) keeps working
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack);
    if (!isChunkError(error)) reportError('page-crash', error, { stack: info.componentStack });
    if (isChunkError(error)) reloadOnceForNewVersion();
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 space-y-5">
        <h1 className="font-ruqaa text-4xl text-mushaf dark:text-gold-soft">تعذّر عرض هذه الصفحة</h1>
        <p className="text-stone-700 dark:text-stone-300">
          حدث خطأ غير متوقع. بقية الموقع تعمل، ويمكنك المحاولة مرة أخرى أو العودة للرئيسية.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="press inline-flex items-center h-12 px-6 rounded-lg bg-mushaf hover:bg-mushaf-deep text-gold-soft font-bold"
          >
            إعادة المحاولة
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="press inline-flex items-center h-12 px-6 rounded-lg bg-gold hover:bg-gold-soft text-mushaf-deep font-bold"
          >
            تحديث الصفحة
          </button>
          <a href="/" className="inline-flex items-center min-h-12 px-3 font-semibold text-mushaf dark:text-gold hover:underline">
            الرئيسية
          </a>
        </div>
      </div>
    );
  }
}
