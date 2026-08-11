const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const fabricService = require('../services/fabric.service');
const credentialService = require('../services/credential.service');
const { hashFileAtPath } = require('../services/crypto.service');
const { verifyFileSignature } = require('../utils/fileSignature');
const { DOCUMENT_STATUS, AUDIT_ACTIONS } = require('../utils/constants');

const MAX_TITLE_LENGTH = 150; // matches Document schema's title maxlength exactly

// GET /api/documents — the logged-in user's own uploaded documents
async function listMyDocuments(req, res, next) {
  try {
    const docs = await Document.find({ uploadedBy: req.user.id }).sort({ uploadedAt: -1 });
    res.json(docs.map((d) => d.toClientJSON()));
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/upload — multipart: { file, title }
async function uploadDocument(req, res, next) {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: 'Title is required.' });
    }
    if (title.trim().length > MAX_TITLE_LENGTH) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ message: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'A file is required.' });
    }

    // The real security boundary for file type — multer's fileFilter only
    // checked the client-supplied Content-Type, which is trivially spoofable.
    // This reads the file's actual magic bytes off disk.
    if (!verifyFileSignature(req.file.path, req.file.mimetype)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({
        message: "The file's contents don't match its declared type. Use a genuine PDF, Word, PNG, or JPEG file.",
      });
    }

    const fileHash = hashFileAtPath(req.file.path);
    const docId = new mongoose.Types.ObjectId();

    // Chaincode: CreateDocument(docId, title, fileHash, uploaderId)
    const { txId } = await fabricService.createDocument({
      docId: docId.toString(),
      title: title.trim(),
      fileHash,
      uploaderId: req.user.id,
      uploaderUser: req.userDoc,   // full doc, has fabricEnrollmentId + role
    });

    const doc = new Document({
      _id: docId,
      title: title.trim(),
      fileName: req.file.originalname,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSizeBytes: req.file.size,
      fileHash,
      status: DOCUMENT_STATUS.PENDING,
      uploadedBy: req.user.id,
      uploadedByName: req.user.name,
      uploadedByEmail: req.user.email,
      fabricTxIdCreate: txId,
    });
    await doc.save();

    await AuditLog.create({
      document: doc._id,
      actor: req.user.id,
      actorName: req.user.name,
      action: AUDIT_ACTIONS.UPLOADED,
      fabricTxId: txId,
    });

    res.status(201).json(doc.toClientJSON());
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(err);
  }
}

// GET /api/documents/:docId/history — audit trail for one document
async function getDocumentHistory(req, res, next) {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    // Only the uploader, the signer who acted on it, or a signer/regulator may view.
    const isOwner = doc.uploadedBy.toString() === req.user.id;
    const isPrivileged = ['signer', 'regulator'].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'You do not have access to this document.' });
    }

    // Chaincode: GetDocumentHistory(docId) — falls back to MongoDB in mock mode.
    const onChainHistory = await fabricService.getDocumentHistory(docId, req.userDoc);
    if (onChainHistory) return res.json(onChainHistory);

    const logs = await AuditLog.find({ document: docId }).sort({ timestamp: 1 });
    res.json(logs.map((l) => l.toClientJSON()));
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/pending — documents awaiting this signer's signature
async function listPendingDocuments(req, res) {
  const docs = await Document.find({ status: DOCUMENT_STATUS.PENDING }).sort({ uploadedAt: 1 });
  return docs.map((d) => d.toClientJSON());
}

// GET /api/documents/pending — route handler wrapper
async function pendingHandler(req, res, next) {
  try {
    const docs = await listPendingDocuments(req, res);
    res.json(docs);
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/sign/:docId
async function signDocument(req, res, next) {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    if (doc.status !== DOCUMENT_STATUS.PENDING) {
      return res.status(409).json({ message: 'Document already handled.' });
    }

    // Fetch the signer's private key up front — fail before touching Fabric
    // or the document at all if this account somehow has no certificate
    // (e.g. data created before this feature existed).
    const signerWithKey = await User.findById(req.user.id).select('+privateKeyPem');
    if (!signerWithKey?.privateKeyPem) {
      return res.status(409).json({
        message: 'Your account has no signing certificate yet — this can happen for accounts created before this feature existed. Contact support.',
      });
    }

    // Chaincode: SignDocument(docId, signerId)
    const { txId } = await fabricService.signDocument({
      docId,
      signerId: req.user.id,
      signerUser: req.userDoc,
    });

    // Issue a Verifiable Credential proving this signature — signed with the
    // signer's own RSA private key (never exposed via any API response; only
    // fetched here, server-side, to produce this one signature). See
    // credential.service.js / PKI.md for exactly what this proves.
    const credential = credentialService.issueDocumentCredential(
      { id: doc._id.toString(), title: doc.title, fileHash: doc.fileHash },
      {
        id: signerWithKey._id.toString(),
        name: signerWithKey.name,
        certificateSerialNumber: signerWithKey.certificateSerialNumber,
        privateKeyPem: signerWithKey.privateKeyPem,
      }
    );

    doc.status = DOCUMENT_STATUS.SIGNED;
    doc.signedBy = req.user.id;
    doc.signedByName = req.user.name;
    doc.signedAt = new Date();
    doc.fabricTxIdSign = txId;
    doc.credential = credential;
    await doc.save();

    await AuditLog.create({
      document: doc._id,
      actor: req.user.id,
      actorName: req.user.name,
      action: AUDIT_ACTIONS.SIGNED,
      fabricTxId: txId,
    });

    res.json(doc.toClientJSON());
  } catch (err) {
    next(err);
  }
}

// GET /api/documents/:docId/file — stream the underlying file so a signer can
// review it before signing/denying. Same access rule as history: owner, or
// a signer/regulator.
async function downloadDocumentFile(req, res, next) {
  try {
    const { docId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });

    const isOwner = doc.uploadedBy.toString() === req.user.id;
    const isPrivileged = ['signer', 'regulator'].includes(req.user.role);
    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'You do not have access to this document.' });
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
    res.sendFile(path.resolve(doc.filePath));
  } catch (err) {
    next(err);
  }
}

// POST /api/documents/reject/:docId — signer declines a pending document.
// Requires the account PIN (see pin.middleware.js), same as signing.
async function rejectDocument(req, res, next) {
  try {
    const { docId } = req.params;
    const { reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(docId)) {
      return res.status(404).json({ message: 'Document not found.' });
    }

    const doc = await Document.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Document not found.' });
    if (doc.status !== DOCUMENT_STATUS.PENDING) {
      return res.status(409).json({ message: 'Document already handled.' });
    }

    const { txId } = await fabricService.rejectDocument({
      docId,
      signerId: req.user.id,
      signerUser: req.userDoc,
      reason,
    });

    doc.status = DOCUMENT_STATUS.REJECTED;
    doc.signedBy = req.user.id;
    doc.signedByName = req.user.name;
    doc.signedAt = new Date();
    doc.fabricTxIdReject = txId;
    await doc.save();

    await AuditLog.create({
      document: doc._id,
      actor: req.user.id,
      actorName: req.user.name,
      action: AUDIT_ACTIONS.REJECTED,
      note: reason ? String(reason).slice(0, 500) : null,
      fabricTxId: txId,
    });

    res.json(doc.toClientJSON());
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMyDocuments,
  uploadDocument,
  getDocumentHistory,
  pendingHandler,
  signDocument,
  rejectDocument,
  downloadDocumentFile,
};
