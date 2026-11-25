const mongoose = require('mongoose');
const wazuhApiClient = require('../services/wazuh/WazuhApiClient');
const config = require('../config');
const axios = require('axios');

exports.getOverallHealth = async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const wazuhStatus = wazuhApiClient.connected ? 'CONNECTED' : 'DISCONNECTED';
  
  let aiStatus = 'DISCONNECTED';
  try {
    const aiRes = await axios.get(`${config.aiService.url}/health`, { timeout: 2000 });
    if (aiRes.status === 200) aiStatus = 'UP';
  } catch (err) {
    aiStatus = 'DOWN / LOCAL FALLBACK';
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'UP',
      database: dbStatus,
      wazuh: wazuhStatus,
      aiService: aiStatus,
      demoMode: config.demoMode,
    },
  });
};

exports.getDbHealth = (req, res) => {
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const state = states[mongoose.connection.readyState] || 'Unknown';
  res.json({
    success: mongoose.connection.readyState === 1,
    status: state,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });
};

exports.getAiHealth = async (req, res) => {
  try {
    const response = await axios.get(`${config.aiService.url}/health`, { timeout: 3000 });
    res.json({
      success: true,
      service: 'ai-microservice',
      data: response.data,
    });
  } catch (error) {
    res.json({
      success: false,
      service: 'ai-microservice',
      status: 'UNREACHABLE',
      fallback: 'Deterministic AI heuristic engine active',
      error: error.message,
    });
  }
};
