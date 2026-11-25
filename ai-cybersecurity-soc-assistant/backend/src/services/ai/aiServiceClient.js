const axios = require('axios');
const config = require('../../config');
const riskScorer = require('./riskScorer');
const logger = require('../../utils/logger');

class AiServiceClient {
  constructor() {
    this.serviceUrl = config.aiService.url;
    this.openaiKey = config.openai.apiKey;
  }

  /**
   * Send alert to Python FastAPI AI service for ML Isolation Forest anomaly detection & enrichment.
   * If the Python AI service is unreachable, gracefully fall back to local rule-based engine.
   */
  async analyzeAlert(alertData, threatIntel = null, recentAlertCount = 1) {
    const localRisk = riskScorer.calculateScore(alertData, threatIntel, recentAlertCount);

    try {
      const response = await axios.post(
        `${this.serviceUrl}/api/analyze`,
        {
          alert_id: alertData.wazuhAlertId || alertData._id?.toString(),
          rule_id: alertData.ruleId,
          rule_level: alertData.ruleLevel || 0,
          rule_description: alertData.ruleDescription || '',
          rule_groups: alertData.ruleGroups || [],
          agent_id: alertData.agentId || '',
          agent_name: alertData.agentName || '',
          source_ip: alertData.sourceIp || '',
          destination_ip: alertData.destinationIp || '',
          mitre_techniques: alertData.mitre?.technique || [],
          full_log: alertData.fullLog || '',
          threat_intel: threatIntel,
          recent_count: recentAlertCount,
        },
        { timeout: 8000 }
      );

      const aiData = response.data;
      return {
        riskScore: aiData.risk_score !== undefined ? aiData.risk_score : localRisk.score,
        severity: aiData.severity || localRisk.severity,
        threatType: aiData.threat_type || this.detectThreatType(alertData),
        confidence: aiData.confidence || 0.85,
        isAnomaly: !!aiData.anomaly,
        mitreTechniques: (aiData.mitre_techniques || []).map((t) => (typeof t === 'string' ? { name: t } : t)),
        explanation: aiData.explanation || this.generateFallbackExplanation(alertData, localRisk),
        recommendedActions: aiData.recommended_actions || this.generateFallbackRecommendations(alertData, localRisk),
        riskFactors: localRisk.factors,
        analysisSource: aiData.source || 'hybrid',
      };
    } catch (error) {
      logger.warn(`AI microservice unreachable (${error.message}). Using local deterministic AI engine.`);
      
      // Local deterministic fallback
      const threatType = this.detectThreatType(alertData);
      const explanation = this.generateFallbackExplanation(alertData, localRisk);
      const recommendedActions = this.generateFallbackRecommendations(alertData, localRisk);

      return {
        riskScore: localRisk.score,
        severity: localRisk.severity,
        threatType,
        confidence: 0.75,
        isAnomaly: localRisk.score >= 60,
        mitreTechniques: (alertData.mitre?.technique || []).map((t) => ({ name: t })),
        explanation,
        recommendedActions,
        riskFactors: localRisk.factors,
        analysisSource: 'rule_based',
      };
    }
  }

  detectThreatType(alert) {
    const desc = (alert.ruleDescription || '').toLowerCase();
    const groups = (alert.ruleGroups || []).map((g) => g.toLowerCase());

    if (desc.includes('ssh') || desc.includes('failed password') || groups.includes('authentication_failed')) {
      return 'Brute Force / Credential Stuffing';
    }
    if (desc.includes('port scan') || desc.includes('nmap') || desc.includes('reconnaissance')) {
      return 'Network Reconnaissance';
    }
    if (desc.includes('file modified') || desc.includes('integrity') || groups.includes('syscheck')) {
      return 'Unauthorized File Integrity Modification (FIM)';
    }
    if (desc.includes('privilege') || desc.includes('sudo') || desc.includes('uac')) {
      return 'Privilege Escalation';
    }
    if (desc.includes('malware') || desc.includes('trojan') || desc.includes('rootkit') || desc.includes('ransomware')) {
      return 'Malware / Ransomware Execution';
    }
    if (desc.includes('sql') || desc.includes('injection') || desc.includes('xss')) {
      return 'Web Application Attack';
    }
    if (desc.includes('powershell') || desc.includes('cmd.exe') || desc.includes('bash')) {
      return 'Suspicious Shell / Process Execution';
    }
    return 'Suspicious System Activity';
  }

  generateFallbackExplanation(alert, localRisk) {
    const desc = alert.ruleDescription || 'Security event detected by Wazuh';
    const agent = alert.agentName || alert.agentId || 'endpoint';
    const ip = alert.sourceIp ? ` from source IP ${alert.sourceIp}` : '';
    const sev = localRisk.severity.toUpperCase();

    return `The SOC Assistant evaluated this alert as ${sev} risk (Score: ${localRisk.score}/100). The event "${desc}" occurred on host "${agent}"${ip}. Key contributors include Wazuh rule severity (Level ${alert.ruleLevel || 0}) and pattern matching against security event baselines. Immediate analyst review is advised if severity is High or Critical.`;
  }

  generateFallbackRecommendations(alert, localRisk) {
    const actions = [];
    if (alert.sourceIp && alert.sourceIp !== '127.0.0.1') {
      actions.push(`Review network logs and consider blocking source IP ${alert.sourceIp} at the perimeter firewall.`);
    }
    if (localRisk.score >= 60) {
      actions.push(`Isolate agent "${alert.agentName || alert.agentId}" from the production network to prevent lateral movement.`);
      actions.push('Collect volatile memory and triage triage triage package for forensic investigation.');
    }
    actions.push('Verify whether this action was authorized by system administrators during scheduled maintenance.');
    actions.push('Review related Wazuh syscollector and FIM logs for the preceding 60 minutes.');
    return actions;
  }
}

module.exports = new AiServiceClient();
