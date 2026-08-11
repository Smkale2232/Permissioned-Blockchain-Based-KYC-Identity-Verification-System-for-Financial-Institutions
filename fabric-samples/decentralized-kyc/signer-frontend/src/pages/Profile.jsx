import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { validateName, validateNewPassword, MAX_NAME_LENGTH, MAX_PASSWORD_LENGTH } from '../utils/validators.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Profile() {
  usePageTitle('Profile');
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameError('');
    const err = validateName(name);
    if (err) return setNameError(err);

    setSavingName(true);
    try {
      await updateProfile({ name: name.trim() });
      showToast('Name updated.', 'success');
    } catch (err2) {
      setNameError(err2.response?.data?.message || 'Could not update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    const err =
      (!pwForm.currentPassword ? 'Current password is required.' : '') ||
      validateNewPassword(pwForm.newPassword) ||
      (pwForm.newPassword !== pwForm.confirmPassword ? 'Passwords do not match.' : '');
    if (err) return setPwError(err);

    setChangingPw(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed.', 'success');
    } catch (err2) {
      setPwError(err2.response?.data?.message || 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Profile</Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <PersonRoundedIcon />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <Chip size="small" variant="outlined" label={user?.role} />
          {user?.createdAt && (
            <Chip
              size="small"
              variant="outlined"
              label={`Member since ${new Date(user.createdAt).toLocaleDateString()}`}
            />
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 2 }}>Display name</Typography>
        <Box component="form" onSubmit={handleSaveName} noValidate>
          <TextField
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
          />
          {nameError && <Alert severity="error" sx={{ mt: 2 }}>{nameError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={savingName}>
            {savingName ? 'Saving…' : 'Save name'}
          </Button>
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 2 }}>Change password</Typography>
        <Box component="form" onSubmit={handleChangePassword} noValidate>
          <TextField
            label="Current password"
            type="password"
            fullWidth
            margin="dense"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          />
          <TextField
            label="New password"
            type="password"
            fullWidth
            margin="dense"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          />
          <TextField
            label="Confirm new password"
            type="password"
            fullWidth
            margin="dense"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
            inputProps={{ maxLength: MAX_PASSWORD_LENGTH }}
          />
          {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={changingPw}>
            {changingPw ? 'Changing…' : 'Change password'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />
      <Typography variant="body2" color="text.secondary">
        Your PIN (used to confirm uploads, signing, and denying) isn't shown or changeable here yet — contact support if you need it reset.
      </Typography>
    </Box>
  );
}
