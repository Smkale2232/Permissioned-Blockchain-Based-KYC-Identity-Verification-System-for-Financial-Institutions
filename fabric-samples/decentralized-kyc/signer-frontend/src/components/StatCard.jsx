import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCountUp } from '../hooks/useCountUp.js';

export default function StatCard({ label, value, icon, color = 'primary' }) {
  const displayValue = useCountUp(value);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.main`,
          color: `${color}.contrastText`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ lineHeight: 1.1, fontWeight: 700 }}>{displayValue}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{label}</Typography>
      </Box>
    </Paper>
  );
}
