const mongoose = require('mongoose');
const Document = require('../models/Document');
const User = require('../models/User');
const credentialService = require('../services/credential.service');

// GET /api/verify/:docId — public, no auth required. Meant to back a
// shareable "verify this document" link/QR code: proves what DocChain has
// recorded about a document (status, hash, who signed it, when, the on-chain
// transaction ids, and — if signed — its Verifiable Credential) without
// exposing the file itself or requiring the viewer to have an account.
//
// The credential's signature is independently RE-VERIFIED here every time
// (not just trusted because it's in the database) against the issuer's
// current public key, and checked against their current certificate status —
// so a credential from a since-revoked signer is flagged as such even though
// the credential JSON itself never changes.
async function verifyDocument(req, res, next) {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(404).json({ found: false, message: 'No document found for this link.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) {
      return res.status(404).json({ found: false, message: 'No document found for this link.' });
    }

    let credentialVerification = null;
    if (doc.credential && doc.signedBy) {
      const issuer = await User.findById(doc.signedBy);
      const signatureValid = issuer?.publicKeyPem
        ? credentialService.verifyDocumentCredential(doc.credential, issuer.publicKeyPem)
        : false;
      credentialVerification = {
        signatureValid,
        issuerCertificateStatus: issuer?.certificateStatus || 'unknown',
        // Trustworthy only when BOTH the cryptographic signature checks out
        // AND the issuer's certificate wasn't revoked after the fact.
        trustworthy: signatureValid && issuer?.certificateStatus === 'active',
      };
    }

    // Deliberately narrow: no filePath, no uploader/signer email or user id —
    // this endpoint is public, so only non-sensitive, already-provable facts
    // about the document go in the response.
    res.json({
      found: true,
      id: doc._id.toString(),
      title: doc.title,
      status: doc.status,
      fileHash: doc.fileHash,
      uploadedByName: doc.uploadedByName,
      uploadedAt: doc.uploadedAt,
      signedByName: doc.signedByName,
      signedAt: doc.signedAt,
      fabricTxIdCreate: doc.fabricTxIdCreate,
      fabricTxIdSign: doc.fabricTxIdSign,
      credential: doc.credential,
      credentialVerification,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { verifyDocument };
