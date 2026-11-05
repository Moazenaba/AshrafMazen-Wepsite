// Scrolls to a "/#section" target once it has rendered (home sections load their data first),
// otherwise to the top of the new page.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToHash() {
  // `key` changes on every navigation, so tapping a link to the section already in the URL scrolls again
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }
    const id = decodeURIComponent(hash.slice(1));
    const timers: number[] = [];
    let tries = 0;
    const finder = window.setInterval(() => {
      const target = document.getElementById(id);
      tries += 1;
      if (target) {
        window.clearInterval(finder);
        target.scrollIntoView({ block: 'start' });
        // Blocks above the target may still be loading and push it down; follow it while it settles,
        // unless the visitor has scrolled away in the meantime
        let settledAt = window.scrollY;
        [400, 1200].forEach((delay) =>
          timers.push(
            window.setTimeout(() => {
              if (Math.abs(window.scrollY - settledAt) > 4) return;
              target.scrollIntoView({ block: 'start' });
              settledAt = window.scrollY;
            }, delay)
          )
        );
      } else if (tries > 30) {
        window.clearInterval(finder);
      }
    }, 100);
    return () => {
      window.clearInterval(finder);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [pathname, hash, key]);
}
