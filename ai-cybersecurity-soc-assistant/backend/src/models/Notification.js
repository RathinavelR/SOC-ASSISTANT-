const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  type: {
    type: String,
    enum: ['alert', 'incident', 'agent', 'system', 'threat_intel'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info',
  },
  read: { type: Boolean, default: false },
  referenceType: { type: String, enum: ['alert', 'incident', 'agent', 'report'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
