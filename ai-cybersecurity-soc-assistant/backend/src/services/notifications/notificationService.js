const { Notification } = require('../../models');
const logger = require('../../utils/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIo(ioInstance) {
    this.io = ioInstance;
  }

  /**
   * Create an in-app notification and broadcast via Socket.IO
   */
  async notify({ type, title, message, severity = 'info', referenceType = null, referenceId = null, metadata = {}, userId = null }) {
    try {
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        severity,
        referenceType,
        referenceId,
        metadata,
        read: false,
      });

      // Broadcast via WebSocket
      if (this.io) {
        this.io.emit('new_notification', notification);
      }

      return notification;
    } catch (error) {
      logger.error(`NotificationService error: ${error.message}`);
      return null;
    }
  }

  /**
   * Send notification on critical or high alert
   */
  async notifyAlert(alert) {
    if (alert.severity === 'critical' || alert.severity === 'high') {
      return this.notify({
        type: 'alert',
        title: `${alert.severity.toUpperCase()} Alert: ${alert.ruleDescription || 'Security Event'}`,
        message: `Agent: ${alert.agentName || alert.agentId || 'Unknown'} | Rule Level: ${alert.ruleLevel} | Risk Score: ${alert.riskScore}`,
        severity: alert.severity,
        referenceType: 'alert',
        referenceId: alert._id,
        metadata: {
          sourceIp: alert.sourceIp,
          ruleId: alert.ruleId,
          riskScore: alert.riskScore,
        },
      });
    }
  }

  /**
   * Send notification on new incident
   */
  async notifyIncident(incident) {
    return this.notify({
      type: 'incident',
      title: `🚨 New Incident: ${incident.incidentId} (${incident.severity.toUpperCase()})`,
      message: incident.title,
      severity: incident.severity,
      referenceType: 'incident',
      referenceId: incident._id,
      metadata: {
        incidentId: incident.incidentId,
        severity: incident.severity,
      },
    });
  }
}

module.exports = new NotificationService();
