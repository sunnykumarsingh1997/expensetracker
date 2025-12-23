// OpenAI Realtime API Helper Functions and Types
import { EXPENSE_CATEGORIES, PAYMENT_MODES, INCOME_SOURCES } from './types';

// System prompt for the AI voice assistant
export const VOICE_ASSISTANT_SYSTEM_PROMPT = `You are a helpful expense tracking assistant for a personal finance app.

LANGUAGE SUPPORT:
- Understand and respond in BOTH Hindi and English seamlessly
- User may switch between languages mid-conversation - adapt naturally
- Use Hinglish (Hindi-English mix) when appropriate
- Always use ₹ symbol for rupees

Your capabilities:
- Log expenses and income to Google Sheets
- Answer questions about spending patterns
- Provide financial insights and advice
- Use natural, friendly conversation

When user mentions an expense/income:
1. Extract: amount, category, description, payment mode, need/want
2. IMPORTANT: If ANY required field is missing, ask conversationally for it IN THE SAME LANGUAGE the user is speaking:
   - Missing amount: "Kitna tha?" / "How much was it?"
   - Missing category: "Kis category mein dalu? Jaise food, transport, ya kuch aur?" / "What category? Like food, transportation?"
   - Missing description: "Isko kya naam du?" / "What should I call this?"
   - Missing payment mode: "Kaise pay kiya? Cash, UPI, card?" / "How did you pay? Cash, UPI, card?"
3. Only after ALL fields are collected, confirm: "Theek hai, ₹500 lunch ke liye Food & Dining mein, UPI se paid. Log karu?" / "Alright, logging ₹500 for lunch at Food & Dining paid by UPI. Correct?"
4. Call the function only when user confirms (yes/haan/thik hai/sahi hai/ok/okay)
5. Confirm success: "Ho gaya! Expense log kar diya." / "Done! Expense logged."

REQUIRED FIELDS for expenses: amount, category, description, paymentMode
REQUIRED FIELDS for income: amount, source, receivedIn, receivedFrom

AVAILABLE CATEGORIES: ${EXPENSE_CATEGORIES.join(', ')}
AVAILABLE PAYMENT MODES: ${PAYMENT_MODES.join(', ')}
AVAILABLE INCOME SOURCES: ${INCOME_SOURCES.join(', ')}

Always ask for missing fields before attempting to log. Be patient and conversational. Match the user's language preference.
Keep responses concise - this is voice, not text.`;

// Function definitions for OpenAI tool calling
export const VOICE_ASSISTANT_TOOLS = [
  {
    type: 'function' as const,
    name: 'log_expense',
    description: 'Log an expense to the tracker. Only call this when ALL required fields are collected AND user has confirmed.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The expense amount in rupees (INR)',
        },
        category: {
          type: 'string',
          enum: [...EXPENSE_CATEGORIES],
          description: 'The expense category',
        },
        description: {
          type: 'string',
          description: 'Brief description of the expense',
        },
        paymentMode: {
          type: 'string',
          enum: [...PAYMENT_MODES],
          description: 'How the payment was made',
        },
        needWant: {
          type: 'string',
          enum: ['NEED', 'WANT'],
          description: 'Whether this is a need or want. Default to NEED if not specified.',
        },
      },
      required: ['amount', 'category', 'description', 'paymentMode'],
    },
  },
  {
    type: 'function' as const,
    name: 'log_income',
    description: 'Log an income entry to the tracker. Only call this when ALL required fields are collected AND user has confirmed.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'The income amount in rupees (INR)',
        },
        source: {
          type: 'string',
          enum: [...INCOME_SOURCES],
          description: 'The source of income',
        },
        receivedIn: {
          type: 'string',
          description: 'Account or method where income was received (e.g., Bank Transfer, Cash)',
        },
        receivedFrom: {
          type: 'string',
          description: 'Who the income was received from',
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the income',
        },
      },
      required: ['amount', 'source', 'receivedIn', 'receivedFrom'],
    },
  },
  {
    type: 'function' as const,
    name: 'get_today_summary',
    description: 'Get a summary of today\'s expenses and income',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// OpenAI Realtime API event types
export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface SessionConfig {
  modalities: string[];
  instructions: string;
  voice: string;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: {
    model: string;
  };
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  tools: typeof VOICE_ASSISTANT_TOOLS;
  tool_choice: string;
  temperature: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  modalities: ['text', 'audio'],
  instructions: VOICE_ASSISTANT_SYSTEM_PROMPT,
  voice: 'alloy', // Options: alloy, echo, shimmer
  input_audio_format: 'pcm16',
  output_audio_format: 'pcm16',
  input_audio_transcription: {
    model: 'whisper-1',
  },
  turn_detection: {
    type: 'server_vad',
    threshold: 0.5,
    prefix_padding_ms: 300,
    silence_duration_ms: 500,
  },
  tools: VOICE_ASSISTANT_TOOLS,
  tool_choice: 'auto',
  temperature: 0.8,
};

// Helper to create session update event
export function createSessionUpdateEvent(config: Partial<SessionConfig> = {}): RealtimeEvent {
  return {
    type: 'session.update',
    session: {
      ...DEFAULT_SESSION_CONFIG,
      ...config,
    },
  };
}

// Helper to create audio append event
export function createAudioAppendEvent(audioBase64: string): RealtimeEvent {
  return {
    type: 'input_audio_buffer.append',
    audio: audioBase64,
  };
}

// Helper to create audio commit event
export function createAudioCommitEvent(): RealtimeEvent {
  return {
    type: 'input_audio_buffer.commit',
  };
}

// Helper to create response create event
export function createResponseEvent(): RealtimeEvent {
  return {
    type: 'response.create',
  };
}

// Helper to create conversation item for function result
export function createFunctionResultEvent(callId: string, result: string): RealtimeEvent {
  return {
    type: 'conversation.item.create',
    item: {
      type: 'function_call_output',
      call_id: callId,
      output: result,
    },
  };
}

// Parse function call arguments safely
export function parseFunctionArgs(args: string): Record<string, unknown> {
  try {
    return JSON.parse(args);
  } catch {
    console.error('Failed to parse function arguments:', args);
    return {};
  }
}

