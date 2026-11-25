const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed },
  description: { type: String },
  category: {
    type: String,
    enum: ['general', 'wazuh', 'notifications', 'ai', 'threat_intel', 'security'],
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
