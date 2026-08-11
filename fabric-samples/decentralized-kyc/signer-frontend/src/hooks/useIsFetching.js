import { useSyncExternalStore } from 'react';
import { subscribe, getIsFetching } from '../api/fetchingState.js';

// True while at least one axios request is in flight. Backed by a module-level
// pub-sub (see fetchingState.js) so only the component reading this — the thin
// top progress bar — re-renders on activity, not the whole page.
export function useIsFetching() {
  return useSyncExternalStore(subscribe, getIsFetching, getIsFetching);
}
