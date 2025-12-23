#!/bin/bash
# Run this script on your VPS first

echo "=== Installing Dependencies ==="

# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 globally
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Create app directory
mkdir -p /opt/agent-expense-tracker
mkdir -p /var/log/pm2

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== Setup Complete ==="
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
