const mongoose = require('mongoose');

const timelineEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  automated: { type: Boolean, default: false },
}, { _id: true });

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
    index: true,
  },
  relatedAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
  affectedAgents: [{
    agentId: String,
    agentName: String,
    agentIp: String,
  }],
  sourceIps: [{ type: String }],
  destinationIps: [{ type: String }],
  mitreTechniques: [{
    id: String,
    name: String,
    tactic: String,
  }],
  threatIntelResults: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ThreatIntelResult' }],
  aiAnalysis: { type: mongoose.Schema.Types.Mixed },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  timeline: [timelineEntrySchema],
  comments: [commentSchema],
  resolution: { type: String },
  resolvedAt: { type: Date },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });

incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ createdAt: -1 });
incidentSchema.index({ assignedTo: 1, status: 1 });

// Auto-generate incident ID
incidentSchema.pre('save', async function (next) {
  if (this.isNew && !this.incidentId) {
    const count = await mongoose.model('Incident').countDocuments();
    this.incidentId = `INC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Incident', incidentSchema);
