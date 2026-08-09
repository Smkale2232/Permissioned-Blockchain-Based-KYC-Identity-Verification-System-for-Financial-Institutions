import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Renders the countdown/loader/Undo button for a pending useUndoableAction().
// pending: { label, secondsLeft, committing } | null
export default function UndoSnackbar({ pending, onUndo }) {
  return (
    <Snackbar
      open={!!pending}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 16, sm: 24 } }}
    >
      {pending ? (
        <Alert
          severity="warning"
          variant="filled"
          icon={false}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}
        >
          <Box sx={{ display: 'inline-flex' }}>
            <CircularProgress
              size={20}
              thickness={5}
              variant={pending.committing ? 'indeterminate' : 'determinate'}
              value={pending.committing ? undefined : (pending.secondsLeft / 10) * 100}
              sx={{ color: 'inherit' }}
            />
          </Box>
          <span>
            {pending.committing ? `${pending.label}\u2026` : `${pending.label} in ${pending.secondsLeft}s\u2026`}
          </span>
          {!pending.committing && (
            <Button size="small" color="inherit" onClick={onUndo} sx={{ ml: 1, fontWeight: 700 }}>
              UNDO
            </Button>
          )}
        </Alert>
      ) : (
        <span />
      )}
    </Snackbar>
  );
}
