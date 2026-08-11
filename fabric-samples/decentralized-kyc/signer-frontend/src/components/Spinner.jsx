import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export default function Spinner({ label = 'Loading…' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'text.secondary', py: 2 }}>
      <CircularProgress size={18} thickness={5} />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
}
