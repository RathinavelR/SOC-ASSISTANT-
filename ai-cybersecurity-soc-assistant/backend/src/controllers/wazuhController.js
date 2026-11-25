const wazuhApiClient = require('../services/wazuh/WazuhApiClient');
const wazuhAgentService = require('../services/wazuh/WazuhAgentService');
const wazuhAlertService = require('../services/wazuh/WazuhAlertService');
const wazuhManagerService = require('../services/wazuh/WazuhManagerService');
const wazuhMitreService = require('../services/wazuh/WazuhMitreService');
const { AgentSnapshot, Alert } = require('../models');
const logger = require('../utils/logger');

exports.getStatus = async (req, res, next) => {
  try {
    const testResult = await wazuhApiClient.testConnection();
    res.json({
      success: true,
      data: testResult,
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        success: false,
        status: 'SERVER_UNREACHABLE',
        error: error.message,
      },
    });
  }
};

exports.getAgents = async (req, res, next) => {
  try {
    // Attempt live Wazuh API first
    const agentsData = await wazuhAgentService.getAgents(req.query);
    return res.json({
      success: true,
      source: 'live_wazuh',
      data: agentsData,
    });
  } catch (error) {
    logger.warn(`Live Wazuh unreachable. Falling back to cached agent snapshots: ${error.message}`);
    
    // Fallback: Query MongoDB AgentSnapshot collection
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { ip: { $regex: req.query.search, $options: 'i' } },
        { agentId: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const cachedAgents = await AgentSnapshot.find(filter).sort({ agentId: 1 });
    return res.json({
      success: true,
      source: 'cached_snapshot',
      data: {
        affected_items: cachedAgents.map((a) => ({
          id: a.agentId,
          name: a.name,
          ip: a.ip,
          status: a.status,
          os: a.os,
          version: a.version,
          manager: a.manager,
          group: a.group,
          lastKeepAlive: a.lastKeepAlive,
          dateAdd: a.dateAdd,
        })),
        total_affected_items: cachedAgents.length,
      },
    });
  }
};

exports.getAgentById = async (req, res, next) => {
  try {
    const agentId = req.params.id;
    let agent = null;

    try {
      agent = await wazuhAgentService.getAgent(agentId);
    } catch (err) {
      logger.warn(`Failed to fetch live agent ${agentId}: ${err.message}`);
    }

    if (!agent) {
      const snapshot = await AgentSnapshot.findOne({ agentId });
      if (snapshot) {
        agent = {
          id: snapshot.agentId,
          name: snapshot.name,
          ip: snapshot.ip,
          status: snapshot.status,
          os: snapshot.os,
          version: snapshot.version,
          manager: snapshot.manager,
          group: snapshot.group,
          lastKeepAlive: snapshot.lastKeepAlive,
          dateAdd: snapshot.dateAdd,
        };
      }
    }

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: `Agent with ID ${agentId} not found`,
      });
    }

    // Also fetch recent alerts for this agent
    const recentAlerts = await Alert.find({ agentId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      data: {
        agent,
        recentAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getManagerInfo = async (req, res, next) => {
  try {
    const status = await wazuhManagerService.getStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Wazuh Manager is currently disconnected or unreachable.',
      error: error.message,
    });
  }
};

exports.getRules = async (req, res, next) => {
  try {
    const rules = await wazuhAlertService.getRules(req.query);
    res.json({
      success: true,
      data: rules,
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Wazuh Rules service unreachable.',
      error: error.message,
      data: { affected_items: [], total_affected_items: 0 },
    });
  }
};

exports.getMitre = async (req, res, next) => {
  try {
    const mitre = await wazuhMitreService.getTechniques(req.query);
    res.json({
      success: true,
      data: mitre,
    });
  } catch (error) {
    // Return standard fallback MITRE framework items
    const aggregated = await Alert.aggregate([
      { $unwind: '$mitre.technique' },
      {
        $group: {
          _id: {
            technique: '$mitre.technique',
            tactic: { $first: '$mitre.tactic' },
            id: { $first: '$mitre.id' },
          },
          alertCount: { $sum: 1 },
        },
      },
      { $sort: { alertCount: -1 } },
    ]);

    res.json({
      success: true,
      source: 'alert_aggregations',
      data: {
        affected_items: aggregated.map((item) => ({
          technique: item._id.technique,
          tactic: item._id.tactic?.[0] || 'Unknown',
          id: item._id.id?.[0] || 'T0000',
          alertCount: item.alertCount,
        })),
        total_affected_items: aggregated.length,
      },
    });
  }
};

exports.getAgentSyscollector = async (req, res, next) => {
  try {
    const data = await wazuhAgentService.getSyscollector(req.params.id, req.query.resource || 'hardware');
    res.json({ success: true, data });
  } catch (error) {
    res.json({
      success: false,
      message: 'Syscollector data unavailable for this agent.',
      error: error.message,
    });
  }
};

exports.getAgentFim = async (req, res, next) => {
  try {
    const data = await wazuhAgentService.getFimEvents(req.params.id, req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.json({
      success: false,
      message: 'FIM data unavailable for this agent.',
      error: error.message,
    });
  }
};

exports.getAgentSca = async (req, res, next) => {
  try {
    const data = await wazuhAgentService.getScaResults(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    res.json({
      success: false,
      message: 'SCA data unavailable for this agent.',
      error: error.message,
    });
  }
};
