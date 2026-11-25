#!/bin/bash
# ============================================================
# Wazuh All-in-One Installer for AI Cybersecurity SOC Assistant
# ============================================================
set -e

echo "========================================"
echo "  Wazuh All-in-One Installation"
echo "========================================"

# Update system
echo "[1/5] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

# Install prerequisites
echo "[2/5] Installing prerequisites..."
sudo apt-get install -y curl wget apt-transport-https gnupg2

# Download Wazuh installer
echo "[3/5] Downloading Wazuh 4.9 installer..."
curl -sO https://packages.wazuh.com/4.9/wazuh-install.sh
curl -sO https://packages.wazuh.com/4.9/config.yml

# Configure Wazuh nodes
echo "[4/5] Configuring Wazuh nodes..."
cat > config.yml <<'EOF'
nodes:
  indexer:
    - name: node-1
      ip: "127.0.0.1"
  server:
    - name: wazuh-1
      ip: "127.0.0.1"
  dashboard:
    - name: dashboard
      ip: "127.0.0.1"
EOF

# Install all components
echo "[5/5] Installing Wazuh All-in-One (this takes 10-15 minutes)..."
sudo bash wazuh-install.sh --generate-config-files
sudo bash wazuh-install.sh --wazuh-indexer node-1
sudo bash wazuh-install.sh --start-cluster
sudo bash wazuh-install.sh --wazuh-server wazuh-1
sudo bash wazuh-install.sh --wazuh-dashboard dashboard

echo ""
echo "========================================"
echo "  Wazuh Installation Complete!"
echo "========================================"
echo ""
echo "Dashboard: https://localhost"
echo ""
echo "=== Credentials ==="
sudo tar -O -xf wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt
