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
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Profile() {
  usePageTitle('Profile');
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [employeeId, setEmployeeId] = useState(user?.employeeId || '');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    if (!name.trim()) return setProfileError('Name cannot be empty.');

    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), employeeId: employeeId.trim() });
      showToast('Profile updated.', 'success');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (!pwForm.currentPassword) return setPwError('Current password is required.');
    if (String(pwForm.newPassword).length < 8) return setPwError('New password must be at least 8 characters.');
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError('Passwords do not match.');

    setChangingPw(true);
    try {
      await changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed.', 'success');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Profile</Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
            <PersonRoundedIcon />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" variant="outlined" label="regulator" />
          {user?.employeeId && <Chip size="small" variant="outlined" label={`ID: ${user.employeeId}`} />}
          {user?.createdAt && (
            <Chip size="small" variant="outlined" label={`Member since ${new Date(user.createdAt).toLocaleDateString()}`} />
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Display name & Employee ID</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set a custom display name and an optional Employee ID for this account — shown instead
          of any default placeholder name.
        </Typography>
        <Box component="form" onSubmit={handleSaveProfile} noValidate>
          <TextField
            label="Display name"
            fullWidth
            margin="dense"
            value={name}
            onChange={(e) => setName(e.target.value)}
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Employee ID"
            fullWidth
            margin="dense"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. REG-014"
            inputProps={{ maxLength: 40 }}
          />
          {profileError && <Alert severity="error" sx={{ mt: 2 }}>{profileError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
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
          />
          <TextField
            label="New password"
            type="password"
            fullWidth
            margin="dense"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          <TextField
            label="Confirm new password"
            type="password"
            fullWidth
            margin="dense"
            value={pwForm.confirmPassword}
            onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
          />
          {pwError && <Alert severity="error" sx={{ mt: 2 }}>{pwError}</Alert>}
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={changingPw}>
            {changingPw ? 'Changing…' : 'Change password'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ my: 3 }} />
    </Box>
  );
}
