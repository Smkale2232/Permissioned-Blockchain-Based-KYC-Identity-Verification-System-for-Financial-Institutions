import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';

// file: { url, type } from fetchDocumentFile(), or null to keep closed.
// title: document title, shown in the dialog header.
export default function DocumentPreview({ file, title, onClose }) {
  const isPdf = file?.type === 'application/pdf';
  const isImage = file?.type?.startsWith('image/');

  return (
    <Dialog open={!!file} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '85vh' } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{title}</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {file && (
            <Button
              size="small"
              startIcon={<OpenInNewRoundedIcon fontSize="small" />}
              component="a"
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab
            </Button>
          )}
          <IconButton onClick={onClose} aria-label="Close preview" size="small">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {isPdf && (
          <Box component="iframe" src={file.url} title={title} sx={{ flex: 1, border: 0, width: '100%' }} />
        )}
        {isImage && (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', p: 2 }}>
            <Box component="img" src={file.url} alt={title} sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Box>
        )}
        {file && !isPdf && !isImage && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography color="text.secondary">
              This file type can't be previewed inline — use "Open in new tab" instead.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
