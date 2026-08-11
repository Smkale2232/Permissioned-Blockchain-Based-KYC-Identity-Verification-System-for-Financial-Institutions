import { useEffect } from 'react';

// Sets the browser tab title for whichever page uses it, restoring the
// previous title on unmount so back/forward navigation doesn't leave a
// stale title behind.
export function usePageTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · DocChain` : 'DocChain';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
