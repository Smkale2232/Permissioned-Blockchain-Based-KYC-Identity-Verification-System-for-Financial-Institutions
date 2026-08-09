import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import { requestPasswordReset } from '../api/auth';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function ForgotPassword() {
  usePageTitle('Forgot Password');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) return setError('Email is required.');

    setSubmitting(true);
    try {
      const data = await requestPasswordReset(email.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request a reset. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Paper variant="outlined" sx={{ maxWidth: 440, width: '100%', p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <LockResetRoundedIcon fontSize="small" />
          </Avatar>
          <Typography variant="h5">Forgot password</Typography>
        </Box>

        {!result && (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your regulator account email and we'll generate a reset link.
            </Typography>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {error && <Alert severity="error" sx={{ mt: 2 }} role="alert">{error}</Alert>}
            <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={submitting}>
              {submitting ? 'Requesting…' : 'Request reset link'}
            </Button>
          </Box>
        )}

        {result && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>{result.message}</Alert>
            {result.resetToken && (
              <Alert severity="info" sx={{ mb: 2 }}>
                No email service is configured in this environment, so here's the reset token
                directly: <strong>{result.resetToken}</strong>
              </Alert>
            )}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={() => navigate('/reset-password', { state: { email: email.trim(), token: result.resetToken || '' } })}
            >
              Continue to reset password
            </Button>
          </Box>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          <Link component={RouterLink} to="/login">Back to log in</Link>
        </Typography>
      </Paper>
    </Box>
  );
}
