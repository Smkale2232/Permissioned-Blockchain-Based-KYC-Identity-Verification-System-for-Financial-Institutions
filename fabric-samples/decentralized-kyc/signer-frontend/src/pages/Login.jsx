import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateEmail, validateLoginPassword, MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH } from '../utils/validators.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Login() {
  usePageTitle('Log in');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    return validateEmail(form.email) || validateLoginPassword(form.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      // Trim email (never trim password — leading/trailing spaces can be intentional).
      const user = await login(form.email.trim(), form.password);
      showToast(`Welcome back, ${user.name}.`, 'success');
      // Route to the right dashboard based on role returned by the backend.
      if (user.role === 'signer') navigate('/signer');
      else navigate('/dashboard');
    } catch (err) {
      // The API is expected to return { message: '...' } on failure.
      // Intentionally generic fallback — never assume or surface whether it was
      // the email or the password that was wrong (avoids user-enumeration hints).
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    }
  };

  return (
    <Paper variant="outlined" sx={{ maxWidth: 420, mx: 'auto', p: 4, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <LockOutlinedIcon fontSize="small" />
        </Avatar>
        <Typography variant="h5">Log in</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          inputProps={{ maxLength: MAX_EMAIL_LENGTH }}
        />

        <TextField
          id="password"
          name="password"
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
          inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
        />

        <Typography variant="body2" sx={{ textAlign: 'right', mt: 0.5 }}>
          <Link component={RouterLink} to="/forgot-password">Forgot password?</Link>
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} role="alert">
            {error}
          </Alert>
        )}

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        No account? <Link component={RouterLink} to="/register">Sign up</Link>
      </Typography>
    </Paper>
  );
}
