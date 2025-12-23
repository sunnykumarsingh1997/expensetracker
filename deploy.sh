#!/bin/bash

# Agent Expense Tracker Deployment Script
# Deploy to Contabo VPS at /opt/agent-expense-tracker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Agent Expense Tracker Deployment ===${NC}"

# Configuration
APP_DIR="/opt/agent-expense-tracker"
DOMAIN="exp.codershive.in"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root${NC}"
    exit 1
fi

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Copy application files (assuming they're in current directory)
echo -e "${YELLOW}Setting up application files...${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production=false

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Create data directory
mkdir -p data
chmod 755 data

# Create .env file from example if not exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cat > .env << EOF
# Google Sheets Configuration
GOOGLE_SHEETS_ID=1l_ngsT9LV26RYot_Bic4BZAs7uy0XeKcZU7ZPvTMMyk
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# Paperless-ngx Configuration
PAPERLESS_URL=http://localhost:8000
PAPERLESS_TOKEN=824eb3b9d252494f9ab9c1c31f8641fe96f0b2f9

# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.codershive.in/webhook/expense-notification

# App URL
NEXT_PUBLIC_APP_URL=https://exp.codershive.in
EOF
    echo -e "${RED}Please update .env file with your actual credentials!${NC}"
fi

# Start with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 delete agent-expense-tracker 2>/dev/null || true
pm2 start npm --name "agent-expense-tracker" -- start
pm2 save
pm2 startup

# Setup Nginx
echo -e "${YELLOW}Configuring Nginx...${NC}"
if [ -f nginx.conf ]; then
    cp nginx.conf /etc/nginx/sites-available/expense-tracker
    ln -sf /etc/nginx/sites-available/expense-tracker /etc/nginx/sites-enabled/

    # Test nginx configuration
    nginx -t
    systemctl reload nginx
fi

# Setup SSL with Let's Encrypt
if ! [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
    echo -e "${YELLOW}Setting up SSL certificate...${NC}"
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@codershive.in
fi

# Setup firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Application is running at: https://$DOMAIN${NC}"
echo -e "${YELLOW}Default credentials: admin / admin123${NC}"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  pm2 logs agent-expense-tracker  - View logs"
echo "  pm2 restart agent-expense-tracker  - Restart app"
echo "  pm2 status  - Check app status"
