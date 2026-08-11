import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { decodeJwtPayload } from '../utils/jwt.js';

const WARN_BEFORE_MS = 2 * 60 * 1000; // warn 2 minutes before expiry

// Renders nothing — just schedules a one-time toast shortly before the JWT
// expires, so a session doesn't just silently die mid-task. Mount once near
// the root, inside both AuthProvider and ToastProvider.
export default function SessionExpiryWatcher() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (!user) return undefined;

    const token = sessionStorage.getItem('token');
    const payload = token && decodeJwtPayload(token);
    if (!payload?.exp) return undefined;

    const expiresAt = payload.exp * 1000;
    const warnAt = expiresAt - WARN_BEFORE_MS;
    const msUntilWarning = warnAt - Date.now();

    // Already past the warning point (or even expired) — don't warn, the
    // next authenticated request will 401 and axiosClient already redirects
    // to /login in that case.
    if (msUntilWarning <= 0) return undefined;

    const timer = setTimeout(() => {
      showToast('Your session will expire in a couple of minutes — save any work in progress.', 'warning', 8000);
    }, msUntilWarning);

    return () => clearTimeout(timer);
  }, [user, showToast]);

  return null;
}
