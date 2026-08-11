import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PinInput from './PinInput.jsx';
import { validatePin } from '../utils/validators.js';

// doc: the selected document. onConfirm(doc, pin) => Promise. onClose() closes the modal.
export default function SignDocument({ doc, onConfirm, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError('');
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
      await onConfirm(doc, pin);
    } catch (err) {
      setError(err.response?.data?.message || 'Signing failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!doc} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Sign this document?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You're about to sign <strong>{doc?.title}</strong>. This writes your signature to the
          chain and can't be undone from here. Use the <strong>Review</strong> button on the
          document row first if you want to see the file before confirming.
        </DialogContentText>

        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 2, mb: 0.75 }}>
          Enter your PIN to confirm
        </Typography>
        <PinInput value={pin} onChange={setPin} disabled={submitting} autoFocus error={!!error} />

        {error && <Alert severity="error" sx={{ mt: 2 }} role="alert">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={submitting}>
          {submitting ? 'Signing…' : 'Confirm & Sign'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
