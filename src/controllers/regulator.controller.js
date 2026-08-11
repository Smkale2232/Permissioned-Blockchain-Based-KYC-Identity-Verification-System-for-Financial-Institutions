const mongoose = require('mongoose');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const fabricService = require('../services/fabric.service');
const caService = require('../services/ca.service');
const { DOCUMENT_STATUS, CERT_STATUS, AUDIT_ACTIONS } = require('../utils/constants');

// GET /api/regulator/statistics — overview StatCards
// Chaincode: GetStatistics()
async function getStatistics(req, res, next) {
  try {
    const onChainStats = await fabricService.getStatistics(req.userDoc);
    if (onChainStats) return res.json(onChainStats);

    const [totalDocuments, pending, signed, rejected, totalUsers, revokedCerts] = await Promise.all([
      Document.countDocuments(),
      Document.countDocuments({ status: DOCUMENT_STATUS.PENDING }),
      Document.countDocuments({ status: DOCUMENT_STATUS.SIGNED }),
      Document.countDocuments({ status: DOCUMENT_STATUS.REJECTED }),
      User.countDocuments(),
      User.countDocuments({ certificateStatus: CERT_STATUS.REVOKED }),
    ]);

    res.json({
      totalDocuments,
      pending,
      signed,
      rejected,
      totalUsers,
      revokedCertificates: revokedCerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/regulator/documents — Chaincode: GetAllDocuments()
// Supports optional ?userId= filter to scope to one user's uploads (used by
// the Certificate Management "Review" action).
async function getAllDocuments(req, res, next) {
  try {
    const onChainDocs = await fabricService.getAllDocuments(req.userDoc);
    if (onChainDocs) return res.json(onChainDocs);

    const filter = {};
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      filter.uploadedBy = req.query.userId;
    }

    const docs = await Document.find(filter).sort({ uploadedAt: -1 });
    res.json(docs.map((d) => d.toClientJSON()));
  } catch (err) {
    next(err);
  }
}

// GET /api/regulator/audit-trail — every audit event, most recent first
// Supports optional ?docId= filter for drilling into a single document, or
// ?userId= to see everything done by/to one account (used by "Review").
async function getAuditTrail(req, res, next) {
  try {
    const filter = {};
    if (req.query.docId && mongoose.Types.ObjectId.isValid(req.query.docId)) {
      filter.document = req.query.docId;
    }
    if (req.query.userId && mongoose.Types.ObjectId.isValid(req.query.userId)) {
      filter.$or = [{ actor: req.query.userId }, { targetUser: req.query.userId }];
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(500)
      .populate('document', 'title status');

    res.json(
      logs.map((l) => ({
        ...l.toClientJSON(),
        documentId: l.document?._id?.toString(),
        documentTitle: l.document?.title,
        documentStatus: l.document?.status,
      }))
    );
  } catch (err) {
    next(err);
  }
}

// POST /api/regulator/certificates/:userId/revoke
async function revokeCertificate(req, res, next) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.certificateStatus === CERT_STATUS.REVOKED) {
      return res.status(409).json({ message: 'Certificate already revoked.' });
    }

    // CA-level revocation + on-chain record (chaincode RevokeCertificate)
    await caService.revokeCertificate(user);
    const { txId } = await fabricService.revokeCertificateOnChain(userId, req.userDoc);

    user.certificateStatus = CERT_STATUS.REVOKED;
    user.certificateRevokedAt = new Date();
    await user.save();

    await AuditLog.create({
      targetUser: user._id,
      targetUserName: user.name,
      actor: req.user.id,
      actorName: req.user.name,
      action: AUDIT_ACTIONS.CERT_REVOKED,
      fabricTxId: txId,
    });

    res.json({
      userId: user._id.toString(),
      email: user.email,
      certificateStatus: user.certificateStatus,
      revokedAt: user.certificateRevokedAt,
      fabricTxId: txId,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/regulator/certificates/:userId/reactivate — corrective un-revoke,
// used by the Certificate Management "Reactivate" action.
async function reactivateCertificate(req, res, next) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.certificateStatus !== CERT_STATUS.REVOKED) {
      return res.status(409).json({ message: 'Certificate is not currently revoked.' });
    }

    await caService.reactivateCertificate(user);
    const { txId } = await fabricService.reactivateCertificateOnChain(userId, req.userDoc);

    user.certificateStatus = CERT_STATUS.ACTIVE;
    user.certificateRevokedAt = null;
    await user.save();

    await AuditLog.create({
      targetUser: user._id,
      targetUserName: user.name,
      actor: req.user.id,
      actorName: req.user.name,
      action: AUDIT_ACTIONS.CERT_REACTIVATED,
      fabricTxId: txId,
    });

    res.json({
      userId: user._id.toString(),
      email: user.email,
      certificateStatus: user.certificateStatus,
      fabricTxId: txId,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/regulator/users — for the Certificate Management view
async function listUsers(req, res, next) {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        employeeId: u.employeeId,
        certificateStatus: u.certificateStatus,
        certificateRevokedAt: u.certificateRevokedAt,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStatistics,
  getAllDocuments,
  getAuditTrail,
  revokeCertificate,
  reactivateCertificate,
  listUsers,
};
