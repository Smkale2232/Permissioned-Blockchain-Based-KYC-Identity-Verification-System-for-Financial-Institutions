import { useMemo } from 'react';
import Grid from '@mui/material/Grid';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import StatCard from './StatCard.jsx';

// Computed entirely from the docs already in memory — no extra API calls.
// labels: override the "Total" label, e.g. "Total Uploaded" vs "Total Pending Review".
export default function DocStatCards({ docs, totalLabel = 'Total Documents' }) {
  const counts = useMemo(() => {
    const list = docs || [];
    return {
      total: list.length,
      pending: list.filter((d) => d.status === 'pending').length,
      signed: list.filter((d) => d.status === 'signed').length,
      rejected: list.filter((d) => d.status === 'rejected').length,
    };
  }, [docs]);

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={3}>
        <StatCard label={totalLabel} value={counts.total} icon={<DescriptionOutlinedIcon fontSize="small" />} color="primary" />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Pending" value={counts.pending} icon={<HourglassTopRoundedIcon fontSize="small" />} color="warning" />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Signed" value={counts.signed} icon={<VerifiedRoundedIcon fontSize="small" />} color="success" />
      </Grid>
      <Grid item xs={6} sm={3}>
        <StatCard label="Rejected" value={counts.rejected} icon={<CancelRoundedIcon fontSize="small" />} color="error" />
      </Grid>
    </Grid>
  );
}
