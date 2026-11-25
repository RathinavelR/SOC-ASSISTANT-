const { SystemSetting, AuditLog, User } = require('../models');
const config = require('../config');
const wazuhApiClient = require('../services/wazuh/WazuhApiClient');
const { logAction } = require('../utils/auditLogger');

exports.getSettings = async (req, res, next) => {
  try {
    const dbSettings = await SystemSetting.find();
    
    // Mask sensitive credentials
    const settingsMap = {
      wazuhApiUrl: config.wazuh.apiUrl,
      wazuhUsername: config.wazuh.username,
      wazuhVerifySsl: config.wazuh.verifySsl,
      wazuhMode: config.wazuh.mode,
      wazuhPollInterval: config.wazuh.pollInterval,
      hasWazuhPassword: !!config.wazuh.password,
      hasIntegrationSecret: !!config.wazuh.integrationSecret,
      hasVirusTotalKey: !!config.threatIntel.virusTotalKey,
      hasAbuseIpDbKey: !!config.threatIntel.abuseIpDbKey,
      hasShodanKey: !!config.threatIntel.shodanKey,
      hasOpenAiKey: !!config.openai.apiKey,
      aiServiceUrl: config.aiService.url,
      demoMode: config.demoMode,
    };

    dbSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body;

    for (const [key, value] of Object.entries(updates)) {
      // Don't save empty string passwords if masked
      if (key === 'wazuhPassword' && !value) continue;
      
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value, updatedBy: req.user._id },
        { upsert: true, new: true }
      );
    }

    await logAction({
      req,
      user: req.user,
      action: 'SETTINGS_UPDATED',
      category: 'settings',
      description: `Settings updated by ${req.user.email}`,
    });

    res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, category, search } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('user', 'firstName lastName email role'),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    await user.save();

    await logAction({
      req,
      user: req.user,
      action: 'USER_ROLE_UPDATED',
      category: 'admin',
      description: `Updated role for user ${user.email} to ${user.role} (active: ${user.isActive})`,
    });

    res.json({ success: true, data: user.toJSON() });
  } catch (error) {
    next(error);
  }
};
