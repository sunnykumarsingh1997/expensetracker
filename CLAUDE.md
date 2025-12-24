# Agent Expense Tracker - Project Context

## Overview
A Next.js 14 expense tracking application for field agents with voice-powered data entry, Google Sheets integration, and WhatsApp notifications via n8n webhooks.

## Live URLs
- **Production:** https://exp.codershive.in
- **GitHub:** https://github.com/sunnykumarsingh1997/expensetracker
- **VPS:** 213.136.74.135 (Contabo)

## Tech Stack
- **Framework:** Next.js 14.2.3 (App Router)
- **UI:** React 18, Tailwind CSS, Framer Motion, Lucide Icons
- **Voice:** OpenAI Realtime API (gpt-4o-realtime-preview)
- **Data:** Google Sheets API
- **Notifications:** n8n webhook → WhatsApp (WAHA)
- **Auth:** JWT tokens with bcrypt password hashing
- **State:** Zustand
- **Deployment:** PM2 on VPS

## Project Structure
```
app/
├── api/
│   ├── auth/          # Login, logout, register, users
│   ├── expenses/      # Expense CRUD
│   ├── income/        # Income CRUD
│   ├── balance/       # Bank balance entries
│   ├── time-log/      # Time log CRUD and submit
│   ├── voice/realtime/ # OpenAI Realtime API config
│   └── sheets/        # Google Sheets dashboard
├── dashboard/         # Main dashboard
├── expenses/          # Expense entry page
├── income/            # Income entry page
├── balance/           # Bank balance page
├── time-log/          # Daily activity timesheet
├── settings/          # User settings
└── login/             # Authentication

components/
├── Navbar.tsx         # Navigation with Clock icon for Time Log
├── VoiceAssistant.tsx # OpenAI Realtime voice interface
├── TimeLogSettings.tsx # Working hours configuration
└── ...

lib/
├── auth.ts            # JWT verification
├── google-sheets.ts   # All Google Sheets operations
├── openai-realtime.ts # Voice assistant config and prompts
├── time-utils.ts      # Time slot generation utilities
├── types.ts           # TypeScript interfaces
├── webhook.ts         # n8n webhook sender
└── store.ts           # Zustand stores
```

## Key Features

### 1. Expense/Income Tracking
- Categories: Transportation, Food & Dining, Accommodation, etc.
- Payment modes: Cash, UPI, Credit Card, Bank Transfer
- Need/Want classification
- Google Sheets storage per user

### 2. Time Log (Daily Activity Tracker)
- Hourly time slots (default 9 AM - 6 PM)
- Categories: Office, Travel, Client Meeting, Installation, etc.
- Copy from yesterday functionality
- Submit day to lock entries
- Voice command support: "I was in a meeting from 10 to 12"

### 3. Voice Assistant
- OpenAI Realtime API with WebSocket
- Hindi + English (Hinglish) support
- Parses expenses, income, and time logs
- Returns JSON for form auto-fill

### 4. Bank Balance Tracking
- Multiple bank accounts (IDFC, RBL, SBM, YES)
- Credit card dues tracking
- Net worth calculation

## Google Sheets Structure
Each user has their own Google Sheet with tabs:
- `Daily Expenses` - Date, Category, Description, Amount, Payment Mode, Need/Want
- `Daily Income` - Date, Source, Amount, Received In, Received From
- `Daily Time Log` - Log_ID, Date, Agent_Name, Time_Slot, Activity, Category, Is_Submitted
- `weekly balance entry` - Bank balances and CC dues
- `Custom Options` - User-defined categories

## Users (in data/users.json)
- gaurav (password: gaurav123)
- pintu, karan, kiran (same pattern)

## Environment Variables (.env.local)
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
JWT_SECRET=...
OPENAI_API_KEY=...
N8N_WEBHOOK_URL=https://n8n.codershive.in/webhook/expense-tracker
```

## Deployment Commands
```bash
# Local dev
npm run dev

# Build
npm run build

# Deploy to VPS
powershell -ExecutionPolicy Bypass -File deploy-to-vps.ps1
```

## Common Tasks

### Add new expense category
1. Edit `lib/types.ts` → `EXPENSE_CATEGORIES`
2. Update voice prompt in `lib/openai-realtime.ts`

### Add new time log category
1. Edit `lib/types.ts` → `TIME_LOG_CATEGORIES`
2. Update voice prompt in `lib/openai-realtime.ts`

### Add new navigation item
1. Edit `components/Navbar.tsx` → `navItems` array
2. Import icon from lucide-react

### Modify Google Sheets operations
1. Edit `lib/google-sheets.ts`
2. Add sheet name to `SHEETS` constant
3. Create get/append/update functions

## Webhook Integration
Expenses and income are sent to n8n webhook for WhatsApp notifications:
```typescript
sendToN8n({
  type: 'expense' | 'income',
  amount: number,
  category?: string,
  description?: string,
  userName: string,
  date: string,
});
```

## Notes
- Voice assistant uses JSON-in-text approach (no function calling)
- Time slots use 24-hour format: "09:00 - 10:00"
- Google Sheets dates are DD/MM/YYYY format
- All API routes require auth-token cookie
- PM2 process name: `agent-expense-tracker`
