const { Alert, Incident } = require('../../models');
const notificationService = require('../notifications/notificationService');
const logger = require('../../utils/logger');

class AlertCorrelationService {
  /**
   * Correlate incoming normalized alert against historical patterns.
   * Auto-creates an Incident if high-risk thresholds or attack chain patterns match.
   */
  async correlateAndCreateIncident(alert, aiAnalysis = null, threatIntel = null) {
    try {
      let shouldCreateIncident = false;
      let incidentTitle = '';
      let incidentSeverity = alert.severity || 'medium';
      const relatedAlerts = [alert._id];
      const reasons = [];

      // 1. Single Critical Alert with Risk Score >= 75
      if (alert.severity === 'critical' || (alert.riskScore && alert.riskScore >= 75)) {
        shouldCreateIncident = true;
        incidentSeverity = 'critical';
        incidentTitle = `Critical Security Event: ${alert.ruleDescription || 'High Impact Anomaly'}`;
        reasons.push(`Single high-impact alert triggered with risk score ${alert.riskScore || 'Critical'}`);
      }

      // 2. Correlation: Multiple Failed Logins from same Source IP in last 15 minutes
      if (alert.sourceIp && alert.sourceIp !== '127.0.0.1') {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentSameIpAlerts = await Alert.find({
          sourceIp: alert.sourceIp,
          timestamp: { $gte: fifteenMinutesAgo },
          _id: { $ne: alert._id },
        }).limit(10);

        if (recentSameIpAlerts.length >= 3) {
          shouldCreateIncident = true;
          if (incidentSeverity !== 'critical') incidentSeverity = 'high';
          incidentTitle = `Suspicious Cluster: Multiple attacks from source IP ${alert.sourceIp}`;
          recentSameIpAlerts.forEach((a) => relatedAlerts.push(a._id));
          reasons.push(`${recentSameIpAlerts.length + 1} correlated events detected from IP ${alert.sourceIp} within 15 minutes`);
        }
      }

      // 3. Correlation: Multiple Alerts across different agents targeting same technique
      if (alert.mitre?.technique && alert.mitre.technique.length > 0) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const mitreMatches = await Alert.find({
          'mitre.technique': { $in: alert.mitre.technique },
          timestamp: { $gte: oneHourAgo },
          _id: { $ne: alert._id },
        }).limit(5);

        if (mitreMatches.length >= 2) {
          shouldCreateIncident = true;
          if (incidentSeverity === 'low') incidentSeverity = 'medium';
          if (!incidentTitle) incidentTitle = `MITRE Pattern: Repeated technique ${alert.mitre.technique[0]}`;
          mitreMatches.forEach((m) => {
            if (!relatedAlerts.includes(m._id)) relatedAlerts.push(m._id);
          });
          reasons.push(`Pattern match: MITRE Technique ${alert.mitre.technique.join(', ')} observed across environment`);
        }
      }

      // If correlation conditions triggered, check if there's an existing open incident for this IP or Agent
      if (shouldCreateIncident) {
        // Check for existing open incident for this agent or source IP in the last 2 hours
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const existingIncident = await Incident.findOne({
          status: { $in: ['OPEN', 'INVESTIGATING'] },
          createdAt: { $gte: twoHoursAgo },
          $or: [
            { 'affectedAgents.agentId': alert.agentId },
            { sourceIps: alert.sourceIp },
          ],
        });

        if (existingIncident) {
          // Link this alert to existing incident and append timeline
          if (!existingIncident.relatedAlerts.includes(alert._id)) {
            existingIncident.relatedAlerts.push(alert._id);
          }
          existingIncident.timeline.push({
            action: 'Alert Correlated',
            description: `Correlated additional alert: "${alert.ruleDescription}" (Severity: ${alert.severity})`,
            automated: true,
          });
          await existingIncident.save();

          // Link alert back to incident
          alert.incidentId = existingIncident._id;
          await alert.save();
          return existingIncident;
        }

        // Create new Incident
        const newIncident = new Incident({
          title: incidentTitle || `Security Incident: ${alert.ruleDescription}`,
          description: reasons.join('\n') || alert.ruleDescription,
          severity: incidentSeverity,
          status: 'OPEN',
          relatedAlerts,
          affectedAgents: [
            {
              agentId: alert.agentId,
              agentName: alert.agentName,
              agentIp: alert.agentIp,
            },
          ],
          sourceIps: alert.sourceIp ? [alert.sourceIp] : [],
          destinationIps: alert.destinationIp ? [alert.destinationIp] : [],
          mitreTechniques: (alert.mitre?.technique || []).map((t, idx) => ({
            name: t,
            id: alert.mitre?.id?.[idx] || 'T0000',
            tactic: alert.mitre?.tactic?.[idx] || 'Unknown',
          })),
          threatIntelResults: threatIntel ? [threatIntel._id] : [],
          aiAnalysis: aiAnalysis || {},
          riskScore: alert.riskScore || 50,
          timeline: [
            {
              action: 'Incident Created',
              description: `Automated incident triggered by rule "${alert.ruleDescription}" on agent "${alert.agentName || alert.agentId}"`,
              automated: true,
            },
          ],
        });

        await newIncident.save();

        // Update alert's incidentId
        alert.incidentId = newIncident._id;
        await alert.save();

        // Notify analysts
        await notificationService.notifyIncident(newIncident);
        logger.info(`Auto-created Incident ${newIncident.incidentId} (${newIncident.severity})`);
        return newIncident;
      }

      return null;
    } catch (error) {
      logger.error(`Alert correlation error: ${error.message}`);
      return null;
    }
  }
}

module.exports = new AlertCorrelationService();
