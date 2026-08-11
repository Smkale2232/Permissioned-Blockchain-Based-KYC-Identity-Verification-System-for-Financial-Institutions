const mongoose = require('mongoose');
const { ROLES, CERT_STATUS } = require('../utils/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false }, // bcrypt hash

    // 4–6 digit PIN, set at registration, required to confirm upload/sign/reject.
    // Hashed the same way as password (bcrypt) — never stored or returned in plain text.
    actionPinHash: { type: String, default: null, select: false },

    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.USER,
    },

    // Optional custom identifier — mainly used by the regulator role in place
    // of a hardcoded display name (see Profile page).
    employeeId: { type: String, default: null, trim: true, maxlength: 40 },

    // Forgot-password flow: a short-lived, hashed, single-use token.
    // Never store the raw token — only its sha256 hash (see utils/hash.js).
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },

    // --- PKI identity (backend/src/services/pki.service.js) ---
    // Generated once at registration: a real RSA-2048 keypair + self-signed
    // X.509 certificate. The private key never leaves the server and is
    // never returned by any API response (select: false) — it's used only
    // server-side to sign Verifiable Credentials when this user signs a
    // document. See PKI.md for what this does and doesn't provide.
    publicKeyPem: { type: String, default: null },
    privateKeyPem: { type: String, default: null, select: false },
    certificatePem: { type: String, default: null },
    certificateSerialNumber: { type: String, default: null, index: true },

    // --- Fabric identity (populated by ca.service.js) ---
    fabricEnrollmentId: { type: String, default: null },
    certificateStatus: {
      type: String,
      enum: Object.values(CERT_STATUS),
      default: CERT_STATUS.ACTIVE,
    },
    certificateRevokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    employeeId: this.employeeId,
    certificateStatus: this.certificateStatus,
    certificateSerialNumber: this.certificateSerialNumber,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
