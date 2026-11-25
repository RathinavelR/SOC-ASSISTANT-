# AI Powered Cybersecurity SOC Assistant 🛡️

An enterprise-grade, full-stack Security Operations Center assistant that integrates with Wazuh SIEM/XDR, provides machine-learning anomaly triage, enriches threats via VirusTotal and AbuseIPDB, automates incident correlation, and delivers real-time notifications to security analysts.

---

## 🚀 Key Features

- **Enterprise Dark SOC Interface**: Built with React, Vite, and Tailwind CSS. Features glassmorphism cards, glowing status badges, and Recharts telemetry graphs.
- **Resilient Wazuh Integration**: Dedicated API client with JWT token caching, auto-refresh, and MongoDB snapshot fallback when Wazuh is unreachable.
- **Machine Learning Anomaly Detection**: Python FastAPI microservice utilizing a Scikit-learn **Isolation Forest** model to detect statistical outliers in telemetry.
- **Optional Advisory LLM**: Structured reasoning and containment advisory via OpenAI-compatible endpoints with deterministic local heuristic fallbacks.
- **Transparent Risk Scoring (0–100)**: Multi-factor scoring analyzing Wazuh rule levels, recent event volume, Threat Intel reputation, MITRE tactics, and attack patterns.
- **Automated Incident Correlation**: Detects multi-event attack chains (e.g. repeated brute force, privilege escalation) and creates tracked Incidents with visual timelines.
- **Threat Intelligence Enrichment**: VirusTotal & AbuseIPDB lookups with a 24-hour MongoDB TTL cache.
- **Real-Time WebSockets**: Socket.IO alerts and notifications delivered instantaneously without page reloads.
- **Enterprise RBAC & Auditing**: Role-based access (`ADMIN`, `SOC_ANALYST`, `VIEWER`), bcrypt password encryption, and comprehensive audit trail.
- **Dockerized Architecture**: Complete multi-container `docker-compose.yml` for MongoDB, AI service, Backend, and Frontend.

---

## 📁 Repository Structure

```
ai-cybersecurity-soc-assistant/
├── frontend/                     # React Vite + Tailwind SOC Interface
│   ├── src/
│   │   ├── components/           # Badges, StatCards, Navbar, Sidebar, JsonViewer
│   │   ├── context/              # Auth, Socket, and Theme Contexts
│   │   ├── pages/                # Dashboard, Alerts, Incidents, Agents, ThreatIntel, etc.
│   │   ├── routes/               # Role-Protected AppRoutes
│   │   └── services/             # Axios API Services
│   ├── package.json
│   └── Dockerfile
├── backend/                      # Node.js + Express REST & Socket.IO Core
│   ├── src/
│   │   ├── config/               # DB & Env Configurations
│   │   ├── controllers/          # Business Logic Controllers
│   │   ├── middleware/           # JWT Auth, Role Authorize, Joi Validate, ErrorHandler
│   │   ├── models/               # MongoDB Mongoose Schemas (Alert, Incident, User, etc.)
│   │   ├── routes/               # Express Route Handlers
│   │   ├── services/             # Wazuh Client, ThreatIntel, AI Client, Notifications
│   │   ├── sockets/              # Socket.IO Real-Time Server
│   │   └── utils/                # Audit Logger, Winston Logger, DB Seed Script
│   ├── package.json
│   └── Dockerfile
├── ai-service/                   # Python FastAPI ML Threat Analysis Service
│   ├── app/
│   │   ├── api/                  # FastAPI Endpoints (/analyze, /summarize)
│   │   ├── models/               # Scikit-Learn Isolation Forest Anomaly Detector
│   │   ├── schemas/              # Pydantic Schemas
│   │   └── services/             # Analysis Coordinator & Heuristic Advisories
│   ├── requirements.txt
│   └── Dockerfile
├── wazuh/                        # Custom Wazuh Integrator Script & Configs
│   ├── integrations/custom-soc-assistant.py
│   └── sample-config/ossec.conf
├── docs/                         # Documentation (Architecture, Wazuh Setup, API, Deployment)
├── docker-compose.yml            # Multi-container orchestration
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Node.js v18+ & npm
- Python 3.10+ (for AI microservice)
- MongoDB instance (Local or Atlas)
- Docker & Docker Compose (Optional)

---

### Option A: Running with Docker Compose (Fastest)

1. Clone and navigate to the project directory:
   ```bash
   cd ai-cybersecurity-soc-assistant
   ```

2. Start all services in the background:
   ```bash
   docker-compose up -d --build
   ```

3. Seed initial demo users and realistic alert telemetry:
   ```bash
   docker-compose exec backend npm run seed
   ```

4. Open your browser:
   - **Frontend SOC Dashboard**: [http://localhost](http://localhost) (or port 5173 in local dev)
   - **Backend API & Swagger Docs**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)
   - **AI Microservice**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Running Locally Step-by-Step

#### 1. Setup Backend:
```bash
cd backend
cp .env.example .env
npm install
npm run seed     # Seeds demo admin, analyst accounts, and baseline telemetry
npm run dev      # Runs on port 5000
```

#### 2. Setup AI Microservice:
```bash
cd ../ai-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/Mac:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Setup Frontend:
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev      # Runs on http://localhost:5173
```

---

## 🔐 Default Login Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@soc.local` | `Admin@Password123!` | Full Access, Settings, User Management |
| **SOC Analyst** | `analyst@soc.local` | `Analyst@Password123!` | Alerts Triage, Incidents, AI Workbench, Reports |
| **Viewer** | `viewer@soc.local` | `Viewer@Password123!` | Read-only Overview & Metrics |

---

## 🛡️ Wazuh Real Integration

To forward real alerts from your Wazuh Manager:
1. Copy `wazuh/integrations/custom-soc-assistant.py` to `/var/ossec/integrations/` on your Wazuh Manager.
2. Add the `<integration>` block to `/var/ossec/etc/ossec.conf` pointing to `http://<YOUR_IP>:5000/api/integrations/wazuh/alert`.
3. Restart `wazuh-manager`.
4. Detailed guide available in [`docs/wazuh-setup.md`](file:///e:/Desktop/New%20folder/ai-cybersecurity-soc-assistant/docs/wazuh-setup.md).

---

## 🧪 Testing

```bash
# Run backend test suite
cd backend
npm test

# Run AI service tests
cd ../ai-service
pytest
```
