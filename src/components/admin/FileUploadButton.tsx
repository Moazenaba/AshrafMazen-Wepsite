// One button that uploads a file to R2 and hands back its link, with progress and a readable error.
import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadToR2, type R2Kind } from '../../services/r2';
import { acceptOf, checkFile } from '../../constants/fileRules';


export const FileUploadButton: React.FC<{
  kind: R2Kind;
  label: string;
  onUploaded: (url: string, file: File) => void;
  onError: (message: string) => void;
  className?: string;
}> = ({ kind, label, onUploaded, onError, className = '' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const problem = checkFile(kind, file.name, file.size);
    if (problem) {
      onError(problem);
      return;
    }
    try {
      setProgress(0);
      const url = await uploadToR2(file, kind, setProgress);
      onUploaded(url, file);
    } catch (err: any) {
      onError(err?.message || 'تعذّر رفع الملف.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={acceptOf(kind)} onChange={pick} className="sr-only" tabIndex={-1} aria-hidden="true" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={progress !== null}
        className={`inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-sm font-semibold disabled:opacity-70 ${className}`}
      >
        {progress !== null ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Upload className="w-4 h-4" aria-hidden="true" />}
        {progress !== null ? `جارٍ الرفع ${Math.round(progress * 100)}٪` : label}
      </button>
    </>
  );
};
