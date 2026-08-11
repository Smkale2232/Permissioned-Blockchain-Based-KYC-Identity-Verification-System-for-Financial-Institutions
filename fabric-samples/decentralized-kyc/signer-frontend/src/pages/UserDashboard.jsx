import { useEffect, useState, useCallback, useRef } from 'react';
import Typography from '@mui/material/Typography';
import DocumentUpload from '../components/DocumentUpload.jsx';
import MyDocuments from '../components/MyDocuments.jsx';
import DocumentHistory from '../components/DocumentHistory.jsx';
import AccountSummary from '../components/AccountSummary.jsx';
import DocStatCards from '../components/DocStatCards.jsx';
import { fetchMyDocuments } from '../api/documents';
import { useToast } from '../context/ToastContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const STATUS_POLL_MS = 8000;

export default function UserDashboard() {
  usePageTitle('My Documents');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [historyDoc, setHistoryDoc] = useState(null);
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const docsRef = useRef(docs);
  docsRef.current = docs;

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMyDocuments();
      setDocs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Silent background refresh — same "likes counter" pattern as the Navbar
  // badge (see hooks/useLivePoll.js): picks up status changes (e.g. a signer
  // signing/denying one of these documents) without a loading skeleton or
  // any full-page reload. Only re-renders if something actually changed.
  useEffect(() => {
    const tick = async () => {
      try {
        const fresh = await fetchMyDocuments();
        const prev = docsRef.current;
        const changed =
          fresh.length !== prev.length ||
          fresh.some((doc, i) => doc.id !== prev[i]?.id || doc.status !== prev[i]?.status);
        if (changed) {
          const prevById = new Map(prev.map((d) => [d.id, d.status]));
          fresh.forEach((d) => {
            const prevStatus = prevById.get(d.id);
            if (prevStatus && prevStatus !== d.status && (d.status === 'signed' || d.status === 'rejected')) {
              addNotification(`"${d.title}" was ${d.status}.`);
            }
          });
          setDocs(fresh);
        }
      } catch {
        // a missed background poll is silent — the next tick tries again
      }
    };
    const id = setInterval(tick, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [addNotification]);

  // Optimistically prepend the new doc, then still refetch to stay in sync with the server.
  const handleUploaded = (created) => {
    setDocs((prev) => [created, ...prev]);
    loadDocs();
    showToast(`"${created.title}" uploaded successfully.`, 'success');
  };

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>My Documents</Typography>
      <AccountSummary />
      <DocStatCards docs={docs} totalLabel="Total Uploaded" />
      <DocumentUpload onUploaded={handleUploaded} />
      <MyDocuments docs={docs} loading={loading} error={error} onViewHistory={setHistoryDoc} />
      <DocumentHistory doc={historyDoc} onClose={() => setHistoryDoc(null)} />
    </div>
  );
}
