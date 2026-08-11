const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../utils/constants');

const auditLogSchema = new mongoose.Schema(
  {
    // Present for document events (upload/sign/reject); absent for account-level
    // events like a certificate revoke/reactivate, which use targetUser instead.
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null, index: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetUserName: { type: String, default: null },

    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actorName: { type: String, required: true },
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
    fabricTxId: { type: String, default: null },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

auditLogSchema.methods.toClientJSON = function toClientJSON() {
  return {
    id: this._id.toString(),
    actor: this.actorName,
    action: this.action,
    timestamp: this.timestamp,
    fabricTxId: this.fabricTxId,
    note: this.note,
    targetUser: this.targetUserName,
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
