const { AuditLog } = require('../models');
const logger = require('./logger');

const logAction = async ({ req, user = null, action, category, description, metadata = {}, status = 'success' }) => {
  try {
    const userId = user?._id || req?.user?._id || null;
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || req?.ip || '127.0.0.1';
    const userAgent = req?.headers['user-agent'] || 'Unknown';

    await AuditLog.create({
      user: userId,
      action,
      category,
      description,
      ip,
      userAgent,
      metadata,
      status,
    });
  } catch (error) {
    logger.error(`Audit logging failed: ${error.message}`);
  }
};

module.exports = { logAction };
