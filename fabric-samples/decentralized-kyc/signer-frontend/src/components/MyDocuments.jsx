import { useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import StatusBadge from './StatusBadge.jsx';
import ShareVerification from './ShareVerification.jsx';
import DocumentPreview from './DocumentPreview.jsx';
import { fetchDocumentFile } from '../api/documents';
import { usePagination } from '../hooks/usePagination.js';

const SKELETON_ROWS = 4;

function truncateHash(hash) {
  if (!hash) return '—';
  return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-6)}` : hash;
}

// docs: [{ id, title, status, uploadedAt, fileHash }]
export default function MyDocuments({ docs, loading, error, onViewHistory }) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDir, setSortDir] = useState('desc'); // by uploadedAt
  const [shareDoc, setShareDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewingId, setPreviewingId] = useState(null);

  const handlePreview = async (doc) => {
    setPreviewingId(doc.id);
    try {
      const file = await fetchDocumentFile(doc.id);
      setPreviewFile(file);
      setPreviewTitle(doc.title);
    } catch {
      // the row's own error state stays quiet here — a failed preview isn't
      // worth a page-level error, the Tooltip/disabled state is feedback enough
    } finally {
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (docs || [])
      .filter((d) => (statusFilter === 'all' ? true : d.status === statusFilter))
      .filter((d) => (q ? d.title?.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const diff = new Date(a.uploadedAt) - new Date(b.uploadedAt);
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [docs, query, statusFilter, sortDir]);

  const { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems } = usePagination(filtered);

  if (error) return <Alert severity="error">{error}</Alert>;

  if (!loading && !docs?.length) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <InsertDriveFileOutlinedIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">No documents yet. Upload one above to get started.</Typography>
      </Paper>
    );
  }

  return (
    <>
      {!loading && (
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="signed">Signed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </TextField>
        </Stack>
      )}

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 560 }}>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell sortDirection={sortDir}>
                <TableSortLabel
                  active
                  direction={sortDir}
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                >
                  Uploaded
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Document hash</TableCell>
              <TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><Skeleton width="70%" /></TableCell>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell><Skeleton width={72} /></TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell align="right"><Skeleton width={100} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))}

            {!loading &&
              pageItems.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{doc.title}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={doc.status} /></TableCell>
                  <TableCell>
                    <Tooltip title={doc.fileHash || 'No hash recorded'}>
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'text.secondary', cursor: 'help' }}
                      >
                        {truncateHash(doc.fileHash)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(doc)}
                          disabled={previewingId === doc.id}
                          sx={{ mr: 0.5 }}
                          aria-label="Preview document"
                        >
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Share verification link">
                      <IconButton size="small" onClick={() => setShareDoc(doc)} sx={{ mr: 0.5 }} aria-label="Share verification link">
                        <IosShareRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Button size="small" variant="outlined" onClick={() => onViewHistory?.(doc)}>
                      View history
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                  No documents match your search.
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
      <ShareVerification doc={shareDoc} onClose={() => setShareDoc(null)} />
      <DocumentPreview file={previewFile} title={previewTitle} onClose={closePreview} />
    </>
  );
}
