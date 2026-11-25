const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  wazuhAlertId: { type: String, index: true },
  timestamp: { type: Date, required: true, index: true },
  ruleId: { type: String, index: true },
  ruleLevel: { type: Number, index: true },
  ruleDescription: { type: String },
  ruleGroups: [{ type: String }],
  agentId: { type: String, index: true },
  agentName: { type: String },
  agentIp: { type: String },
  sourceIp: { type: String, index: true },
  destinationIp: { type: String },
  sourcePort: { type: Number },
  destinationPort: { type: Number },
  location: { type: String },
  decoder: { type: String },
  fullLog: { type: String },
  mitre: {
    id: [{ type: String }],
    tactic: [{ type: String }],
    technique: [{ type: String }],
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
    index: true,
  },
  status: {
    type: String,
    enum: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'],
    default: 'NEW',
    index: true,
  },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  aiAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'AIAnalysis' },
  threatIntel: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ThreatIntelResult' }],
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  rawAlert: { type: mongoose.Schema.Types.Mixed },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

alertSchema.index({ timestamp: -1 });
alertSchema.index({ severity: 1, timestamp: -1 });
alertSchema.index({ agentId: 1, timestamp: -1 });
alertSchema.index({ sourceIp: 1, timestamp: -1 });
alertSchema.index({ ruleId: 1, timestamp: -1 });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ 'mitre.technique': 1 });

module.exports = mongoose.model('Alert', alertSchema);
