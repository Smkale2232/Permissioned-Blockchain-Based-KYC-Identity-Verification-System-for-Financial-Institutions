import axiosClient from './axiosClient';

// GET /api/documents — list of the logged-in user's own uploaded documents
export function fetchMyDocuments() {
  return axiosClient.get('/documents').then((res) => res.data);
}

// POST /api/documents/upload — multipart form with the file + metadata.
// pin: the uploader's 4–6 digit account PIN, required to confirm the upload.
export function uploadDocument(file, title, pin) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('pin', pin);

  return axiosClient
    .post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data);
}

// GET /api/documents/:docId/history — audit trail for one document
export function fetchDocumentHistory(docId) {
  return axiosClient.get(`/documents/${docId}/history`).then((res) => res.data);
}

// GET /api/documents/:docId/file — fetch the underlying file so it can be
// reviewed (e.g. opened in a new tab) before signing/denying. Returns a
// blob object URL; caller is responsible for revoking it when done.
// GET /api/documents/:docId/file — fetch the underlying file so it can be
// reviewed/previewed before signing/denying. Returns { url, type } — a blob
// object URL plus its MIME type (so the caller can decide how to render it:
// <iframe> for PDFs, <img> for images, or a plain download link otherwise).
// Caller is responsible for revoking the URL when done with it.
export function fetchDocumentFile(docId) {
  return axiosClient.get(`/documents/${docId}/file`, { responseType: 'blob' }).then((res) => ({
    url: window.URL.createObjectURL(res.data),
    type: res.data.type,
  }));
}

// --- Signer-side, used by SignerDashboard ---

// GET /api/documents/pending — documents awaiting this signer's signature
export function fetchPendingDocuments() {
  return axiosClient.get('/documents/pending').then((res) => res.data);
}

// POST /api/documents/sign/:docId — sign a specific document.
// pin: the signer's 4–6 digit account PIN, required to confirm the signature.
export function signDocument(docId, pin) {
  return axiosClient.post(`/documents/sign/${docId}`, { pin }).then((res) => res.data);
}

// POST /api/documents/reject/:docId — deny a specific pending document.
// pin: required to confirm; reason: optional free-text explanation.
export function rejectDocument(docId, pin, reason) {
  return axiosClient.post(`/documents/reject/${docId}`, { pin, reason }).then((res) => res.data);
}
