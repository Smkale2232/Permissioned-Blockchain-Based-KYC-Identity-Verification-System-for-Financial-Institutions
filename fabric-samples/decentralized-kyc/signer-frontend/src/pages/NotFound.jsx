import { Link as RouterLink } from 'react-router-dom';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Not Found');
  return (
    <Paper variant="outlined" sx={{ maxWidth: 480, mx: 'auto', mt: 5, p: 5, textAlign: 'center', borderRadius: 3 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>Page not found</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        That page doesn't exist, or you don't have access to it.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Back to home
      </Button>
    </Paper>
  );
}
