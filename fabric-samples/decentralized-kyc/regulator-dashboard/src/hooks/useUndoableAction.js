import { useState, useRef, useCallback, useEffect } from 'react';

const UNDO_SECONDS = 10;

// Delays a "commit" action for UNDO_SECONDS, showing a countdown the caller
// can render (e.g. via <UndoSnackbar>). If undo() is called before time runs
// out, onCommit never fires — only onUndo does. Otherwise, once the countdown
// reaches zero, onCommit fires and `pending.committing` flips true while it
// runs (for a loading spinner) until it resolves.
//
// Usage:
//   const { pending, trigger, undo } = useUndoableAction();
//   trigger('Revoking the certificate', { onCommit: async () => {...}, onUndo: () => {...} });
export function useUndoableAction() {
  const [pending, setPending] = useState(null); // { label, secondsLeft, committing }
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const callbacksRef = useRef({ onCommit: null, onUndo: null });

  const clearTimers = useCallback(() => {
    clearTimeout(timeoutRef.current);
    clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const trigger = useCallback(
    (label, { onCommit, onUndo }) => {
      clearTimers();
      callbacksRef.current = { onCommit, onUndo };
      setPending({ label, secondsLeft: UNDO_SECONDS, committing: false });

      intervalRef.current = setInterval(() => {
        setPending((p) => (p ? { ...p, secondsLeft: Math.max(0, p.secondsLeft - 1) } : p));
      }, 1000);

      timeoutRef.current = setTimeout(async () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPending((p) => (p ? { ...p, committing: true } : p));
        try {
          await callbacksRef.current.onCommit?.();
        } finally {
          setPending(null);
        }
      }, UNDO_SECONDS * 1000);
    },
    [clearTimers]
  );

  const undo = useCallback(() => {
    clearTimers();
    callbacksRef.current.onUndo?.();
    callbacksRef.current = { onCommit: null, onUndo: null };
    setPending(null);
  }, [clearTimers]);

  return { pending, trigger, undo };
}
