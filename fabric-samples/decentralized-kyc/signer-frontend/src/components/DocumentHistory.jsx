import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import { fetchDocumentHistory } from '../api/documents';
import StatusStepper from './StatusStepper.jsx';
import CredentialViewer from './CredentialViewer.jsx';
import ShareVerification from './ShareVerification.jsx';
import Spinner from './Spinner.jsx';

// One icon per audit action — keeps the timeline scannable at a glance.
const ACTION_ICON = {
  uploaded: <UploadFileRoundedIcon fontSize="small" />,
  signed: <VerifiedRoundedIcon fontSize="small" color="success" />,
  rejected: <CancelRoundedIcon fontSize="small" color="error" />,
};

function truncateHash(hash) {
  if (!hash) return null;
  return hash.length > 20 ? `${hash.slice(0, 10)}…${hash.slice(-8)}` : hash;
}

// doc: the full document row (id, title, status, fileHash, …) or null.
export default function DocumentHistory({ doc, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!doc) return;
    setLoading(true);
    setError('');
    fetchDocumentHistory(doc.id)
      .then(setEvents)
      .catch((err) => setError(err.response?.data?.message || 'Could not load history.'))
      .finally(() => setLoading(false));
  }, [doc]);

  return (
    <Dialog open={!!doc} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{doc?.title}</span>
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh' }}>
        {doc?.status && <StatusStepper status={doc.status} />}

        {doc?.fileHash && (
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="caption" color="text.secondary" component="div">
              Document hash (sha256) — this is what's actually recorded on-chain, never the file itself
            </Typography>
            <Tooltip title={doc.fileHash}>
              <Typography
                variant="body2"
                sx={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all', cursor: 'help' }}
              >
                {truncateHash(doc.fileHash)}
              </Typography>
            </Tooltip>
          </Box>
        )}

        {doc?.credential && <CredentialViewer credential={doc.credential} verification={null} />}

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
          <HistoryRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          Audit trail
        </Typography>

        {loading && <Spinner label="Loading history…" />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && !events.length && (
          <Typography color="text.secondary">No history recorded yet.</Typography>
        )}

        {!loading && !error && events.length > 0 && (
          <Box sx={{ position: 'relative', pl: 4 }}>
            {/* connecting line running through all the icons */}
            <Box
              sx={{
                position: 'absolute',
                left: 15,
                top: 8,
                bottom: 8,
                width: '2px',
                bgcolor: 'divider',
              }}
            />
            {events.map((event, i) => (
              <Box key={event.id || i} sx={{ position: 'relative', pb: i < events.length - 1 ? 3 : 0 }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: -32,
                    top: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'background.paper',
                    border: '2px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ACTION_ICON[event.action] || <HistoryRoundedIcon fontSize="small" />}
                </Box>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                    {event.action} — {event.actor || 'Unknown actor'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}
                  </Typography>
                  {event.fabricTxId && (
                    <Typography
                      variant="caption"
                      component="div"
                      sx={{ fontFamily: 'var(--font-mono)', color: 'text.secondary', mt: 0.5 }}
                    >
                      tx: {truncateHash(event.fabricTxId)}
                    </Typography>
                  )}
                  {event.note && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>{event.note}</Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          startIcon={<IosShareRoundedIcon fontSize="small" />}
          onClick={() => setShareOpen(true)}
        >
          Share verification link
        </Button>
      </DialogActions>
      <ShareVerification doc={shareOpen ? doc : null} onClose={() => setShareOpen(false)} />
    </Dialog>
  );
}
