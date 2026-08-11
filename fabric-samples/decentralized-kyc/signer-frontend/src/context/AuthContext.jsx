import { createContext, useContext, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      // Corrupted or stale entry — treat as logged out rather than crash on load.
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      // Expected API response shape: { token, user: { id, name, email, role } }
      const { data } = await axiosClient.post('/auth/login', { email, password });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    try {
      // payload: { name, email, password, role: 'user' | 'signer' }
      const { data } = await axiosClient.post('/auth/register', payload);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  // Updates the caller's own display name (and employeeId, harmless for
  // non-regulator roles) and refreshes the cached user so the Navbar/Profile
  // page reflect it immediately without a re-login.
  const updateProfile = useCallback(async (payload) => {
    const { data } = await axiosClient.put('/auth/profile', payload);
    sessionStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    return data;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const { data } = await axiosClient.post('/auth/change-password', { currentPassword, newPassword });
    return data;
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
