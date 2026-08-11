// Stricter than a naive regex: rejects leading/trailing dots, consecutive dots,
// and requires a real-looking TLD. Still not a full RFC 5322 validator — that's
// not the frontend's job. The backend is the actual authority on what's a valid,
// registrable email; this only catches obvious typos before a network round-trip.
const EMAIL_RE = /^[a-zA-Z0-9](?:[a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

export const MAX_EMAIL_LENGTH = 254; // RFC 5321 limit
export const MAX_NAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (trimmed.length > MAX_EMAIL_LENGTH) return 'Email is too long.';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email.';
  return '';
}

export function validateLoginPassword(password) {
  if (!password) return 'Password is required.';
  return '';
}

// Stronger check for account creation than for login — login just needs "not empty"
// (we don't want to leak password-policy details to someone guessing credentials).
export function validateNewPassword(password) {
  if (!password) return 'Password is required.';
  if (password.length < MIN_PASSWORD_LENGTH) return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (password.length > MAX_PASSWORD_LENGTH) return 'Password is too long.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password needs upper, lower, and a number.';
  }
  return '';
}

export function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed.length > MAX_NAME_LENGTH) return 'Name is too long.';
  return '';
}

// Action PIN — set at registration, re-entered to confirm upload/sign/deny.
export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 6;
const PIN_RE = /^\d{4,6}$/;

export function validatePin(pin) {
  if (!pin) return 'PIN is required.';
  if (!PIN_RE.test(pin)) return 'PIN must be 4–6 digits.';
  return '';
}

export function validateNewPin(pin, confirmPin) {
  return validatePin(pin) || (pin !== confirmPin ? 'PINs do not match.' : '');
}
