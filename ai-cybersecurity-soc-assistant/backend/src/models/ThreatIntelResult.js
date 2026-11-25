const mongoose = require('mongoose');

const threatIntelResultSchema = new mongoose.Schema({
  indicator: { type: String, required: true, index: true },
  indicatorType: {
    type: String,
    enum: ['ip', 'hash', 'domain', 'url'],
    required: true,
  },
  source: {
    type: String,
    enum: ['virustotal', 'abuseipdb', 'shodan'],
    required: true,
  },
  result: { type: mongoose.Schema.Types.Mixed },
  reputation: { type: String, enum: ['clean', 'suspicious', 'malicious', 'unknown'], default: 'unknown' },
  abuseScore: { type: Number },
  country: { type: String },
  isp: { type: String },
  detectionCount: { type: Number, default: 0 },
  totalEngines: { type: Number, default: 0 },
  maliciousReports: { type: Number, default: 0 },
  lastChecked: { type: Date, default: Date.now },
  ttl: { type: Date, index: { expireAfterSeconds: 0 } }, // Auto-expire cache
}, { timestamps: true });

threatIntelResultSchema.index({ indicator: 1, source: 1 }, { unique: true });
threatIntelResultSchema.index({ lastChecked: 1 });

module.exports = mongoose.model('ThreatIntelResult', threatIntelResultSchema);
