# REST API Documentation

The AI Powered Cybersecurity SOC Assistant exposes RESTful endpoints secured via JWT tokens.

Interactive OpenAPI/Swagger documentation is served at `/api/docs`.

---

## Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new analyst account | No |
| `POST` | `/api/auth/login` | Authenticate user & get JWT | No |
| `GET` | `/api/auth/me` | Return current logged user profile | Yes (Bearer) |
| `POST` | `/api/auth/forgot-password` | Request password reset | No |

---

## Dashboard Analytics

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/dashboard/summary` | Aggregate alert and agent KPI counts | Yes |
| `GET` | `/api/dashboard/trends?days=7` | Volume trends bucketed by day | Yes |
| `GET` | `/api/dashboard/severity` | Severity distribution counts | Yes |
| `GET` | `/api/dashboard/top-threats` | Top rules, top agents, top IPs | Yes |

---

## Wazuh Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/wazuh/status` | Test Wazuh manager connectivity | Yes |
| `GET` | `/api/wazuh/agents` | List registered Wazuh agents | Yes |
| `GET` | `/api/wazuh/agents/:id` | Get agent info & recent events | Yes |
| `GET` | `/api/wazuh/agents/:id/syscollector` | Inspect hardware/package telemetry | Yes |
| `GET` | `/api/wazuh/rules` | Query Wazuh rules & groups | Yes |
| `GET` | `/api/wazuh/mitre` | Query MITRE ATT&CK mappings | Yes |

---

## Security Alerts

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/alerts` | Paginated alerts with search & filter | Yes |
| `GET` | `/api/alerts/:id` | Full alert detail with AI & Threat Intel | Yes |
| `PATCH` | `/api/alerts/:id` | Update alert status (ACKNOWLEDGED, etc.) | Yes (Analyst/Admin) |
| `POST` | `/api/alerts/:id/analyze` | Trigger on-demand AI threat re-analysis | Yes (Analyst/Admin) |

---

## Incidents

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/incidents` | List incidents with status filters | Yes |
| `POST` | `/api/incidents` | Manually create new incident | Yes (Analyst/Admin) |
| `GET` | `/api/incidents/:id` | Incident detail with timeline & notes | Yes |
| `PATCH` | `/api/incidents/:id` | Update status, assigned analyst | Yes (Analyst/Admin) |
| `POST` | `/api/incidents/:id/comments` | Add analyst investigation note | Yes (Analyst/Admin) |

---

## Threat Intelligence & AI

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/threat-intel/ip/:ip` | VirusTotal / AbuseIPDB IP enrichment | Yes |
| `GET` | `/api/threat-intel/hash/:hash` | VirusTotal file hash reputation | Yes |
| `POST` | `/api/ai/analyze` | Ad-hoc log AI triage & anomaly check | Yes |
| `GET` | `/api/ai/insights` | ML anomaly statistics | Yes |

---

## Integrations (Webhook)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/integrations/wazuh/alert` | Ingest real-time Wazuh alert file | `X-Wazuh-Integration-Secret` |
