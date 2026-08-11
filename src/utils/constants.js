module.exports = {
  ROLES: {
    USER: 'user',
    SIGNER: 'signer',
    REGULATOR: 'regulator',
  },

  DOCUMENT_STATUS: {
    PENDING: 'pending',
    SIGNED: 'signed',
    REJECTED: 'rejected',
    REVOKED: 'revoked',
  },

  CERT_STATUS: {
    ACTIVE: 'active',
    REVOKED: 'revoked',
  },

  AUDIT_ACTIONS: {
    UPLOADED: 'uploaded',
    SIGNED: 'signed',
    REJECTED: 'rejected',
    CERT_REVOKED: 'cert_revoked',
    CERT_REACTIVATED: 'cert_reactivated',
  },

  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
  ],
};
