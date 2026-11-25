const config = require('../config');
const wazuhAlertService = require('../services/wazuh/WazuhAlertService');
const wazuhPoller = require('../services/wazuh/wazuhPoller');
const logger = require('../utils/logger');

exports.receiveWazuhWebhook = async (req, res, next) => {
  try {
    const receivedSecret = req.headers['x-wazuh-integration-secret'];
    const expectedSecret = config.wazuh.integrationSecret;

    if (expectedSecret && receivedSecret !== expectedSecret) {
      logger.warn(`Wazuh webhook unauthorized attempt from ${req.ip}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing integration secret',
      });
    }

    const rawAlert = req.body;
    if (!rawAlert || Object.keys(rawAlert).length === 0) {
      return res.status(400).json({ success: false, message: 'Empty alert payload' });
    }

    // Normalize alert
    const normalized = wazuhAlertService.normalizeAlert(rawAlert);

    // Ingest through pipeline
    const alertDoc = await wazuhPoller.processAlert(normalized, false);

    res.status(200).json({
      success: true,
      message: 'Alert processed and ingested successfully',
      alertId: alertDoc._id,
    });
  } catch (error) {
    logger.error(`Error processing incoming Wazuh webhook: ${error.message}`);
    next(error);
  }
};
