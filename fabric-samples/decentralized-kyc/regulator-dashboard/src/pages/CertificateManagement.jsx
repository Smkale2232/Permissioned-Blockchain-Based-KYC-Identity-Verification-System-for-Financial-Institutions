import { useEffect, useState, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import ReviewUser from '../components/ReviewUser.jsx';
import UndoSnackbar from '../components/UndoSnackbar.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useUndoableAction } from '../hooks/useUndoableAction.js';
import { fetchUsers, revokeCertificate, reactivateCertificate } from '../api/regulator.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { usePagination } from '../hooks/usePagination.js';

export default function CertificateManagement() {
  usePageTitle('Certificate Management');
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingUser, setPendingUser] = useState(null); // revoke confirmation dialog
  const [reactivatingUser, setReactivatingUser] = useState(null); // reactivate confirmation dialog
  const [reviewUser, setReviewUser] = useState(null); // review dialog
  const [busyUserId, setBusyUserId] = useState(null);
  const { pending: pendingUndo, trigger: triggerUndo, undo } = useUndoableAction();
  const usersRef = useRef(users);
  usersRef.current = users;

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.response?.data?.message || 'Could not load users.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems } = usePagination(users);

  const setUserStatus = (userId, certificateStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, certificateStatus } : u)));
  };

  // Revoke goes through a 10-second undo window: the row flips to "Revoking…"
  // immediately and the confirm dialog closes, but the actual CA/on-chain
  // revoke call only fires once the countdown elapses. Undo cancels it
  // entirely — nothing is sent to the backend, and the row reverts to Active.
  const handleConfirmRevoke = () => {
    const user = pendingUser;
    if (!user) return;
    setPendingUser(null);
    setUserStatus(user.id, 'revoking');

    triggerUndo(`Revoking ${user.email}'s certificate`, {
      onCommit: async () => {
        try {
          await revokeCertificate(user.id);
          setUserStatus(user.id, 'revoked');
          showToast(`Certificate revoked for ${user.email}.`, 'success');
        } catch (err) {
          setUserStatus(user.id, 'active'); // nothing changed server-side, so revert
          showToast(err.response?.data?.message || 'Revocation failed.', 'error');
        }
      },
      onUndo: () => {
        setUserStatus(user.id, 'active');
        showToast('Revocation undone.', 'success');
      },
    });
  };

  // Reactivate is itself a corrective action, so it commits right away behind
  // a normal confirm dialog rather than another undo window.
  const handleConfirmReactivate = async () => {
    const user = reactivatingUser;
    if (!user) return;
    setBusyUserId(user.id);
    try {
      await reactivateCertificate(user.id);
      setUserStatus(user.id, 'active');
      showToast(`Certificate reactivated for ${user.email}.`, 'success');
      setReactivatingUser(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Reactivation failed.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Certificate Management</Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {!error && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Certificate</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton width="60%" /></TableCell>
                    <TableCell><Skeleton width="70%" /></TableCell>
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell align="right"><Skeleton width={100} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))}

              {!loading && pageItems.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{u.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={u.role} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={u.certificateStatus === 'revoking' ? 'Revoking…' : u.certificateStatus}
                      color={
                        u.certificateStatus === 'active'
                          ? 'success'
                          : u.certificateStatus === 'revoking'
                          ? 'warning'
                          : 'error'
                      }
                      variant={u.certificateStatus === 'active' ? 'outlined' : 'filled'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      {u.certificateStatus === 'revoked' && (
                        <>
                          <Button size="small" variant="outlined" onClick={() => setReviewUser(u)}>
                            Review
                          </Button>
                          <Button
                            size="small"
                            color="success"
                            variant="outlined"
                            onClick={() => setReactivatingUser(u)}
                            disabled={busyUserId === u.id}
                          >
                            Reactivate
                          </Button>
                        </>
                      )}
                      {u.certificateStatus === 'active' && u.role !== 'regulator' && (
                        <Button size="small" color="error" variant="outlined" onClick={() => setPendingUser(u)}>
                          Revoke
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && users.length > 0 && (
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}

      {/* Revoke confirmation — actual commit is delayed by the undo window */}
      <Dialog open={!!pendingUser} onClose={() => setPendingUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Revoke this certificate?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This revokes <strong>{pendingUser?.email}</strong>'s certificate at the CA and
            records it on-chain. They won't be able to sign or upload documents until
            reactivated. You'll have 10 seconds to undo this before it's sent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setPendingUser(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmRevoke}>
            Revoke certificate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reactivate confirmation — commits immediately, no undo window */}
      <Dialog open={!!reactivatingUser} onClose={busyUserId ? undefined : () => setReactivatingUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reactivate this certificate?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This restores <strong>{reactivatingUser?.email}</strong>'s certificate at the CA and
            records the reactivation on-chain. They'll be able to sign and upload again immediately.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button variant="outlined" onClick={() => setReactivatingUser(null)} disabled={!!busyUserId}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleConfirmReactivate} disabled={!!busyUserId}>
            {busyUserId ? 'Reactivating…' : 'Reactivate certificate'}
          </Button>
        </DialogActions>
      </Dialog>

      <ReviewUser user={reviewUser} onClose={() => setReviewUser(null)} />
      <UndoSnackbar pending={pendingUndo} onUndo={undo} />
    </Box>
  );
}
