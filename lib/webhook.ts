// Webhook utility to send notifications to n8n
// This sends data to n8n which then forwards to WAHA for WhatsApp notifications

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.codershive.in/webhook/expense-notification';

interface WebhookPayload {
  type: 'expense' | 'income';
  amount: number;
  category?: string;
  source?: string;
  description?: string;
  receivedFrom?: string;
  userName: string;
  date: string;
  paymentMode?: string;
  needWant?: 'NEED' | 'WANT';
}

/**
 * Format the notification message for WhatsApp
 */
function formatMessage(payload: WebhookPayload): string {
  const timestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (payload.type === 'expense') {
    return `🎯 *EXPENSE LOGGED*

👤 Agent: ${payload.userName}
💰 Amount: ₹${payload.amount.toLocaleString('en-IN')}
📁 Category: ${payload.category || 'N/A'}
📝 Description: ${payload.description || 'N/A'}
💳 Payment: ${payload.paymentMode || 'N/A'}
📊 Type: ${payload.needWant || 'N/A'}
🕐 Time: ${timestamp}

_Logged via Agent Expense Tracker_`;
  } else {
    return `💵 *INCOME RECEIVED*

👤 Agent: ${payload.userName}
💰 Amount: ₹${payload.amount.toLocaleString('en-IN')}
📁 Source: ${payload.source || payload.category || 'N/A'}
👤 From: ${payload.receivedFrom || 'N/A'}
📝 Notes: ${payload.description || 'N/A'}
🕐 Time: ${timestamp}

_Logged via Agent Expense Tracker_`;
  }
}

/**
 * Send data to n8n webhook (non-blocking)
 * This function fires and forgets - doesn't wait for response
 * to avoid slowing down the user experience
 */
export async function sendToN8n(payload: WebhookPayload): Promise<void> {
  // Fire and forget - don't await to avoid blocking the response
  // Uses fallback URL if env var not set
  const message = formatMessage(payload);
  
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      message, // Pre-formatted message for WhatsApp
      groupName: 'Company Expenses',
      timestamp: new Date().toISOString(),
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Webhook response not ok:', response.status);
      } else {
        console.log('Webhook sent successfully');
      }
    })
    .catch((error) => {
      // Silently log errors - webhook failures shouldn't break the app
      console.error('Failed to send webhook notification:', error);
    });
}

