import { WhatsAppNotification } from './types';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.codershive.in/webhook/expense-notification';

// Send notification to n8n webhook for WhatsApp
export async function sendWhatsAppNotification(
  notification: WhatsAppNotification
): Promise<boolean> {
  try {
    const message = formatNotificationMessage(notification);

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: notification.type,
        message,
        userName: notification.userName,
        amount: notification.amount,
        category: notification.category,
        description: notification.description,
        timestamp: notification.timestamp,
        groupName: 'Company Expenses',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return false;
  }
}

// Format notification message for WhatsApp
function formatNotificationMessage(notification: WhatsAppNotification): string {
  const timestamp = new Date(notification.timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  switch (notification.type) {
    case 'expense':
      return `🎯 *EXPENSE LOGGED*

👤 Agent: ${notification.userName}
💰 Amount: ₹${notification.amount.toLocaleString('en-IN')}
📁 Category: ${notification.category || 'N/A'}
📝 Description: ${notification.description || 'N/A'}
🕐 Time: ${timestamp}

_Logged via Agent Expense Tracker_`;

    case 'income':
      return `💵 *INCOME RECEIVED*

👤 Agent: ${notification.userName}
💰 Amount: ₹${notification.amount.toLocaleString('en-IN')}
📁 Source: ${notification.category || 'N/A'}
📝 Notes: ${notification.description || 'N/A'}
🕐 Time: ${timestamp}

_Logged via Agent Expense Tracker_`;

    case 'balance':
      return `📊 *WEEKLY BALANCE UPDATE*

👤 Agent: ${notification.userName}
💰 Balance: ₹${notification.amount.toLocaleString('en-IN')}
📝 Notes: ${notification.description || 'N/A'}
🕐 Time: ${timestamp}

_Logged via Agent Expense Tracker_`;

    case 'alert':
      return `⚠️ *BUDGET ALERT*

👤 Agent: ${notification.userName}
📁 Category: ${notification.category || 'N/A'}
💰 Spent: ₹${notification.amount.toLocaleString('en-IN')}
📝 ${notification.description || 'Budget threshold exceeded'}
🕐 Time: ${timestamp}

_Alert from Agent Expense Tracker_`;

    default:
      return `📢 *NOTIFICATION*

👤 Agent: ${notification.userName}
💰 Amount: ₹${notification.amount.toLocaleString('en-IN')}
📝 ${notification.description || 'N/A'}
🕐 Time: ${timestamp}`;
  }
}

// Send expense notification
export async function notifyExpense(
  userName: string,
  amount: number,
  category: string,
  description: string
): Promise<boolean> {
  return sendWhatsAppNotification({
    type: 'expense',
    userName,
    amount,
    category,
    description,
    timestamp: new Date().toISOString(),
  });
}

// Send income notification
export async function notifyIncome(
  userName: string,
  amount: number,
  source: string,
  notes: string
): Promise<boolean> {
  return sendWhatsAppNotification({
    type: 'income',
    userName,
    amount,
    category: source,
    description: notes,
    timestamp: new Date().toISOString(),
  });
}

// Send balance notification
export async function notifyBalance(
  userName: string,
  balance: number,
  notes: string
): Promise<boolean> {
  return sendWhatsAppNotification({
    type: 'balance',
    userName,
    amount: balance,
    description: notes,
    timestamp: new Date().toISOString(),
  });
}

// Send budget alert
export async function notifyBudgetAlert(
  userName: string,
  category: string,
  spent: number,
  limit: number
): Promise<boolean> {
  const percentage = Math.round((spent / limit) * 100);
  return sendWhatsAppNotification({
    type: 'alert',
    userName,
    amount: spent,
    category,
    description: `You've spent ${percentage}% of your ${category} budget (₹${spent.toLocaleString('en-IN')} of ₹${limit.toLocaleString('en-IN')})`,
    timestamp: new Date().toISOString(),
  });
}
