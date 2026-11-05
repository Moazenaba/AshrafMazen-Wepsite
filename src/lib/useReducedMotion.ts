import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// Whether the visitor asked the system for less motion; follows the setting if it changes while the page is open.
// A few lines of our own instead of the animation library, which kept 400 KB in the first download for this alone.
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(QUERY).matches);

  useEffect(() => {
    const media = window.matchMedia?.(QUERY);
    if (!media) return;
    const onChange = () => setReduce(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return Boolean(reduce);
}
