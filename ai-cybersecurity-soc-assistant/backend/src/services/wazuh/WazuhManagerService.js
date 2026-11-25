const wazuhApiClient = require('./WazuhApiClient');
const logger = require('../../utils/logger');

class WazuhManagerService {
  /**
   * Get Wazuh manager general status and API info
   */
  async getStatus() {
    try {
      const response = await wazuhApiClient.get('/manager/status');
      return response.data;
    } catch (error) {
      logger.error(`WazuhManagerService getStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Wazuh manager daemon statistics
   */
  async getStats() {
    try {
      const response = await wazuhApiClient.get('/manager/stats');
      return response.data;
    } catch (error) {
      logger.error(`WazuhManagerService getStats error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Wazuh manager logs
   */
  async getLogs(params = {}) {
    try {
      const response = await wazuhApiClient.get('/manager/logs', {
        limit: params.limit || 50,
        offset: params.offset || 0,
        type_log: params.type_log,
        level: params.level,
      });
      return response.data;
    } catch (error) {
      logger.error(`WazuhManagerService getLogs error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get manager configuration summary
   */
  async getConfiguration() {
    try {
      const response = await wazuhApiClient.get('/manager/configuration');
      return response.data;
    } catch (error) {
      logger.error(`WazuhManagerService getConfiguration error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WazuhManagerService();
