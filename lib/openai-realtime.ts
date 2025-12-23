// OpenAI Realtime API Helper Functions and Types
import { EXPENSE_CATEGORIES, PAYMENT_MODES, INCOME_SOURCES } from './types';

// System prompt for the AI voice assistant
export const VOICE_ASSISTANT_SYSTEM_PROMPT = `You are a helpful expense tracking assistant for a personal finance app.

LANGUAGE SUPPORT:
- Understand and respond in BOTH Hindi and English seamlessly
- User may switch between languages mid-conversation - adapt naturally
- Use Hinglish (Hindi-English mix) when appropriate
- Always use ₹ symbol for rupees

Your job is to CONVERSATIONALLY collect expense or income information and then provide it in a structured format.

IMPORTANT: You do NOT log anything directly. You only collect information and return it in JSON format when complete.

When user mentions an expense/income:
1. Extract: amount, category, description, payment mode, need/want (for expenses) OR source, receivedIn, receivedFrom (for income)
2. If ANY required field is missing, ask conversationally for it IN THE SAME LANGUAGE the user is speaking:
   - Missing amount: "Kitna tha?" / "How much was it?"
   - Missing category: "Kis category mein dalu? Jaise food, transport, ya kuch aur?" / "What category? Like food, transportation?"
   - Missing description: "Isko kya naam du?" / "What should I call this?"
   - Missing payment mode: "Kaise pay kiya? Cash, UPI, card?" / "How did you pay? Cash, UPI, card?"
3. When ALL required fields are collected, say: "Perfect! I've collected all the details. Let me fill the form for you."
4. Then IMMEDIATELY provide the data in this EXACT JSON format (no other text, just the JSON):

For EXPENSE:
{"type":"expense","amount":500,"category":"FOOD & DINING","description":"Lunch","paymentMode":"UPI","needWant":"NEED"}

For INCOME:
{"type":"income","amount":10000,"source":"COMPANY","receivedIn":"Bank Transfer","receivedFrom":"Company Name"}

REQUIRED FIELDS for expenses: amount, category, description, paymentMode
REQUIRED FIELDS for income: amount, source, receivedIn, receivedFrom

AVAILABLE CATEGORIES: ${EXPENSE_CATEGORIES.join(', ')}
AVAILABLE PAYMENT MODES: ${PAYMENT_MODES.join(', ')}
AVAILABLE INCOME SOURCES: ${INCOME_SOURCES.join(', ')}

Be patient and conversational. Match the user's language preference.
Keep responses concise - this is voice, not text.
When you have all fields, return ONLY the JSON, nothing else.`;

// No function calling - AI will return JSON in text response
export const VOICE_ASSISTANT_TOOLS: never[] = [];

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
  tool_choice: 'none', // No function calling
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

