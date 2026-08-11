import axios from 'axios';
import { increment, decrement } from './fetchingState.js';

// Matches the Express server + /api prefix.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Warn (don't silently proceed) if we're about to send credentials over plain HTTP
// in a production build — JWTs and document data would be readable on the network.
if (import.meta.env.PROD && BASE_URL.startsWith('http://') && !BASE_URL.includes('localhost')) {
  // eslint-disable-next-line no-console
  console.warn('[security] VITE_API_BASE_URL is not HTTPS in a production build. Traffic is unencrypted.');
}

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // fail loudly instead of hanging forever on a dead backend
});

// Attach the JWT (if present) to every outgoing request, and count it as
// in-flight so the thin top progress bar (see Layout.jsx) can show activity
// without any individual page having to manage that state itself.
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  increment();
  return config;
});

// Global 401 handling — token expired or invalid, force back to login.
// Global 403 handling — authenticated but not permitted; don't wipe the session,
// just surface it (the calling page's catch block shows the message).
axiosClient.interceptors.response.use(
  (response) => {
    decrement();
    return response;
  },
  (error) => {
    decrement();
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
