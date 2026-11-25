const mongoose = require('mongoose');

const agentSnapshotSchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  name: { type: String },
  ip: { type: String },
  status: {
    type: String,
    enum: ['active', 'disconnected', 'never_connected', 'pending'],
    index: true,
  },
  os: {
    name: String,
    version: String,
    platform: String,
    arch: String,
  },
  version: { type: String },
  manager: { type: String },
  group: [{ type: String }],
  lastKeepAlive: { type: Date },
  dateAdd: { type: Date },
  node: { type: String },
  registerIP: { type: String },
  configSum: { type: String },
  mergedSum: { type: String },
  lastSnapshot: { type: Date, default: Date.now },
}, { timestamps: true });

agentSnapshotSchema.index({ agentId: 1, lastSnapshot: -1 });

module.exports = mongoose.model('AgentSnapshot', agentSnapshotSchema);
