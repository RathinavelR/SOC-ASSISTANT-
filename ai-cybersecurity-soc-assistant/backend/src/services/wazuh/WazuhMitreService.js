const wazuhApiClient = require('./WazuhApiClient');
const logger = require('../../utils/logger');

class WazuhMitreService {
  /**
   * Get MITRE ATT&CK techniques from Wazuh
   */
  async getTechniques(params = {}) {
    try {
      const response = await wazuhApiClient.get('/mitre', {
        limit: params.limit || 500,
        offset: params.offset || 0,
        search: params.search,
      });
      return response.data;
    } catch (error) {
      logger.error(`WazuhMitreService getTechniques error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get MITRE ATT&CK tactics from Wazuh
   */
  async getTactics() {
    try {
      const response = await wazuhApiClient.get('/mitre/tactics');
      return response.data;
    } catch (error) {
      logger.error(`WazuhMitreService getTactics error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get MITRE details for a specific technique
   */
  async getTechniqueById(techniqueId) {
    try {
      const response = await wazuhApiClient.get(`/mitre/techniques/${techniqueId}`);
      return response.data;
    } catch (error) {
      logger.error(`WazuhMitreService getTechniqueById error for ${techniqueId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WazuhMitreService();
