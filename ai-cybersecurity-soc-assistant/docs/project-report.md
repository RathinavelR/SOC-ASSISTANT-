# Security Operations Center (SOC) Assistant - Project Report

## 1. Executive Summary

Modern enterprise Security Operations Centers are inundated with thousands of security events daily. Analysts struggle with alert fatigue, false positives, and fragmented context across SIEMs, threat intelligence APIs, and endpoint telemetry.

The **AI Powered Cybersecurity SOC Assistant** resolves these operational bottlenecks through:
- Direct, resilient integration with Wazuh Manager SIEM/XDR.
- Machine learning anomaly triage using Scikit-Learn Isolation Forest.
- Transparent 0–100 risk scoring with factor attribution.
- Automated multi-event incident correlation and timeline generation.
- Real-time event streaming via WebSockets.

---

## 2. Key Accomplishments & Features

| Capability | Implementation | Value Delivered |
|---|---|---|
| **Wazuh Resilient Integration** | JWT token caching & auto-refresh with snapshot MongoDB fallback | Eliminates SOC downtime if the SIEM server is temporarily unreachable |
| **Real-time Alert Ingestion** | Custom Python integration forwarder + Socket.IO broadcast | Zero-latency alerts without requiring dashboard refreshes |
| **Machine Learning Triage** | Scikit-learn Isolation Forest on 7 telemetry features | Flags statistical anomalies and deviations from nominal behavior |
| **Transparent Risk Scoring** | Multi-factor engine (Rule level, Volume, Threat Intel, MITRE, Auth) | Gives analysts instant visibility into why an alert is prioritized |
| **Incident Correlation** | Automated pattern matching (IP brute force clusters, attack chains) | Groups related alerts into unified case files with chronological timelines |
| **Threat Intelligence** | VirusTotal & AbuseIPDB lookups with 24-hour MongoDB TTL cache | Prevents API rate limit exhaustion and enriches external source IPs |
| **Enterprise RBAC & Auditing** | Roles (`ADMIN`, `SOC_ANALYST`, `VIEWER`) and comprehensive audit logs | Ensures compliance, accountability, and principle of least privilege |
