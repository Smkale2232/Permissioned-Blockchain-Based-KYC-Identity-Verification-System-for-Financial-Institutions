const mongoose = require('mongoose');
const { DOCUMENT_STATUS } = require('../utils/constants');

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },

    // On-disk file (multer) — the actual bytes never go on-chain, only the hash does.
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    fileHash: { type: String, required: true, index: true }, // sha256 — crypto.service.js

    status: {
      type: String,
      enum: Object.values(DOCUMENT_STATUS),
      default: DOCUMENT_STATUS.PENDING,
    },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByName: { type: String, required: true },
    uploadedByEmail: { type: String, required: true },

    signedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    signedByName: { type: String, default: null },
    signedAt: { type: Date, default: null },

    // --- Fabric ---
    fabricTxIdCreate: { type: String, default: null },
    fabricTxIdSign: { type: String, default: null },
    fabricTxIdReject: { type: String, default: null },

    // --- Verifiable Credential (backend/src/services/credential.service.js) ---
    // Built and signed once, at the moment this document is signed — a
    // W3C Verifiable-Credential-shaped JSON object with a real RSA-SHA256
    // proof from the signer's own certificate. Stored as-issued so the proof
    // stays reproducible; see PKI.md for what "signed" actually means here.
    credential: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: true } }
);

documentSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    title: this.title,
    status: this.status,
    uploadedAt: this.uploadedAt,
    uploadedBy: this.uploadedByName,
    fileHash: this.fileHash,
    signedBy: this.signedByName,
    signedAt: this.signedAt,
    fabricTxIdCreate: this.fabricTxIdCreate,
    fabricTxIdSign: this.fabricTxIdSign,
    fabricTxIdReject: this.fabricTxIdReject,
    credential: this.credential,
  };
};

module.exports = mongoose.model('Document', documentSchema);
