const aiServiceClient = require('../services/ai/aiServiceClient');
const riskScorer = require('../services/ai/riskScorer');
const { Alert, AIAnalysis } = require('../models');

exports.analyzeTextOrAlert = async (req, res, next) => {
  try {
    const { alertData, logText } = req.body;

    let payload = alertData;
    if (!payload && logText) {
      payload = {
        ruleDescription: 'Custom SOC Analyst Log Review',
        fullLog: logText,
        ruleLevel: 7,
      };
    }

    const result = await aiServiceClient.analyzeAlert(payload || {});
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAiInsights = async (req, res, next) => {
  try {
    const [recentAnalyses, anomalyCount, highRiskCount] = await Promise.all([
      AIAnalysis.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('alertId', 'ruleDescription severity agentName sourceIp timestamp'),
      AIAnalysis.countDocuments({ isAnomaly: true }),
      AIAnalysis.countDocuments({ riskScore: { $gte: 70 } }),
    ]);

    res.json({
      success: true,
      data: {
        recentAnalyses,
        stats: {
          anomaliesDetected: anomalyCount,
          highRiskThreats: highRiskCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.calculateRisk = async (req, res, next) => {
  try {
    const { alert, threatIntel, count } = req.body;
    const score = riskScorer.calculateScore(alert || {}, threatIntel, count || 1);
    res.json({
      success: true,
      data: score,
    });
  } catch (error) {
    next(error);
  }
};
