import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import IosShareRoundedIcon from '@mui/icons-material/IosShareRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import Spinner from './Spinner.jsx';
import StatusBadge from './StatusBadge.jsx';
import ShareVerification from './ShareVerification.jsx';
import DocumentPreview from './DocumentPreview.jsx';
import { fetchAllDocuments, fetchAuditTrail, fetchDocumentFile } from '../api/regulator.js';

// user: the user row being reviewed, or null to keep the dialog closed.
export default function ReviewUser({ user, onClose }) {
  const [tab, setTab] = useState('documents');
  const [docs, setDocs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      // quiet — disabled/loading state on the icon is feedback enough
    } finally {
      setPreviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError('');
    setTab('documents');
    Promise.all([fetchAllDocuments(user.id), fetchAuditTrail({ userId: user.id })])
      .then(([documents, auditEvents]) => {
        setDocs(documents);
        setEvents(auditEvents);
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this user\u2019s history.'))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Reviewing {user?.name}
        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab value="documents" label={`Documents (${docs.length})`} />
          <Tab value="audit" label={`Audit events (${events.length})`} />
        </Tabs>

        {loading && <Spinner label="Loading history…" />}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && tab === 'documents' && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Uploaded</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Signed by</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell sx={{ fontWeight: 500 }}>{d.title}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{d.signedBy || '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(d)}
                          disabled={previewingId === d.id}
                          aria-label="Preview document"
                        >
                          <VisibilityRoundedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Share verification link">
                      <IconButton size="small" onClick={() => setShareDoc(d)} aria-label="Share verification link">
                        <IosShareRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    No documents uploaded or signed by this user.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        {!loading && !error && tab === 'audit' && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Document / note</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                    {new Date(ev.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{ev.action?.replace('_', ' ')}</TableCell>
                  <TableCell>{ev.actor}</TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>{ev.documentTitle || ev.note || '—'}</TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    No audit events for this user yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" onClick={onClose}>Close</Button>
      </DialogActions>
      <ShareVerification doc={shareDoc} onClose={() => setShareDoc(null)} />
      <DocumentPreview file={previewFile} title={previewTitle} onClose={closePreview} />
    </Dialog>
  );
}
