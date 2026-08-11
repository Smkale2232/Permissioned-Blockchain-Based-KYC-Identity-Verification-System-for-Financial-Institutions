import { useEffect, useRef, useState } from 'react';

// Polls fetchFn on an interval and returns just the latest value — the caller
// re-renders only whatever small piece of UI reads this value (e.g. a Badge),
// not the whole page. Same pattern as a live "likes" or "views" counter.
//
// fetchFn: () => Promise<value>
// intervalMs: how often to poll (default 8s)
export function useLivePoll(fetchFn, intervalMs = 8000) {
  const [value, setValue] = useState(null);
  const mounted = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  useEffect(() => {
    mounted.current = true;
    const tick = () => {
      fetchFnRef.current()
        .then((v) => mounted.current && setValue(v))
        .catch(() => {}); // a missed poll just skips this cycle — no error UI for a background refresh
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return value;
}
