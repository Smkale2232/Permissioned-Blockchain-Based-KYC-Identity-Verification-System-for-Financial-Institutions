import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import StatusBadge from '../components/StatusBadge.jsx';
import StatusStepper from '../components/StatusStepper.jsx';
import CredentialViewer from '../components/CredentialViewer.jsx';
import { verifyDocument } from '../api/verify.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

function truncateHash(hash) {
  if (!hash) return null;
  return hash.length > 24 ? `${hash.slice(0, 12)}…${hash.slice(-10)}` : hash;
}

function Field({ label, value, mono }) {
  if (!value) return null;
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" component="div">{label}</Typography>
      <Tooltip title={mono ? value : ''}>
        <Typography sx={{ fontFamily: mono ? 'var(--font-mono)' : undefined, wordBreak: 'break-all' }}>
          {mono ? truncateHash(value) : value}
        </Typography>
      </Tooltip>
    </Box>
  );
}

// Public page — deliberately outside ProtectedRoute/GuestRoute, so anyone
// with the link (or who scans the QR code) can load it without an account.
// Only ever shows the non-sensitive fields the public /api/verify endpoint
// returns — never the underlying file.
export default function VerifyDocument() {
  usePageTitle('Verify Document');
  const { docId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    verifyDocument(docId)
      .then(setData)
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('No document was found for this verification link.');
        } else {
          setError('Could not verify this document right now. Try again shortly.');
        }
      })
      .finally(() => setLoading(false));
  }, [docId]);

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'primary.main' }}>
          <ShieldOutlinedIcon fontSize="small" />
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Document Verification</Typography>
      </Box>

      {loading && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Skeleton width="60%" height={32} sx={{ mb: 2 }} />
          <Skeleton width="100%" height={24} sx={{ mb: 1 }} />
          <Skeleton width="80%" height={24} />
        </Paper>
      )}

      {!loading && error && <Alert severity="error">{error}</Alert>}

      {!loading && !error && data && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {data.status === 'signed' && <VerifiedRoundedIcon color="success" />}
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{data.title}</Typography>
          </Box>
          <StatusBadge status={data.status} />

          <StatusStepper status={data.status} />

          <Divider sx={{ my: 2 }} />

          <Field label="Uploaded by" value={data.uploadedByName} />
          <Field label="Uploaded at" value={data.uploadedAt ? new Date(data.uploadedAt).toLocaleString() : null} />
          <Field label="Signed by" value={data.signedByName} />
          <Field label="Signed at" value={data.signedAt ? new Date(data.signedAt).toLocaleString() : null} />
          <Field label="Document hash (sha256)" value={data.fileHash} mono />
          <Field label="Fabric tx — upload" value={data.fabricTxIdCreate} mono />
          <Field label="Fabric tx — signature" value={data.fabricTxIdSign} mono />

          {data.credential && (
            <>
              <Divider sx={{ my: 2 }} />
              <CredentialViewer credential={data.credential} verification={data.credentialVerification} />
            </>
          )}

          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            This page confirms what DocChain has recorded about this document — it does not
            display or grant access to the underlying file.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
