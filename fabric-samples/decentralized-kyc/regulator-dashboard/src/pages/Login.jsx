import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Link from '@mui/material/Link';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Login() {
  usePageTitle('Log in');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      const user = await login(form.email.trim(), form.password);
      showToast(`Welcome, ${user.name}.`, 'success');
      navigate('/overview');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper variant="outlined" sx={{ maxWidth: 420, width: '100%', p: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            <GavelRoundedIcon fontSize="small" />
          </Avatar>
          <Typography variant="h5">Regulator Console</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Restricted access. Log in with your regulator credentials.
        </Typography>

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
      </Paper>
    </Box>
  );
}
