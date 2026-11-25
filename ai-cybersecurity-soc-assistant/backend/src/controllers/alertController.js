const { Alert, AIAnalysis, ThreatIntelResult, Incident } = require('../models');
const aiServiceClient = require('../services/ai/aiServiceClient');
const threatIntelService = require('../services/threatIntel/threatIntelService');
const { logAction } = require('../utils/auditLogger');

exports.getAlerts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity,
      status,
      agentId,
      ruleId,
      sourceIp,
      startDate,
      endDate,
      search,
      mitreTechnique,
      sort = '-timestamp',
    } = req.query;

    const filter = {};

    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (agentId) filter.agentId = agentId;
    if (ruleId) filter.ruleId = ruleId;
    if (sourceIp) filter.sourceIp = sourceIp;
    if (mitreTechnique) filter['mitre.technique'] = mitreTechnique;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { ruleDescription: { $regex: search, $options: 'i' } },
        { agentName: { $regex: search, $options: 'i' } },
        { sourceIp: { $regex: search, $options: 'i' } },
        { fullLog: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('aiAnalysis')
        .populate('acknowledgedBy', 'firstName lastName email'),
      Alert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAlertById = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('aiAnalysis')
      .populate('threatIntel')
      .populate('incidentId')
      .populate('acknowledgedBy', 'firstName lastName email');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    // If threat intel not loaded, enrich on demand for IP
    let enrichedThreatIntel = alert.threatIntel;
    if ((!enrichedThreatIntel || enrichedThreatIntel.length === 0) && alert.sourceIp && !threatIntelService.isPrivateIp(alert.sourceIp)) {
      try {
        const intel = await threatIntelService.enrichIp(alert.sourceIp);
        if (intel && intel.sources) {
          enrichedThreatIntel = Object.values(intel.sources).filter(Boolean);
        }
      } catch (err) {
        // Non-blocking
      }
    }

    res.json({
      success: true,
      data: {
        alert,
        threatIntel: enrichedThreatIntel,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAlert = async (req, res, next) => {
  try {
    const { status } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const oldStatus = alert.status;
    if (status) alert.status = status;

    if (status === 'ACKNOWLEDGED' || status === 'INVESTIGATING') {
      alert.acknowledgedBy = req.user._id;
      alert.acknowledgedAt = new Date();
    }

    await alert.save();

    await logAction({
      req,
      user: req.user,
      action: 'ALERT_STATUS_UPDATE',
      category: 'alert',
      description: `Alert ${alert._id} status changed from ${oldStatus} to ${status}`,
      metadata: { alertId: alert._id, oldStatus, newStatus: status },
    });

    res.json({
      success: true,
      message: 'Alert updated successfully',
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

exports.reAnalyzeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    let threatIntel = null;
    if (alert.sourceIp && !threatIntelService.isPrivateIp(alert.sourceIp)) {
      threatIntel = await threatIntelService.enrichIp(alert.sourceIp);
    }

    const aiResult = await aiServiceClient.analyzeAlert(alert, threatIntel, 1);

    const aiDoc = await AIAnalysis.findOneAndUpdate(
      { alertId: alert._id },
      {
        alertId: alert._id,
        riskScore: aiResult.riskScore,
        severity: aiResult.severity,
        threatType: aiResult.threatType,
        confidence: aiResult.confidence,
        isAnomaly: aiResult.isAnomaly,
        mitreTechniques: aiResult.mitreTechniques,
        explanation: aiResult.explanation,
        recommendedActions: aiResult.recommendedActions,
        riskFactors: aiResult.riskFactors,
        analysisSource: aiResult.analysisSource,
      },
      { upsert: true, new: true }
    );

    alert.riskScore = aiResult.riskScore;
    alert.severity = aiResult.severity;
    alert.aiAnalysis = aiDoc._id;
    await alert.save();

    await logAction({
      req,
      user: req.user,
      action: 'ALERT_AI_REANALYZED',
      category: 'ai',
      description: `Re-ran AI threat analysis on alert ${alert._id}`,
    });

    res.json({
      success: true,
      data: {
        alert,
        aiAnalysis: aiDoc,
      },
    });
  } catch (error) {
    next(error);
  }
};
