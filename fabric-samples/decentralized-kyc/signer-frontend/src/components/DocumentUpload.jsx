import { useState, useRef } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { uploadDocument } from '../api/documents';
import PinInput from './PinInput.jsx';
import { validatePin, PIN_MAX_LENGTH } from '../utils/validators.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TITLE_LENGTH = 150;
// Client-side MIME allowlist. This is a UX convenience only, NOT a security control —
// MIME type and extension are both attacker-controlled. The backend/chaincode layer
// MUST re-validate file type (e.g. by magic-byte sniffing) before accepting or hashing
// the file; never trust this check as the actual boundary.
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

export default function DocumentUpload({ onUploaded }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return setError('Give the document a title.');
    if (trimmedTitle.length > MAX_TITLE_LENGTH) return setError(`Title must be under ${MAX_TITLE_LENGTH} characters.`);
    if (!file) return setError('Choose a file to upload.');
    if (file.size === 0) return setError('That file is empty.');
    if (file.size > MAX_FILE_BYTES) return setError('File must be under 10MB.');
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return setError('Unsupported file type. Use PDF, Word, PNG, or JPEG.');
    }
    const pinError = validatePin(pin);
    if (pinError) return setError(pinError);

    setSubmitting(true);
    try {
      const created = await uploadDocument(file, trimmedTitle, pin);
      onUploaded?.(created);
      setTitle('');
      setFile(null);
      setPin('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      variant="outlined"
      sx={{ p: 3, mb: 3, borderRadius: 3 }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>Upload a document</Typography>

      <TextField
        id="doc-title"
        label="Title"
        fullWidth
        margin="dense"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Q3 Supply Agreement"
        inputProps={{ maxLength: MAX_TITLE_LENGTH }}
      />

      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          mt: 2,
          mb: 1,
          p: 2.5,
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'divider',
          borderRadius: 2,
          bgcolor: dragActive ? 'action.hover' : 'transparent',
          transition: 'border-color 150ms ease, background-color 150ms ease',
          textAlign: 'center',
        }}
      >
        <UploadFileRoundedIcon sx={{ color: dragActive ? 'primary.main' : 'text.disabled', fontSize: 28, mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Drag a file here, or
        </Typography>
        <Button component="label" variant="outlined" size="small">
          Choose file
          <input
            id="doc-file"
            type="file"
            hidden
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />
        </Button>
        {file && (
          <Box sx={{ mt: 1.5 }}>
            <Chip
              label={file.name}
              onDelete={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 1.5 }}>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.75 }}>
          Your PIN — confirms this upload
        </Typography>
        <PinInput value={pin} onChange={setPin} />
      </Box>

      {error && <Alert severity="error" sx={{ mt: 1 }} role="alert">{error}</Alert>}

      <Stack direction="row" sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Uploading…' : 'Upload document'}
        </Button>
      </Stack>
    </Paper>
  );
}
