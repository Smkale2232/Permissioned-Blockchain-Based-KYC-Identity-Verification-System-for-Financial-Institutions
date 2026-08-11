import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Home() {
  usePageTitle('Home');
  const { isAuthenticated, user } = useAuth();

  return (
    <Paper
      variant="outlined"
      sx={{ maxWidth: 640, mx: 'auto', mt: 5, p: 5, textAlign: 'center', borderRadius: 3 }}
    >
      <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
        <VerifiedUserOutlinedIcon />
      </Avatar>
      <Typography variant="h4" sx={{ mb: 1 }}>DocChain</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload, track, and sign documents backed by a Hyperledger Fabric network.
        Every signature and status change is recorded to an immutable audit trail.
      </Typography>

      {!isAuthenticated && (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button component={RouterLink} to="/login" variant="contained" size="large">
            Log in
          </Button>
          <Button component={RouterLink} to="/register" variant="outlined" size="large">
            Create account
          </Button>
        </Stack>
      )}

      {isAuthenticated && user?.role === 'user' && (
        <Box sx={{ mt: 1 }}>
          <Button component={RouterLink} to="/dashboard" variant="contained" size="large">
            Go to My Documents
          </Button>
        </Box>
      )}

      {isAuthenticated && user?.role === 'signer' && (
        <Box sx={{ mt: 1 }}>
          <Button component={RouterLink} to="/signer" variant="contained" size="large">
            Go to Pending Signatures
          </Button>
        </Box>
      )}
    </Paper>
  );
}
