const wazuhApiClient = require('./WazuhApiClient');
const logger = require('../../utils/logger');

class WazuhRuleService {
  /**
   * Get Wazuh rules with pagination, search, level filtering
   */
  async getRules(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 100,
        offset: params.offset || 0,
        ...(params.search && { search: params.search }),
        ...(params.level && { level: params.level }),
        ...(params.group && { group: params.group }),
        ...(params.pci_dss && { pci_dss: params.pci_dss }),
        ...(params.gdpr && { gdpr: params.gdpr }),
        ...(params.hipaa && { hipaa: params.hipaa }),
        ...(params.nist_800_53 && { nist_800_53: params.nist_800_53 }),
      };
      const response = await wazuhApiClient.get('/rules', queryParams);
      return response.data;
    } catch (error) {
      logger.error(`WazuhRuleService getRules error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific rule by ID
   */
  async getRuleById(ruleId) {
    try {
      const response = await wazuhApiClient.get(`/rules/${ruleId}`);
      return response.data?.affected_items?.[0] || null;
    } catch (error) {
      logger.error(`WazuhRuleService getRuleById error for ${ruleId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all rule groups
   */
  async getGroups() {
    try {
      const response = await wazuhApiClient.get('/rules/groups');
      return response.data;
    } catch (error) {
      logger.error(`WazuhRuleService getGroups error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WazuhRuleService();
