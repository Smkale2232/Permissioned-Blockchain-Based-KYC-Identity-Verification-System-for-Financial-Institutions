// Tracks how many requests are currently in flight, without any extra state
// management library. axiosClient's interceptors call increment()/decrement();
// useIsFetching() (a small hook) subscribes so only the thin top progress bar
// re-renders on activity — not the whole page.
let activeCount = 0;
const listeners = new Set();

function notify() {
  for (const listener of listeners) listener(activeCount > 0);
}

export function increment() {
  activeCount += 1;
  notify();
}

export function decrement() {
  activeCount = Math.max(0, activeCount - 1);
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getIsFetching() {
  return activeCount > 0;
}
