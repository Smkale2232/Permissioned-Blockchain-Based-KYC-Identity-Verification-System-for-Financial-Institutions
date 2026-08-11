import { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import StatusBadge from './StatusBadge.jsx';
import { usePagination } from '../hooks/usePagination.js';

const SKELETON_ROWS = 4;
const TRANSITION_MS = 280;

// A real <tr> can't safely be wrapped in MUI's Collapse/Grow (they render
// wrapper <div>s, which are invalid inside <tr>) — so entrance/exit here use
// a plain CSS opacity+transform transition on the row itself instead.
// `entered`: true once mounted, drives the fade/slide-in.
// `leaving`: true once the doc is gone from the parent's data but still
// finishing its exit animation; onTransitionEnd is when it's actually removed.
function AnimatedRow({ entered, leaving, onExited, children }) {
  return (
    <TableRow
      hover
      onTransitionEnd={() => leaving && onExited()}
      sx={{
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        opacity: entered && !leaving ? 1 : 0,
        transform: entered && !leaving ? 'translateY(0)' : 'translateY(-6px)',
      }}
    >
      {children}
    </TableRow>
  );
}

// docs: [{ id, title, uploadedBy, status, uploadedAt }]
export default function PendingDocuments({
  docs,
  loading,
  error,
  onSelect,
  onDeny,
  onReview,
  signingId,
  reviewingId,
  onViewHistory,
}) {
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState('asc'); // oldest-pending-first by default

  // Mirrors `docs` but delays actually dropping a row until its exit
  // transition finishes, and tracks which rows have completed their entrance
  // transition — this is what makes both appearing and disappearing rows
  // animate instead of popping in/out abruptly.
  const [rows, setRows] = useState(() => (docs || []).map((d) => ({ ...d, _entered: true, _leaving: false })));

  useEffect(() => {
    const incoming = docs || [];
    const incomingIds = new Set(incoming.map((d) => d.id));

    setRows((prev) => {
      const prevIds = new Set(prev.map((r) => r.id));
      const stillHere = prev.map((r) => {
        if (incomingIds.has(r.id)) {
          const fresh = incoming.find((d) => d.id === r.id);
          return { ...fresh, _entered: true, _leaving: false };
        }
        // Gone from the parent's data — keep it rendered (marked leaving) so
        // it can animate out; handleExited() removes it for real afterwards.
        return r._leaving ? r : { ...r, _leaving: true };
      });
      const added = incoming
        .filter((d) => !prevIds.has(d.id))
        .map((d) => ({ ...d, _entered: false, _leaving: false }));
      return [...stillHere, ...added];
    });
  }, [docs]);

  // One tick after a new row mounts, flip it to "entered" so the CSS
  // transition actually plays (starting both states in the same render would
  // skip straight to the end state with no visible animation).
  useEffect(() => {
    if (rows.every((r) => r._entered)) return;
    const id = requestAnimationFrame(() => {
      setRows((prev) => prev.map((r) => (r._entered ? r : { ...r, _entered: true })));
    });
    return () => cancelAnimationFrame(id);
  }, [rows]);

  const handleExited = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((d) => (q ? d.title?.toLowerCase().includes(q) || d.uploadedBy?.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const diff = new Date(a.uploadedAt) - new Date(b.uploadedAt);
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [rows, query, sortDir]);

  const { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems } = usePagination(filtered);

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!loading && !docs?.length && !rows.some((r) => r._leaving)) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <TaskAltRoundedIcon sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
        <Typography color="text.secondary">Nothing waiting on your signature right now.</Typography>
      </Paper>
    );
  }

  return (
    <>
      {!loading && (
        <TextField
          size="small"
          placeholder="Search by title or uploader…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ mb: 2, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Uploaded by</TableCell>
              <TableCell sortDirection={sortDir}>
                <TableSortLabel
                  active
                  direction={sortDir}
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                >
                  Waiting since
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton width="70%" /></TableCell>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell><Skeleton width={72} /></TableCell>
                  <TableCell align="right"><Skeleton width={180} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))}

            {!loading &&
              pageItems.map((doc) => (
                <AnimatedRow
                  key={doc.id}
                  entered={doc._entered}
                  leaving={doc._leaving}
                  onExited={() => handleExited(doc.id)}
                >
                  <TableCell sx={{ fontWeight: 500 }}>{doc.title}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{doc.uploadedBy || '—'}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={doc.status} /></TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                      <Button size="small" variant="outlined" onClick={() => onViewHistory?.(doc)}>
                        History
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onReview?.(doc)}
                        disabled={reviewingId === doc.id || doc._leaving}
                      >
                        {reviewingId === doc.id ? 'Opening…' : 'Review'}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => onDeny?.(doc)}
                        disabled={signingId === doc.id || doc._leaving}
                      >
                        Deny
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => onSelect(doc)}
                        disabled={signingId === doc.id || doc._leaving}
                      >
                        {signingId === doc.id ? 'Signing…' : 'Sign'}
                      </Button>
                    </Stack>
                  </TableCell>
                </AnimatedRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No pending documents match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!loading && filtered.length > 0 && (
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </>
  );
}
