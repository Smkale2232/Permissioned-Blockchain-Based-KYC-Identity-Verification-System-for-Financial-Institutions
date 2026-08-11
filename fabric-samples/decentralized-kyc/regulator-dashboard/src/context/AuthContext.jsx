import { createContext, useContext, useState, useCallback } from 'react';
import { loginRequest, updateProfileRequest, changePasswordRequest } from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_KEY = 'docchain_regulator_token';
const USER_KEY = 'docchain_regulator_user';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser());
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { token, user: loggedInUser } = await loginRequest(email, password);

      // This console is a regulator-only tool — reject anything else here even
      // though the backend already scopes /api/regulator/* by role. Failing
      // fast with a clear message beats a confusing 403 on the first click.
      if (loggedInUser.role !== 'regulator') {
        throw new Error('This console is for regulator accounts only.');
      }

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Updates the regulator's own display name and/or Employee ID — the
  // replacement for the old hardcoded seed-script name.
  const updateProfile = useCallback(async (payload) => {
    const data = await updateProfileRequest(payload);
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return changePasswordRequest(currentPassword, newPassword);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, loading, login, logout, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
