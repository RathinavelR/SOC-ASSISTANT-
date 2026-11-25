const { Alert, Incident, AgentSnapshot } = require('../models');

exports.getSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      activeIncidents,
      onlineAgents,
      offlineAgents,
      eventsToday,
      threatsDetected,
    ] = await Promise.all([
      Alert.countDocuments(),
      Alert.countDocuments({ severity: 'critical' }),
      Alert.countDocuments({ severity: 'high' }),
      Alert.countDocuments({ severity: 'medium' }),
      Alert.countDocuments({ severity: 'low' }),
      Incident.countDocuments({ status: { $in: ['OPEN', 'INVESTIGATING'] } }),
      AgentSnapshot.countDocuments({ status: 'active' }),
      AgentSnapshot.countDocuments({ status: { $ne: 'active' } }),
      Alert.countDocuments({ timestamp: { $gte: today } }),
      Alert.countDocuments({ riskScore: { $gte: 60 } }),
    ]);

    res.json({
      success: true,
      data: {
        totalAlerts,
        criticalAlerts,
        highAlerts,
        mediumAlerts,
        lowAlerts,
        activeIncidents,
        onlineAgents,
        offlineAgents,
        eventsToday,
        threatsDetected,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrends = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await Alert.aggregate([
      { $match: { timestamp: { $gte: sinceDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            severity: '$severity',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Pivot data by date for clean chart consumption
    const pivoted = {};
    trends.forEach((item) => {
      const date = item._id.date;
      const severity = item._id.severity || 'low';
      if (!pivoted[date]) {
        pivoted[date] = { date, critical: 0, high: 0, medium: 0, low: 0, total: 0 };
      }
      pivoted[date][severity] = item.count;
      pivoted[date].total += item.count;
    });

    res.json({
      success: true,
      data: Object.values(pivoted),
    });
  } catch (error) {
    next(error);
  }
};

exports.getSeverityDistribution = async (req, res, next) => {
  try {
    const counts = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = { critical: 0, high: 0, medium: 0, low: 0 };
    counts.forEach((c) => {
      if (c._id && result[c._id] !== undefined) {
        result[c._id] = c.count;
      }
    });

    res.json({
      success: true,
      data: [
        { name: 'Critical', value: result.critical, color: '#ef4444' },
        { name: 'High', value: result.high, color: '#f97316' },
        { name: 'Medium', value: result.medium, color: '#eab308' },
        { name: 'Low', value: result.low, color: '#06b6d4' },
      ],
    });
  } catch (error) {
    next(error);
  }
};

exports.getTopThreats = async (req, res, next) => {
  try {
    const [topRules, topAgents, topSourceIps, mitreTechniques, incidentStatus] = await Promise.all([
      // Top Alert Rules
      Alert.aggregate([
        { $group: { _id: { ruleId: '$ruleId', desc: '$ruleDescription' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { ruleId: '$_id.ruleId', description: '$_id.desc', count: 1, _id: 0 } },
      ]),

      // Top Affected Agents
      Alert.aggregate([
        { $group: { _id: { id: '$agentId', name: '$agentName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { agentId: '$_id.id', agentName: '$_id.name', count: 1, _id: 0 } },
      ]),

      // Top Source IPs
      Alert.aggregate([
        { $match: { sourceIp: { $exists: true, $ne: '' } } },
        { $group: { _id: '$sourceIp', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: { sourceIp: '$_id', count: 1, _id: 0 } },
      ]),

      // Top MITRE Techniques
      Alert.aggregate([
        { $unwind: '$mitre.technique' },
        { $group: { _id: '$mitre.technique', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        { $project: { technique: '$_id', count: 1, _id: 0 } },
      ]),

      // Incident Status Breakdown
      Incident.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $project: { status: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        topRules,
        topAgents,
        topSourceIps,
        mitreTechniques,
        incidentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};
