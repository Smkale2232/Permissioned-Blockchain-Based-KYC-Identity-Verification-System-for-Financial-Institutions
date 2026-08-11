import { useEffect, useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard.jsx';
import AlertCenter from '../components/AlertCenter.jsx';
import Spinner from '../components/Spinner.jsx';
import { fetchStatistics, fetchAuditTrail } from '../api/regulator.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Overview() {
  usePageTitle('Overview');
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [statsData, auditData] = await Promise.all([fetchStatistics(), fetchAuditTrail()]);
      setStats(statsData);
      setRecentEvents(auditData.slice(0, 10));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Light polling keeps the dashboard current without needing a websocket backend.
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const chartData = stats
    ? [
        { name: 'Pending', value: stats.pending },
        { name: 'Signed', value: stats.signed },
        { name: 'Rejected', value: stats.rejected },
      ]
    : [];

  if (loading) return <Spinner label="Loading overview…" />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Overview</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Total Documents" value={stats.totalDocuments} icon={<DescriptionOutlinedIcon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Pending Signature" value={stats.pending} icon={<HourglassTopRoundedIcon />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Signed" value={stats.signed} icon={<VerifiedRoundedIcon />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Rejected" value={stats.rejected} icon={<CancelRoundedIcon />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Total Users" value={stats.totalUsers} icon={<GroupOutlinedIcon />} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Revoked Certificates" value={stats.revokedCertificates} icon={<BlockRoundedIcon />} color="error" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Documents by status</Typography>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE2E9" />
                <XAxis dataKey="name" tick={{ fill: '#5C6B7A', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: '#5C6B7A', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1957C2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <AlertCenter stats={stats} recentEvents={recentEvents} />
        </Grid>
      </Grid>
    </Box>
  );
}
