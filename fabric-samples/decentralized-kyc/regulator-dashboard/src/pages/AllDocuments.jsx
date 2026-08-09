import { useEffect, useState, useMemo } from 'react';
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
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import StatusBadge from '../components/StatusBadge.jsx';
import ShareVerification from '../components/ShareVerification.jsx';
import DocumentPreview from '../components/DocumentPreview.jsx';
import { fetchAllDocuments, fetchDocumentFile } from '../api/regulator.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { usePagination } from '../hooks/usePagination.js';

const SKELETON_ROWS = 6;

export default function AllDocuments() {
  usePageTitle('All Documents');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [shareDoc, setShareDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewingId, setPreviewingId] = useState(null);

  useEffect(() => {
    fetchAllDocuments()
      .then(setDocs)
      .catch((err) => setError(err.response?.data?.message || 'Could not load documents.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePreview = async (doc) => {
    setPreviewingId(doc.id);
    try {
      const file = await fetchDocumentFile(doc.id);
      setPreviewFile(file);
      setPreviewTitle(doc.title);
    } catch {
      // quiet — the disabled/loading state on the icon is feedback enough
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
    return docs
      .filter((d) => (q ? d.title?.toLowerCase().includes(q) || d.uploadedBy?.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const diff = new Date(a.uploadedAt) - new Date(b.uploadedAt);
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [docs, query, sortDir]);

  const { page, setPage, rowsPerPage, handleChangeRowsPerPage, pageItems } = usePagination(filtered);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>All Documents</Typography>
        <TextField
          size="small"
          placeholder="Search title or uploader…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {!error && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflowX: 'auto' }}>
          <Table sx={{ minWidth: 760 }}>
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
                    Uploaded
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signed by</TableCell>
                <TableCell>File hash</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading &&
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell><Skeleton width="70%" /></TableCell>
                    <TableCell><Skeleton width="50%" /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={72} /></TableCell>
                    <TableCell><Skeleton width="50%" /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell align="right"><Skeleton width={56} sx={{ ml: 'auto' }} /></TableCell>
                  </TableRow>
                ))}

              {!loading &&
                pageItems.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{doc.title}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{doc.uploadedBy || '—'}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{doc.signedBy || '—'}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        color: 'text.secondary',
                        maxWidth: 160,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={doc.fileHash}
                    >
                      {doc.fileHash}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handlePreview(doc)}
                            disabled={previewingId === doc.id}
                            aria-label="Preview document"
                          >
                            <VisibilityRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Share verification link">
                        <IconButton size="small" onClick={() => setShareDoc(doc)} aria-label="Share verification link">
                          <IosShareRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                    No documents match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
    </Box>
  );
}
