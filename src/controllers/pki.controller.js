const mongoose = require('mongoose');
const User = require('../models/User');
const { CERT_STATUS } = require('../utils/constants');

// GET /api/pki/:userId/certificate — public, no auth required. This is what
// makes "cross-organization trust" real rather than a slogan: any external
// party holding one of our Verifiable Credentials can fetch the issuer's
// certificate here and verify the credential's signature entirely on their
// own, without ever calling back to DocChain to ask "is this valid?".
async function getCertificate(req, res, next) {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(404).json({ found: false, message: 'No certificate found for this id.' });
    }

    const user = await User.findById(userId);
    if (!user || !user.certificatePem) {
      return res.status(404).json({ found: false, message: 'No certificate found for this id.' });
    }

    res.json({
      found: true,
      userId: user._id.toString(),
      name: user.name,
      role: user.role,
      certificatePem: user.certificatePem,
      publicKeyPem: user.publicKeyPem,
      serialNumber: user.certificateSerialNumber,
      status: user.certificateStatus,
      revokedAt: user.certificateRevokedAt,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/pki/revocation-list — public, no auth required. A simplified
// Certificate Revocation List: every currently-revoked certificate's serial
// number. A real external verifier can check a credential's issuer against
// this list instead of (or in addition to) calling getCertificate above.
async function getRevocationList(req, res, next) {
  try {
    const revokedUsers = await User.find({ certificateStatus: CERT_STATUS.REVOKED }).select(
      'certificateSerialNumber certificateRevokedAt'
    );
    res.json({
      generatedAt: new Date().toISOString(),
      revoked: revokedUsers
        .filter((u) => u.certificateSerialNumber)
        .map((u) => ({ serialNumber: u.certificateSerialNumber, revokedAt: u.certificateRevokedAt })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCertificate, getRevocationList };
