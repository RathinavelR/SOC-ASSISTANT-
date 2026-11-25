const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['auth', 'alert', 'incident', 'report', 'settings', 'admin', 'ai', 'system'],
    required: true,
  },
  description: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['success', 'failure'],
    default: 'success',
  },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
