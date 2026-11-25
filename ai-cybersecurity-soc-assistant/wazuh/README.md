# Wazuh Integration for AI Powered SOC Assistant

This directory contains integration scripts and configurations to stream security events from a Wazuh Manager directly into the AI Powered Cybersecurity SOC Assistant.

## Overview

The SOC Assistant integrates with Wazuh via two complementary channels:

1. **Wazuh REST API (Port 55000)**:
   - Queries manager status, agent inventory, syscollector hardware/package stats, FIM changes, and MITRE ATT&CK techniques.
   - Requires Wazuh API credentials (username/password) configured in the backend `.env`.

2. **Wazuh Integrator Daemon (Webhook)**:
   - Wazuh automatically runs `custom-soc-assistant.py` whenever an alert matching the configured minimum level (e.g., Level >= 5) occurs.
   - Pushes real-time JSON alert files directly to `POST /api/integrations/wazuh/alert` secured with `X-Wazuh-Integration-Secret`.

---

## Setup Instructions on Wazuh Manager

### Step 1: Copy Integration Script
Copy `integrations/custom-soc-assistant.py` to your Wazuh Manager:

```bash
sudo cp integrations/custom-soc-assistant.py /var/ossec/integrations/custom-soc-assistant.py
sudo chmod 750 /var/ossec/integrations/custom-soc-assistant.py
sudo chown root:wazuh /var/ossec/integrations/custom-soc-assistant.py
```

### Step 2: Configure `ossec.conf`
Edit `/var/ossec/etc/ossec.conf` and add the integration block:

```xml
<integration>
  <name>custom-soc-assistant.py</name>
  <hook_url>http://<SOC_BACKEND_IP>:5000/api/integrations/wazuh/alert</hook_url>
  <api_key>your-wazuh-integration-secret</api_key>
  <level>5</level>
  <alert_format>json</alert_format>
</integration>
```

### Step 3: Restart Wazuh Manager
```bash
sudo systemctl restart wazuh-manager
```
