// Scroll reveal: watches every [data-reveal] element (including ones rendered later) and marks it revealed as it
// enters the viewport. Nothing is hidden until this runs, and reduced-motion visitors never get the hidden state.
import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const observeAll = (scope: ParentNode) => {
      scope.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)').forEach((el) => io.observe(el));
    };
    observeAll(document);

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) =>
        m.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.matches('[data-reveal]')) io.observe(node);
            observeAll(node);
          }
        })
      );
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, []);
}
