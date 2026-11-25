const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'incident', 'threat_intel', 'agent_health', 'custom'],
    required: true,
  },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dateRange: {
    start: { type: Date },
    end: { type: Date },
  },
  data: {
    summary: { type: mongoose.Schema.Types.Mixed },
    alertStats: { type: mongoose.Schema.Types.Mixed },
    severityDistribution: { type: mongoose.Schema.Types.Mixed },
    topThreats: [{ type: mongoose.Schema.Types.Mixed }],
    topAgents: [{ type: mongoose.Schema.Types.Mixed }],
    topSourceIps: [{ type: mongoose.Schema.Types.Mixed }],
    incidents: [{ type: mongoose.Schema.Types.Mixed }],
    mitreTechniques: [{ type: mongoose.Schema.Types.Mixed }],
    aiInsights: [{ type: mongoose.Schema.Types.Mixed }],
    agentHealth: [{ type: mongoose.Schema.Types.Mixed }],
  },
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating',
  },
}, { timestamps: true });

reportSchema.index({ type: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('Report', reportSchema);
