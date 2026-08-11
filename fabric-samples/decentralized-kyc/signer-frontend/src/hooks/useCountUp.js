import { useEffect, useRef, useState } from 'react';

// Animates from the previous value to `target` over `duration` ms using
// requestAnimationFrame — used by StatCard so the dashboard numbers count up
// instead of just appearing, a small "alive" touch on first load and on
// every subsequent change (e.g. a background poll bumping a count).
export function useCountUp(target, duration = 600) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;

    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic — quick start, gentle settle
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      setDisplay(value);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
}
