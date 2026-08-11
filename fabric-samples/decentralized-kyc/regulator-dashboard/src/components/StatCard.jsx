import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { useCountUp } from '../hooks/useCountUp.js';

// color: one of theme palette keys — 'primary' | 'success' | 'warning' | 'error' | 'secondary'
export default function StatCard({ label, value, icon, color = 'primary', loading }) {
  const displayValue = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: `${color}.main`, width: 44, height: 44 }}>{icon}</Avatar>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {loading ? '—' : displayValue}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
