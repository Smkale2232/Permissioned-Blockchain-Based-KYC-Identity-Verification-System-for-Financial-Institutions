import axiosClient from './axiosClient';

// GET /api/verify/:docId — public endpoint, no auth required. Backs the
// shareable "Verify" link/QR code for a document.
export function verifyDocument(docId) {
  return axiosClient.get(`/verify/${docId}`).then((res) => res.data);
}
