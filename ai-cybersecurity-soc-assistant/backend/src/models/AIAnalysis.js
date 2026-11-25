const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', index: true },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  threatType: { type: String },
  confidence: { type: Number, default: 0, min: 0, max: 1 },
  isAnomaly: { type: Boolean, default: false },
  mitreTechniques: [{
    id: String,
    name: String,
    tactic: String,
  }],
  explanation: { type: String },
  recommendedActions: [{ type: String }],
  riskFactors: [{
    factor: String,
    weight: Number,
    value: mongoose.Schema.Types.Mixed,
    contribution: Number,
  }],
  llmAnalysis: { type: String },
  analysisSource: {
    type: String,
    enum: ['ml_model', 'rule_based', 'llm', 'hybrid'],
    default: 'rule_based',
  },
}, { timestamps: true });

aiAnalysisSchema.index({ alertId: 1 });
aiAnalysisSchema.index({ riskScore: -1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
