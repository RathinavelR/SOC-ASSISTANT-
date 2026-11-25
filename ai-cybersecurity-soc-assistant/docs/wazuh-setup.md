# Wazuh SIEM/XDR Setup & Configuration Guide

This step-by-step guide walks you through deploying Wazuh, setting up API credentials, enrolling endpoints/agents, and configuring the integration forwarder to feed alerts directly into the AI Powered SOC Assistant.

---

## Step 1: Install Wazuh Server & Manager

For Linux (Ubuntu 22.04 / Debian 12 / RHEL 9):

```bash
# Download and execute the official Wazuh installation assistant
curl -sO https://packages.wazuh.com/4.7/wazuh-install.sh
sudo bash ./wazuh-install.sh -a
```

*Note down the generated admin and api credentials from `wazuh-passwords.txt`.*

---

## Step 2: Configure Wazuh API User

The SOC Assistant communicates with the Wazuh API server over port `55000` using JWT Bearer authentication.

1. Generate or verify API credentials:
   ```bash
   /var/ossec/framework/python/bin/python3 /var/ossec/api/scripts/configure_api.py
   ```
2. Set or reset the password for `wazuh-wui` (or create a dedicated user):
   ```bash
   sudo /var/ossec/bin/wazuh-apid -s
   ```
3. Test authentication manually:
   ```bash
   curl -k -u wazuh-wui:YourPassword -X POST https://localhost:55000/security/user/authenticate
   ```

---

## Step 3: Deploy Wazuh Agents on Endpoints

### Ubuntu / Debian:
```bash
wget -qO - https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee -a /etc/apt/sources.list.d/wazuh.list
sudo apt-get update
sudo WAZUH_MANAGER="<WAZUH_MANAGER_IP>" apt-get install wazuh-agent
sudo systemctl daemon-reload
sudo systemctl enable wazuh-agent
sudo systemctl start wazuh-agent
```

### Windows (PowerShell Administrator):
```powershell
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.7.2-1.msi -OutFile wazuh-agent.msi
msiexec.exe /i wazuh-agent.msi /q WAZUH_MANAGER="<WAZUH_MANAGER_IP>"
NET START Wazuh
```

---

## Step 4: Configure Wazuh Alert Forwarder (Integrator)

1. Copy the integration script:
   ```bash
   sudo cp wazuh/integrations/custom-soc-assistant.py /var/ossec/integrations/custom-soc-assistant.py
   sudo chmod 750 /var/ossec/integrations/custom-soc-assistant.py
   sudo chown root:wazuh /var/ossec/integrations/custom-soc-assistant.py
   ```

2. Add the `<integration>` block to `/var/ossec/etc/ossec.conf`:
   ```xml
   <ossec_config>
     <integration>
       <name>custom-soc-assistant.py</name>
       <hook_url>http://<SOC_BACKEND_IP>:5000/api/integrations/wazuh/alert</hook_url>
       <api_key>your-wazuh-integration-secret</api_key>
       <level>5</level>
       <alert_format>json</alert_format>
     </integration>
   </ossec_config>
   ```

3. Restart Wazuh Manager:
   ```bash
   sudo systemctl restart wazuh-manager
   ```

---

## Step 5: Configure SOC Assistant Backend

In `backend/.env`:
```env
WAZUH_MODE=self-hosted
WAZUH_API_URL=https://<WAZUH_MANAGER_IP>:55000
WAZUH_API_USERNAME=wazuh-wui
WAZUH_API_PASSWORD=YourSecurePassword
WAZUH_VERIFY_SSL=false
WAZUH_INTEGRATION_SECRET=your-wazuh-integration-secret
```

Navigate to **Settings** in the SOC Assistant web UI and click **"Test Wazuh Connection"** to verify green diagnostic telemetry.
