import axiosClient from './axiosClient';

export async function fetchStatistics() {
  const { data } = await axiosClient.get('/regulator/statistics');
  return data;
}

// Optional userId scopes to one user's uploads (used by the Review action).
export async function fetchAllDocuments(userId) {
  const { data } = await axiosClient.get('/regulator/documents', {
    params: userId ? { userId } : undefined,
  });
  return data;
}

// Optional docId drills into one document; userId scopes to one user's
// activity (used by the Review action). Only one is typically passed at a time.
export async function fetchAuditTrail({ docId, userId } = {}) {
  const params = {};
  if (docId) params.docId = docId;
  if (userId) params.userId = userId;
  const { data } = await axiosClient.get('/regulator/audit-trail', {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function fetchUsers() {
  const { data } = await axiosClient.get('/regulator/users');
  return data;
}

export async function revokeCertificate(userId) {
  const { data } = await axiosClient.post(`/regulator/certificates/${userId}/revoke`);
  return data;
}

// Corrective un-revoke — the "Reactivate" action shown once a certificate has
// actually been revoked.
export async function reactivateCertificate(userId) {
  const { data } = await axiosClient.post(`/regulator/certificates/${userId}/reactivate`);
  return data;
}

// GET /api/documents/:docId/file — same endpoint signer-frontend uses;
// regulators are one of the privileged roles allowed to fetch any document's
// file (see backend document.controller.js). Returns { url, type } so the
// caller can pick a renderer (iframe for PDFs, img for images, else a link).
export async function fetchDocumentFile(docId) {
  const res = await axiosClient.get(`/documents/${docId}/file`, { responseType: 'blob' });
  return { url: window.URL.createObjectURL(res.data), type: res.data.type };
}
