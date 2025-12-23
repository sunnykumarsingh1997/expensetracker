import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { appendExpense, appendIncome } from '@/lib/google-sheets';
import { sendToN8n } from '@/lib/webhook';
import {
  VOICE_ASSISTANT_TOOLS,
  VOICE_ASSISTANT_SYSTEM_PROMPT,
  parseFunctionArgs,
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

// Handle function calls from the client
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { functionName, arguments: argsString, callId } = body;

    if (!functionName || !callId) {
      return NextResponse.json(
        { success: false, error: 'Missing function name or call ID' },
        { status: 400 }
      );
    }

    const args = typeof argsString === 'string' ? parseFunctionArgs(argsString) : argsString;
    let result: { success: boolean; message: string };

    switch (functionName) {
      case 'log_expense': {
        const expense = {
          date: new Date().toISOString().split('T')[0],
          month: new Date().toLocaleString('en-US', { month: 'long' }),
          category: args.category as string,
          description: args.description as string,
          amount: args.amount as number,
          paymentMode: args.paymentMode as string,
          needWant: (args.needWant as 'NEED' | 'WANT') || 'NEED',
          userId: decoded.userId,
          userName: decoded.username,
        };

        const expenseResult = await appendExpense(expense, decoded.googleSheetId!);
        if (expenseResult.success) {
          // Send WhatsApp notification via n8n webhook (non-blocking)
          sendToN8n({
            type: 'expense',
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            userName: decoded.username,
            date: expense.date,
            paymentMode: expense.paymentMode,
            needWant: expense.needWant,
          });

          result = {
            success: true,
            message: `Expense of ₹${args.amount} for ${args.description} logged successfully!`,
          };
        } else {
          result = {
            success: false,
            message: `Failed to log expense: ${expenseResult.error}`,
          };
        }
        break;
      }

      case 'log_income': {
        const income = {
          date: new Date().toISOString().split('T')[0],
          month: new Date().toLocaleString('en-US', { month: 'long' }),
          source: args.source as string,
          amount: args.amount as number,
          receivedIn: args.receivedIn as string,
          receivedFrom: args.receivedFrom as string,
          notes: (args.notes as string) || '',
          userId: decoded.userId,
          userName: decoded.username,
        };

        const incomeResult = await appendIncome(income, decoded.googleSheetId!);
        if (incomeResult.success) {
          // Send WhatsApp notification via n8n webhook (non-blocking)
          sendToN8n({
            type: 'income',
            amount: income.amount,
            source: income.source,
            receivedFrom: income.receivedFrom,
            description: income.notes || '',
            userName: decoded.username,
            date: income.date,
          });

          result = {
            success: true,
            message: `Income of ₹${args.amount} from ${args.receivedFrom} logged successfully!`,
          };
        } else {
          result = {
            success: false,
            message: `Failed to log income: ${incomeResult.error}`,
          };
        }
        break;
      }

      case 'get_today_summary': {
        // For now, return a simple message
        // Can be enhanced to fetch actual data from Google Sheets
        result = {
          success: true,
          message: 'Today\'s summary feature coming soon. You can ask me to log expenses or income.',
        };
        break;
      }

      default:
        result = {
          success: false,
          message: `Unknown function: ${functionName}`,
        };
    }

    return NextResponse.json({
      success: true,
      callId,
      result: JSON.stringify(result),
    });
  } catch (error) {
    console.error('Voice function call error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

