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
  // Fire and forget - don't await to avoid blocking the response
  // Uses fallback URL if env var not set
  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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

