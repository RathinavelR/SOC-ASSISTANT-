# AI Powered Cybersecurity SOC Assistant - Architecture Documentation

## 1. System Overview

The **AI Powered Cybersecurity SOC Assistant** is an enterprise-grade Security Operations Center platform designed to ingest, normalize, enrich, triage, and correlate security alerts originating from a distributed Wazuh SIEM/XDR deployment.

```
+-----------------------------------------------------------------------------------+
|                                  SECURITY SOURCES                                 |
|                                                                                   |
|   +--------------------------+          +-------------------------------------+   |
|   |  Wazuh REST API (55000)  |          | Wazuh Integrator Webhook (Push)     |   |
|   |  - Agent Inventory       |          | - Real-time Alert Forwarder         |   |
|   |  - Syscollector & SCA    |          | - Level >= 5 Events                 |   |
|   +------------+-------------+          +------------------+------------------+   |
+----------------|-------------------------------------------|----------------------+
                 | Polling & Sync                            | Webhook Ingest
                 v                                           v
+-----------------------------------------------------------------------------------+
|                         NODE.JS + EXPRESS BACKEND CORE                            |
|                                                                                   |
|  +------------------+     +-------------------+     +--------------------------+  |
|  | Wazuh API Client |     | Alert Normalizer  |     | Correlation Engine       |  |
|  | JWT Token Cache  |     | Schema Standard   |     | Pattern & Attack Chains  |  |
|  +------------------+     +---------+---------+     +------------+-------------+  |
|                                     |                            |                |
|  +---------------------+            |                            |                |
|  | Socket.IO Server    |<-----------+----------------------------+                |
|  | Real-Time Broadcast |                                                          |
|  +----------+----------+                                                          |
+-------------|---------------------------------------------------------------------+
              |                                     |                         |
              | Broadcast                           | Enrichment              | Analysis
              v                                     v                         v
+-----------------------------+     +-------------------------------+   +-----------------------------+
|     REACT VITE FRONTEND     |     |   THREAT INTEL REPUTATION     |   |   PYTHON FASTAPI AI SERVICE |
|                             |     |                               |   |                             |
| - Dark SOC Cyber Theme      |     | - VirusTotal (IP & Hashes)    |   | - Scikit-Learn Isolation    |
| - Real-time Incident Board  |     | - AbuseIPDB (Confidence)      |   |   Forest Anomaly Detector   |
| - MITRE ATT&CK Matrix       |     | - Shodan Host Scanning        |   | - 0-100 Transparent Scorer  |
| - Live Analytics Charts     |     | - 24-Hour MongoDB TTL Cache   |   | - LLM Advisory (Optional)   |
+-----------------------------+     +---------------+---------------+   +--------------+--------------+
                                                    |                                  |
                                                    +----------------+-----------------+
                                                                     |
                                                                     v
                                                    +---------------------------------+
                                                    |        MONGODB REPOSITORY       |
                                                    |                                 |
                                                    | - Users & Audit Logs            |
                                                    | - Normalized Security Alerts    |
                                                    | - Incidents & Timelines         |
                                                    | - Agent Snapshots & Intel Cache |
                                                    +---------------------------------+
```

---

## 2. Ingestion & Triage Pipeline

1. **Alert Reception**:
   - Webhook pushes via `/api/integrations/wazuh/alert` authenticated with `X-Wazuh-Integration-Secret` or polled via `/manager/logs`.
2. **Normalization**:
   - Wazuh JSON payloads mapped to a standardized schema preserving original telemetry in `rawAlert`.
3. **Threat Intel Enrichment**:
   - Public source IPs queried against VirusTotal and AbuseIPDB. Cached for 24 hours in MongoDB.
4. **Machine Learning Anomaly Detection**:
   - Python FastAPI microservice extracts 7 feature dimensions and passes them through an Isolation Forest model.
5. **Transparent Risk Scoring (0–100)**:
   - Evaluates Wazuh rule level, frequency spike, threat intel reputation, and MITRE criticality.
6. **Alert Correlation & Incident Creation**:
   - Multi-event rules aggregate repeated password failures, multi-agent attacks, and high-risk anomalies into tracked Incident cases.
7. **Real-Time WebSocket Emission**:
   - Socket.IO broadcasts `new_alert` and `new_notification` events to analyst dashboards.
