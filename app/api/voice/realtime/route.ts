import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import {
  VOICE_ASSISTANT_TOOLS,
  VOICE_ASSISTANT_SYSTEM_PROMPT,
} from '@/lib/openai-realtime';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

// This endpoint provides connection details for the client
// The actual WebSocket connection happens directly from the browser to OpenAI
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Return ephemeral token and config for client-side WebSocket connection
    return NextResponse.json({
      success: true,
      data: {
        url: OPENAI_REALTIME_URL,
        apiKey: OPENAI_API_KEY, // In production, use ephemeral tokens
        userId: decoded.userId,
        username: decoded.username,
        googleSheetId: decoded.googleSheetId,
        sessionConfig: {
          modalities: ['text', 'audio'],
          instructions: VOICE_ASSISTANT_SYSTEM_PROMPT,
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
          },
          tools: VOICE_ASSISTANT_TOOLS,
          tool_choice: 'auto',
          temperature: 0.8,
        },
      },
    });
  } catch (error) {
    console.error('Voice realtime config error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


