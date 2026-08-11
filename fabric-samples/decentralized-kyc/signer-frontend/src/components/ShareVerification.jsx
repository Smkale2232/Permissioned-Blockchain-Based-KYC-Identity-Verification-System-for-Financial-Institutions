import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { QRCodeSVG } from 'qrcode.react';

// doc: the document row (needs .id and .title), or null to keep closed.
export default function ShareVerification({ doc, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = doc ? `${window.location.origin}/verify/${doc.id}` : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API can fail (permissions, non-secure context) — the
      // TextField already shows the full URL for a manual copy fallback.
    }
  };

  return (
    <Dialog open={!!doc} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Share verification</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Anyone with this link can confirm <strong>{doc?.title}</strong>'s recorded status,
          hash, and signer — without an account, and without seeing the file itself.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            {doc && <QRCodeSVG value={url} size={160} />}
          </Box>
        </Box>

        <TextField
          fullWidth
          size="small"
          value={url}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                  <IconButton size="small" onClick={handleCopy} aria-label={copied ? "Copied" : "Copy link"}>
                    {copied ? <CheckRoundedIcon fontSize="small" color="success" /> : <ContentCopyRoundedIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
