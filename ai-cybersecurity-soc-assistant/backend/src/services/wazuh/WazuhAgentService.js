const wazuhApiClient = require('./WazuhApiClient');
const logger = require('../../utils/logger');

/**
 * WazuhAgentService - Manages Wazuh agent operations
 */
class WazuhAgentService {
  /**
   * Get all agents with optional filters
   */
  async getAgents(params = {}) {
    try {
      const queryParams = {
        limit: params.limit || 500,
        offset: params.offset || 0,
        ...(params.status && { status: params.status }),
        ...(params.search && { search: params.search }),
        ...(params.sort && { sort: params.sort }),
        select: 'id,name,ip,status,os.name,os.version,os.platform,version,manager,group,lastKeepAlive,dateAdd,node_name,registerIP',
      };
      const response = await wazuhApiClient.get('/agents', queryParams);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get agents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId) {
    try {
      const response = await wazuhApiClient.get(`/agents`, { agents_list: agentId });
      return response.data?.affected_items?.[0] || null;
    } catch (error) {
      logger.error(`Failed to get agent ${agentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent summary (counts by status)
   */
  async getAgentSummary() {
    try {
      const response = await wazuhApiClient.get('/agents/summary/status');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get agent summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent OS summary
   */
  async getAgentOsSummary() {
    try {
      const response = await wazuhApiClient.get('/agents/summary/os');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get agent OS summary: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get syscollector info for an agent
   */
  async getSyscollector(agentId, resource = 'hardware') {
    try {
      const response = await wazuhApiClient.get(`/syscollector/${agentId}/${resource}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get syscollector ${resource} for agent ${agentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get SCA results for an agent
   */
  async getScaResults(agentId) {
    try {
      const response = await wazuhApiClient.get(`/sca/${agentId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get SCA for agent ${agentId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get FIM (file integrity monitoring) results for an agent
   */
  async getFimEvents(agentId, params = {}) {
    try {
      const response = await wazuhApiClient.get(`/syscheck/${agentId}`, params);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get FIM events for agent ${agentId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new WazuhAgentService();
