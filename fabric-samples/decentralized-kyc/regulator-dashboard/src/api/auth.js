import axiosClient from './axiosClient';

export async function loginRequest(email, password) {
  const { data } = await axiosClient.post('/auth/login', { email, password });
  return data; // { token, user }
}

// PUT /api/auth/profile — update display name and/or Employee ID
export async function updateProfileRequest(payload) {
  const { data } = await axiosClient.put('/auth/profile', payload);
  return data;
}

// POST /api/auth/change-password
export async function changePasswordRequest(currentPassword, newPassword) {
  const { data } = await axiosClient.post('/auth/change-password', { currentPassword, newPassword });
  return data;
}

// POST /api/auth/forgot-password — { email }
// Dev note: no email service is configured, so the response includes a
// `resetToken` field directly (see backend/src/controllers/auth.controller.js).
export async function requestPasswordReset(email) {
  const { data } = await axiosClient.post('/auth/forgot-password', { email });
  return data;
}

// POST /api/auth/reset-password — { email, token, newPassword }
export async function resetPasswordRequest(email, token, newPassword) {
  const { data } = await axiosClient.post('/auth/reset-password', { email, token, newPassword });
  return data;
}
