const wazuhApiClient = require('./WazuhApiClient');
const logger = require('../../utils/logger');

/**
 * WazuhAlertService - Handles Wazuh alert retrieval and normalization
 */
class WazuhAlertService {
  /**
   * Get alerts from Wazuh (via Wazuh Indexer / Elasticsearch API)
   * Note: Wazuh 4.x stores alerts in the Wazuh Indexer (OpenSearch).
   * For simpler setups, alerts come through the integration webhook or polling.
   * This method queries the Wazuh Manager API for log/alert data.
   */
  async getAlerts(params = {}) {
    try {
      // Wazuh Manager API doesn't have a direct /alerts endpoint.
      // Alerts are typically in the Wazuh Indexer. We use /manager/logs
      // for manager-level events, or rely on the integration webhook.
      // For compatibility, try the vulnerability/security events endpoints.
      const queryParams = {
        limit: params.limit || 20,
        offset: params.offset || 0,
        ...(params.sort && { sort: params.sort }),
      };

      // Try to get security events via the manager log endpoint
      const response = await wazuhApiClient.get('/manager/logs', queryParams);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get alerts from Wazuh: ${error.message}`);
      throw error;
    }
  }

  /**
   * Normalize a raw Wazuh alert into our standard schema
   */
  normalizeAlert(rawAlert) {
    const rule = rawAlert.rule || {};
    const agent = rawAlert.agent || {};
    const data = rawAlert.data || {};
    const mitre = rule.mitre || {};

    // Determine severity from Wazuh rule level
    let severity = 'low';
    const level = rule.level || 0;
    if (level >= 12) severity = 'critical';
    else if (level >= 8) severity = 'high';
    else if (level >= 5) severity = 'medium';

    return {
      wazuhAlertId: rawAlert.id || rawAlert._id || `wazuh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: rawAlert.timestamp ? new Date(rawAlert.timestamp) : new Date(),
      ruleId: String(rule.id || ''),
      ruleLevel: level,
      ruleDescription: rule.description || '',
      ruleGroups: rule.groups || [],
      agentId: String(agent.id || '000'),
      agentName: agent.name || 'unknown',
      agentIp: agent.ip || '',
      sourceIp: data.srcip || data.src_ip || rawAlert.srcip || '',
      destinationIp: data.dstip || data.dst_ip || rawAlert.dstip || '',
      sourcePort: data.srcport ? parseInt(data.srcport, 10) : undefined,
      destinationPort: data.dstport ? parseInt(data.dstport, 10) : undefined,
      location: rawAlert.location || '',
      decoder: rawAlert.decoder?.name || '',
      fullLog: rawAlert.full_log || '',
      mitre: {
        id: mitre.id || [],
        tactic: mitre.tactic || [],
        technique: mitre.technique || [],
      },
      severity,
      status: 'NEW',
      rawAlert,
    };
  }

  /**
   * Get Wazuh rules
   */
  async getRules(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 500,
        offset: params.offset || 0,
        ...(params.search && { search: params.search }),
        ...(params.level && { level: params.level }),
      };
      const response = await wazuhApiClient.get('/rules', queryParams);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get rules: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Wazuh decoders
   */
  async getDecoders(params = {}) {
    try {
      const response = await wazuhApiClient.get('/decoders', {
        limit: params.limit || 500,
        offset: params.offset || 0,
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get decoders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get MITRE ATT&CK information from Wazuh
   */
  async getMitreInfo() {
    try {
      const response = await wazuhApiClient.get('/mitre', { limit: 500 });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get MITRE info: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WazuhAlertService();
