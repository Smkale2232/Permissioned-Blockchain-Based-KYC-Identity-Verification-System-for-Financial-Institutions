import { useEffect, useState, useCallback, useRef } from 'react';
import Typography from '@mui/material/Typography';
import PendingDocuments from '../components/PendingDocuments.jsx';
import SignDocument from '../components/SignDocument.jsx';
import RejectDocument from '../components/RejectDocument.jsx';
import DocumentHistory from '../components/DocumentHistory.jsx';
import DocumentPreview from '../components/DocumentPreview.jsx';
import AccountSummary from '../components/AccountSummary.jsx';
import UndoSnackbar from '../components/UndoSnackbar.jsx';
import { fetchPendingDocuments, signDocument, rejectDocument, fetchDocumentFile } from '../api/documents';
import { useToast } from '../context/ToastContext.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useUndoableAction } from '../hooks/useUndoableAction.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const PENDING_POLL_MS = 8000;

export default function SignerDashboard() {
  usePageTitle('Pending Signatures');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null); // doc pending sign confirmation
  const [denyDoc, setDenyDoc] = useState(null); // doc pending deny confirmation
  const [signingId, setSigningId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [historyDoc, setHistoryDoc] = useState(null);
  const [previewFile, setPreviewFile] = useState(null); // { url, type } from fetchDocumentFile
  const [previewTitle, setPreviewTitle] = useState('');
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { pending: pendingUndo, trigger: triggerUndo, undo } = useUndoableAction();
  const docsRef = useRef(docs);
  const busyRef = useRef(false); // true while a sign/deny dialog OR a pending undo is active — pause silent refresh
  docsRef.current = docs;
  busyRef.current = !!selectedDoc || !!denyDoc || !!pendingUndo;

  const loadDocs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchPendingDocuments();
      setDocs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load pending documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Silent background refresh — picks up newly uploaded documents (or ones
  // handled from another tab/session) without a loading skeleton or full-page
  // reload, same pattern as the Navbar's live pending-count badge. Paused
  // while a dialog is open OR a deny is in its 10-second undo window, so it
  // can't clobber the optimistic removal before the real API call fires.
  useEffect(() => {
    const tick = async () => {
      if (busyRef.current) return;
      try {
        const fresh = await fetchPendingDocuments();
        const prev = docsRef.current;
        const changed =
          fresh.length !== prev.length || fresh.some((doc, i) => doc.id !== prev[i]?.id);
        if (changed) {
          const prevIds = new Set(prev.map((d) => d.id));
          fresh
            .filter((d) => !prevIds.has(d.id))
            .forEach((d) => addNotification(`"${d.title}" is now pending your signature.`));
          setDocs(fresh);
        }
      } catch {
        // a missed background poll is silent — the next tick tries again
      }
    };
    const id = setInterval(tick, PENDING_POLL_MS);
    return () => clearInterval(id);
  }, [addNotification]);

  // "Review" — open the file inline (PDF/image render directly; other types
  // fall back to a plain download link) so the signer can read what they're
  // about to sign without leaving the page.
  const handleReview = async (doc) => {
    setReviewingId(doc.id);
    try {
      const file = await fetchDocumentFile(doc.id);
      setPreviewFile(file);
      setPreviewTitle(doc.title);
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not open the document.', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) window.URL.revokeObjectURL(previewFile.url);
    setPreviewFile(null);
  };

  const handleConfirmSign = async (doc, pin) => {
    setSigningId(doc.id);
    try {
      await signDocument(doc.id, pin);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setSelectedDoc(null);
      showToast(`"${doc.title}" signed successfully.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Signing failed. Try again.', 'error');
      throw err; // let SignDocument show the inline error too
    } finally {
      setSigningId(null);
    }
  };

  // Deny goes through a 10-second undo window (see UndoSnackbar): the row is
  // removed and the dialog closes immediately, but the actual reject API call
  // only fires once the countdown elapses — clicking Undo cancels it entirely,
  // so nothing is sent to the backend at all.
  const restoreDoc = (doc) => {
    setDocs((prev) => (prev.some((d) => d.id === doc.id) ? prev : [doc, ...prev]));
  };

  const handleConfirmDeny = (doc, pin, reason) => {
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    setDenyDoc(null);

    triggerUndo(`Denying "${doc.title}"`, {
      onCommit: async () => {
        try {
          await rejectDocument(doc.id, pin, reason);
          showToast(`"${doc.title}" was denied.`, 'success');
        } catch (err) {
          showToast(err.response?.data?.message || 'Denying this document failed. Try again.', 'error');
          restoreDoc(doc); // nothing actually changed server-side, so put it back
        }
      },
      onUndo: () => {
        restoreDoc(doc);
        showToast('Denial undone.', 'success');
      },
    });
  };

  return (
    <div>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Pending Signatures</Typography>
      <AccountSummary />

      <PendingDocuments
        docs={docs}
        loading={loading}
        error={error}
        onSelect={setSelectedDoc}
        onDeny={setDenyDoc}
        onReview={handleReview}
        signingId={signingId}
        reviewingId={reviewingId}
        onViewHistory={setHistoryDoc}
      />

      <SignDocument
        doc={selectedDoc}
        onConfirm={handleConfirmSign}
        onClose={() => setSelectedDoc(null)}
      />

      <RejectDocument
        doc={denyDoc}
        onConfirm={handleConfirmDeny}
        onClose={() => setDenyDoc(null)}
      />

      <DocumentHistory doc={historyDoc} onClose={() => setHistoryDoc(null)} />
      <DocumentPreview file={previewFile} title={previewTitle} onClose={closePreview} />
      <UndoSnackbar pending={pendingUndo} onUndo={undo} />
    </div>
  );
}
