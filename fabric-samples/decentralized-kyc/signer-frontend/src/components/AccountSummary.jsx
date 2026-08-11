import { Link as RouterLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import { useAuth } from '../context/AuthContext.jsx';

// Compact "who am I" card shown at the top of a dashboard — the account
// details the user asked to see at a glance, with a link to the full Profile
// page for editing.
export default function AccountSummary() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PersonRoundedIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
            <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          </Box>
          <Chip size="small" variant="outlined" label={user.role} />
          {user.employeeId && <Chip size="small" variant="outlined" label={`ID: ${user.employeeId}`} />}
          {user.createdAt && (
            <Chip
              size="small"
              variant="outlined"
              label={`Member since ${new Date(user.createdAt).toLocaleDateString()}`}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            />
          )}
        </Stack>
        <Button component={RouterLink} to="/profile" size="small" variant="outlined">
          Edit profile
        </Button>
      </Stack>
    </Paper>
  );
}
