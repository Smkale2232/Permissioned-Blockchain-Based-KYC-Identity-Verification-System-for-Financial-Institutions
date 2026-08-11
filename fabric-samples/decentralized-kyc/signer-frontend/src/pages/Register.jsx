import { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { useAuth } from '../context/AuthContext.jsx';
import PinInput from '../components/PinInput.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';
import {
  validateEmail,
  validateName,
  validateNewPassword,
  validateNewPin,
  MAX_EMAIL_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PASSWORD_LENGTH,
  PIN_MAX_LENGTH,
} from '../utils/validators.js';

const ROLES = ['user', 'signer'];

export default function Register() {
  usePageTitle('Register');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    pin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect after a successful registration — cleaned up properly so it can't
  // fire (or throw) after the component has already unmounted.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate('/login'), 1200);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    if (!ROLES.includes(form.role)) return 'Choose a valid role.';
    return (
      validateName(form.name) ||
      validateEmail(form.email) ||
      validateNewPassword(form.password) ||
      (form.password !== form.confirmPassword ? 'Passwords do not match.' : '') ||
      validateNewPin(form.pin, form.confirmPin)
    );
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
      // Sent to /api/auth/register.
      // Trimmed fields only; password is sent as-typed (never trimmed).
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        pin: form.pin,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ maxWidth: 420, mx: 'auto', p: 5, textAlign: 'center', borderRadius: 3 }}>
        <Avatar sx={{ bgcolor: 'success.main', mx: 'auto', mb: 2, width: 48, height: 48 }}>
          <CheckCircleOutlineRoundedIcon />
        </Avatar>
        <Typography variant="h5" sx={{ mb: 1 }}>Account created</Typography>
        <Typography variant="body2" color="text.secondary">Redirecting you to log in…</Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ maxWidth: 420, mx: 'auto', p: 4, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <PersonAddAltRoundedIcon fontSize="small" />
        </Avatar>
        <Typography variant="h5">Create account</Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          id="name"
          name="name"
          label="Full name"
          fullWidth
          margin="normal"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          inputProps={{ maxLength: MAX_NAME_LENGTH }}
        />

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
          autoComplete="new-password"
          inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          helperText="At least 8 characters, with upper, lower, and a number."
        />

        <TextField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          fullWidth
          margin="normal"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
        />

        <TextField
          id="role"
          name="role"
          select
          label="I am a"
          fullWidth
          margin="normal"
          value={form.role}
          onChange={handleChange}
        >
          <MenuItem value="user">Document uploader (User)</MenuItem>
          <MenuItem value="signer">Signer</MenuItem>
        </TextField>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>Set a 4–6 digit PIN</Typography>
          <PinInput value={form.pin} onChange={(v) => setForm({ ...form, pin: v })} />
          <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.75 }}>
            You'll enter this PIN every time you upload or sign a document.
          </Typography>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <Typography variant="body2" sx={{ mb: 0.75 }}>Confirm PIN</Typography>
          <PinInput value={form.confirmPin} onChange={(v) => setForm({ ...form, confirmPin: v })} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} role="alert">
            {error}
          </Alert>
        )}

        <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
        Already have an account? <Link component={RouterLink} to="/login">Log in</Link>
      </Typography>
    </Paper>
  );
}
