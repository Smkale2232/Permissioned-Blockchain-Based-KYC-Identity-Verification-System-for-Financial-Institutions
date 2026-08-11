import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PinInput from './PinInput.jsx';
import { validatePin } from '../utils/validators.js';

const MAX_REASON_LENGTH = 500;

// doc: the selected document. onConfirm(doc, pin, reason) => Promise. onClose() closes the modal.
export default function RejectDocument({ doc, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError('');
    setReason('');
    setPin('');
  }, [doc]);

  const handleConfirm = async () => {
    setError('');
    const pinError = validatePin(pin);
    if (pinError) {
      setError(pinError);
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(doc, pin, reason.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Denying this document failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!doc} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Deny this document?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You're about to deny <strong>{doc?.title}</strong>. This marks it as rejected and
          can't be undone from here.
        </DialogContentText>

        <TextField
          label="Reason (optional)"
          multiline
          minRows={2}
          fullWidth
          sx={{ mt: 2 }}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: MAX_REASON_LENGTH }}
          disabled={submitting}
          placeholder="e.g. Wrong file attached, needs revision…"
        />

        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 2, mb: 0.75 }}>
          Enter your PIN to confirm
        </Typography>
        <PinInput value={pin} onChange={setPin} disabled={submitting} error={!!error} />

        {error && <Alert severity="error" sx={{ mt: 2 }} role="alert">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Denying…' : 'Confirm & Deny'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
