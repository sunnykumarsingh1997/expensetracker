# Agent Expense Tracker

A Hitman-inspired expense tracking application for Codershive company agents on foreign assignments.

![Agent 47 Style](https://img.shields.io/badge/Style-Hitman%20Inspired-C41E3A)
![Next.js](https://img.shields.io/badge/Next.js-14-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6)

## Features

### Core Functionality
- **Daily Expenses Tracking** - Log expenses with categories, payment modes, and need/want classification
- **Daily Income Tracking** - Record all income sources with detailed information
- **Weekly Balance Entry** - Track weekly financial position with opening/closing balances

### Financial Intelligence Dashboard
- Real-time budget overview
- Needs vs Wants analysis
- Category-wise expense breakdown
- Monthly trends and summaries
- Savings rate calculation

### Integrations
- **Google Sheets** - All data synced to Google Sheets for stakeholder access
- **Paperless-ngx** - Document upload with automatic tagging by user and category
- **WhatsApp Notifications** - Real-time updates to Company Expenses group via n8n + WAHA
- **Voice Assistant** - Voice-controlled data entry using Web Speech API

### User Experience
- Netflix-style authentication with user registration
- Hitman-inspired dark theme with optional light mode
- Mobile-optimized with large touch targets
- Responsive design for all devices

## Quick Start

### Prerequisites
- Node.js 20+
- Google Cloud Service Account with Sheets API access
- Paperless-ngx instance (optional)
- n8n with WAHA for WhatsApp (optional)

### Installation

```bash
# Clone or copy files to your server
cd /opt/agent-expense-tracker

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Build the application
npm run build

# Start the application
npm start
```

### Environment Variables

```env
# Google Sheets
GOOGLE_SHEETS_ID=your-spreadsheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Paperless-ngx
PAPERLESS_URL=http://localhost:8000
PAPERLESS_TOKEN=your-paperless-token

# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.codershive.in/webhook/expense-notification

# App URL
NEXT_PUBLIC_APP_URL=https://exp.codershive.in
```

## Deployment to VPS

### Using the Deploy Script

```bash
# SSH into your VPS
ssh root@213.136.74.135

# Create app directory
mkdir -p /opt/agent-expense-tracker
cd /opt/agent-expense-tracker

# Copy files (use scp or git)
# Then run:
chmod +x deploy.sh
./deploy.sh
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Enable startup
pm2 startup
pm2 save
```

### Using Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

## Google Sheets Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON key
5. Share your spreadsheet with the service account email
6. Add the credentials to your .env file

### Required Sheet Tabs
- **Daily Expenses**: DATE, MONTH, CATEGORY, PAYMENT FOR (DESCRIPTION), AMOUNT, PAYMENT MODE, NEED/WANT, IMAGE
- **Daily Income**: DATE, MONTH, SOURCE, AMOUNT, RECEIVED IN, RECEIVED FROM, NOTES, IMAGE
- **Weekly Balance**: WEEK START, WEEK END, OPENING BALANCE, CLOSING BALANCE, TOTAL INCOME, TOTAL EXPENSES, NET CHANGE, NOTES

## n8n WhatsApp Integration

1. Import the `n8n-workflow.json` into your n8n instance
2. Configure WAHA connection
3. Update the webhook URL in your .env file
4. The workflow will send notifications to "Company Expenses" group

## Default Credentials

- **Username**: admin
- **Password**: admin123

**Important**: Change the default password after first login!

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Google Sheets API
- **Authentication**: JWT with bcrypt
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React

## Mobile Optimization

The app is optimized for mobile devices with:
- Large touch targets (min 60px height for buttons)
- Responsive grid layouts
- Swipe-friendly navigation
- Voice input for hands-free data entry

## Voice Commands

Supported voice commands:
- "Add expense 500 rupees for lunch"
- "Log income 10000 from company"
- "Record expense transportation 1000 cash"

## Security

- JWT-based authentication
- HTTP-only cookies
- Password hashing with bcrypt
- Input validation on all forms
- CORS configuration

## License

Proprietary - Codershive Internal Use Only

## Support

For issues or feature requests, contact the development team.
