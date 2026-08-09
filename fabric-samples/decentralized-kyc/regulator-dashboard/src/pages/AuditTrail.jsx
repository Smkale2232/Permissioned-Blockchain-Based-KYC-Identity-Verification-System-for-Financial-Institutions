import { useEffect, useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import StatusBadge from '../components/StatusBadge.jsx';
import { fetchAuditTrail } from '../api/regulator.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { usePagination } from '../hooks/usePagination.js';

const SKELETON_ROWS = 6;

export default function AuditTrail() {
  usePageTitle('Audit Trail');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docIdInput, setDocIdInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortDir, setSortDir] = useState('desc');

  const load = useCallback((docId) => {
    setLoading(true);
    setError('');
    fetchAuditTrail({ docId: docId || undefined })
      .then(setEvents)
      .catch((err) => setError(err.response?.data?.message || 'Could not load the audit trail.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleFilter = (e) => {
    e.preventDefault();
    setActiveFilter(docIdInput.trim());
    load(docIdInput.trim());
  };

  const clearFilter = () => {
    setDocIdInput('');
    setActiveFilter('');
    load();
  };

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => {
        const diff = new Date(a.timestamp) - new Date(b.timestamp);
        return sortDir === 'asc' ? diff : -diff;
      }),
    [events, sortDir]
  );

  const { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems } = usePagination(sorted);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Audit Trail</Typography>

      <Paper
        component="form"
        onSubmit={handleFilter}
        variant="outlined"
        sx={{ p: 2, mb: 2, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'center' }}
      >
        <TextField
          size="small"
          label="Filter by document ID"
          value={docIdInput}
          onChange={(e) => setDocIdInput(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 360 }}
        />
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained">Filter</Button>
          {activeFilter && <Button variant="outlined" onClick={clearFilter}>Clear</Button>}
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {!error && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell sortDirection={sortDir}>
                  <TableSortLabel
                    active
                    direction={sortDir}
                    onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  >
                    Timestamp
                  </TableSortLabel>
                </TableCell>
                <TableCell>Tx ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton width="60%" /></TableCell>
                    <TableCell><Skeleton width="50%" /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                  </TableRow>
                ))}

              {!loading &&
                pageItems.map((event) => (
                  <TableRow key={event.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{event.documentTitle || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{event.actor}</TableCell>
                    <TableCell><StatusBadge status={event.action} /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {event.timestamp ? new Date(event.timestamp).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'text.secondary' }}>
                      {event.fabricTxId || '—'}
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    No audit events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {!loading && sorted.length > 0 && (
        <TablePagination
          component="div"
          count={sorted.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Box>
  );
}
