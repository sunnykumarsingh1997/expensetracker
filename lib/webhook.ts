// Webhook utility to send notifications to n8n
// This sends data to n8n which then forwards to WAHA for WhatsApp notifications

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://n8n.codershive.in/webhook/expense-tracker';

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
 * Send data to n8n webhook (non-blocking)
 * This function fires and forgets - doesn't wait for response
 * to avoid slowing down the user experience
 */
export async function sendToN8n(payload: WebhookPayload): Promise<void> {
  // Don't block if webhook URL is not configured
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL not configured, skipping webhook notification');
    return;
  }

  // Fire and forget - don't await to avoid blocking the response
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    // Silently log errors - webhook failures shouldn't break the app
    console.error('Failed to send webhook notification:', error);
  });
}

