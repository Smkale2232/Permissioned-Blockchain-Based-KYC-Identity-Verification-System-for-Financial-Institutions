import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import { resetPassword } from '../api/auth.js';
import { validateEmail, validateNewPassword, MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from '../utils/validators.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function ResetPassword() {
  usePageTitle('Reset Password');
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: location.state?.email || '',
    token: location.state?.token || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.token.trim()) return 'Reset token is required.';
    return (
      validateEmail(form.email) ||
      validateNewPassword(form.newPassword) ||
      (form.newPassword !== form.confirmPassword ? 'Passwords do not match.' : '')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) return setError(validationError);

    setSubmitting(true);
    try {
      await resetPassword(form.email.trim(), form.token.trim(), form.newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ maxWidth: 460, mx: 'auto', p: 4, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <LockResetRoundedIcon fontSize="small" />
        </Avatar>
        <Typography variant="h5">Reset password</Typography>
      </Box>

      {done ? (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset. You can now log in with your new password.
          </Alert>
          <Button fullWidth variant="contained" size="large" onClick={() => navigate('/login')}>
            Go to log in
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            name="email"
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={form.email}
            onChange={handleChange}
            inputProps={{ maxLength: MAX_EMAIL_LENGTH }}
          />
          <TextField
            name="token"
            label="Reset token"
            fullWidth
            margin="normal"
            value={form.token}
            onChange={handleChange}
            helperText="From the Forgot Password step."
          />
          <TextField
            name="newPassword"
            label="New password"
            type="password"
            fullWidth
            margin="normal"
            value={form.newPassword}
            onChange={handleChange}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          />
          <TextField
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            fullWidth
            margin="normal"
            value={form.confirmPassword}
            onChange={handleChange}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }} role="alert">
              {error}
            </Alert>
          )}

          <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting}>
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        <Link component={RouterLink} to="/login">Back to log in</Link>
      </Typography>
    </Paper>
  );
}
