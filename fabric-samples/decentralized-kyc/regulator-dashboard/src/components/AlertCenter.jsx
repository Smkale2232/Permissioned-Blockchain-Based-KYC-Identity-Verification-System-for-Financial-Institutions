import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';

// Derives a small set of rule-based alerts from statistics + the most recent
// audit events, rather than requiring a separate real-time/websocket backend.
// This is intentionally simple — swap the `buildAlerts` rules below for
// whatever the regulator workflow actually needs flagged.
function buildAlerts(stats, recentEvents) {
  const alerts = [];

  if (stats?.revokedCertificates > 0) {
    alerts.push({
      severity: 'warning',
      title: 'Revoked certificates',
      message: `${stats.revokedCertificates} certificate${stats.revokedCertificates === 1 ? '' : 's'} currently revoked.`,
    });
  }

  if (stats?.rejected > 0) {
    alerts.push({
      severity: 'error',
      title: 'Rejected documents',
      message: `${stats.rejected} document${stats.rejected === 1 ? '' : 's'} rejected — review in All Documents.`,
    });
  }

  const recentRevokes = (recentEvents || []).filter((e) => e.action === 'cert_revoked').slice(0, 3);
  recentRevokes.forEach((e) => {
    alerts.push({
      severity: 'info',
      title: 'Certificate action',
      message: `${e.actor} — certificate revoked${e.timestamp ? ' on ' + new Date(e.timestamp).toLocaleDateString() : ''}.`,
    });
  });

  return alerts;
}

export default function AlertCenter({ stats, recentEvents }) {
  const alerts = buildAlerts(stats, recentEvents);

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <NotificationsActiveOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }} />
        <Typography variant="h6">Alert Center</Typography>
      </Box>

      {alerts.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          No active alerts. Everything looks normal.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {alerts.map((a, i) => (
            <Alert key={i} severity={a.severity} variant="outlined">
              <AlertTitle sx={{ fontWeight: 700 }}>{a.title}</AlertTitle>
              {a.message}
            </Alert>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
