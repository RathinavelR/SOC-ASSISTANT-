#!/usr/bin/env python3
"""
Wazuh Custom Integration Script for AI Powered Cybersecurity SOC Assistant
Location on Wazuh Manager: /var/ossec/integrations/custom-soc-assistant.py

Wazuh executes this script with 3 arguments:
1. Alert file path (JSON format)
2. User / API key
3. Hook URL
"""

import sys
import json
import urllib.request
import urllib.error
import ssl

def main():
    if len(sys.argv) < 4:
        print("Usage: custom-soc-assistant.py <alert_file> <api_key/secret> <hook_url>")
        sys.exit(1)

    alert_file_path = sys.argv[1]
    integration_secret = sys.argv[2]
    hook_url = sys.argv[3]

    try:
        # 1. Read and parse alert JSON file
        with open(alert_file_path, 'r', encoding='utf-8') as f:
            alert_data = json.load(f)

        # 2. Prepare HTTP POST request
        payload_bytes = json.dumps(alert_data).encode('utf-8')
        req = urllib.request.Request(
            url=hook_url,
            data=payload_bytes,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'Wazuh-Integrator/SOC-Assistant',
                'X-Wazuh-Integration-Secret': integration_secret
            },
            method='POST'
        )

        # Disable SSL verification if connecting to internal self-signed backend
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        # 3. Transmit alert to SOC Assistant Backend
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            res_body = response.read().decode('utf-8')
            print(f"Successfully delivered alert to SOC Assistant. Response: {res_body}")
            sys.exit(0)

    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode('utf-8')}")
        sys.exit(2)
    except Exception as e:
        print(f"Failed to transmit alert to SOC Assistant: {str(e)}")
        sys.exit(3)

if __name__ == "__main__":
    main()
