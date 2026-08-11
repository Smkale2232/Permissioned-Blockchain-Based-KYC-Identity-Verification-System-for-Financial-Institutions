import axiosClient from './axiosClient';

// POST /api/auth/forgot-password — { email }
// Dev note: since no email service is configured, the response includes a
// `resetToken` field directly (see backend/src/controllers/auth.controller.js).
// In production this token would be emailed instead of returned here.
export function requestPasswordReset(email) {
  return axiosClient.post('/auth/forgot-password', { email }).then((res) => res.data);
}

// POST /api/auth/reset-password — { email, token, newPassword }
export function resetPassword(email, token, newPassword) {
  return axiosClient.post('/auth/reset-password', { email, token, newPassword }).then((res) => res.data);
}
