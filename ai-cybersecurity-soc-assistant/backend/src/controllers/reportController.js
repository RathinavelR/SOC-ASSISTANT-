const { Report, Alert, Incident, AgentSnapshot } = require('../models');
const { logAction } = require('../utils/auditLogger');

exports.getReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate('generatedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

exports.getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('generatedBy', 'firstName lastName email');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateReport = async (req, res, next) => {
  try {
    const { title, type = 'daily', days = 7 } = req.body;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    const [
      totalAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      topThreats,
      topAgents,
      topSourceIps,
      incidents,
      mitreTechniques,
      agentSnapshots,
    ] = await Promise.all([
      Alert.countDocuments({ timestamp: { $gte: startDate } }),
      Alert.countDocuments({ severity: 'critical', timestamp: { $gte: startDate } }),
      Alert.countDocuments({ severity: 'high', timestamp: { $gte: startDate } }),
      Alert.countDocuments({ severity: 'medium', timestamp: { $gte: startDate } }),
      Alert.countDocuments({ severity: 'low', timestamp: { $gte: startDate } }),
      Alert.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$ruleDescription', count: { $sum: 1 }, level: { $first: '$ruleLevel' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Alert.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $group: { _id: '$agentName', count: { $sum: 1 }, ip: { $first: '$agentIp' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Alert.aggregate([
        { $match: { timestamp: { $gte: startDate }, sourceIp: { $exists: true, $ne: '' } } },
        { $group: { _id: '$sourceIp', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Incident.find({ createdAt: { $gte: startDate } }).select('incidentId title severity status createdAt'),
      Alert.aggregate([
        { $match: { timestamp: { $gte: startDate } } },
        { $unwind: '$mitre.technique' },
        { $group: { _id: '$mitre.technique', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      AgentSnapshot.find().select('agentId name ip status lastKeepAlive os'),
    ]);

    const report = new Report({
      title: title || `${type.toUpperCase()} Security Operations Report (${endDate.toISOString().split('T')[0]})`,
      type,
      generatedBy: req.user._id,
      dateRange: { start: startDate, end: endDate },
      status: 'completed',
      data: {
        summary: {
          periodDays: days,
          totalAlerts,
          incidentCount: incidents.length,
          activeAgentsCount: agentSnapshots.filter((a) => a.status === 'active').length,
          totalAgentsCount: agentSnapshots.length,
        },
        alertStats: {
          total: totalAlerts,
          critical: criticalAlerts,
          high: highAlerts,
          medium: mediumAlerts,
          low: lowAlerts,
        },
        severityDistribution: {
          critical: criticalAlerts,
          high: highAlerts,
          medium: mediumAlerts,
          low: lowAlerts,
        },
        topThreats: topThreats.map((t) => ({ description: t._id, count: t.count, level: t.level })),
        topAgents: topAgents.map((a) => ({ name: a._id, count: a.count, ip: a.ip })),
        topSourceIps: topSourceIps.map((s) => ({ ip: s._id, count: s.count })),
        incidents,
        mitreTechniques: mitreTechniques.map((m) => ({ technique: m._id, count: m.count })),
        agentHealth: agentSnapshots,
        aiInsights: [
          `Detected ${criticalAlerts + highAlerts} high/critical priority events in this period.`,
          topSourceIps.length > 0 ? `Primary external source IP: ${topSourceIps[0]._id}` : 'No anomalous external IPs.',
          `Agent compliance posture is at ${(agentSnapshots.length > 0 ? Math.round((agentSnapshots.filter((a) => a.status === 'active').length / agentSnapshots.length) * 100) : 100)}% online status.`,
        ],
      },
    });

    await report.save();

    await logAction({
      req,
      user: req.user,
      action: 'REPORT_GENERATED',
      category: 'report',
      description: `Generated ${type} report: ${report.title}`,
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
