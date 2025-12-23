import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceCommand, generateVoiceResponse } from '@/lib/voice-parser';
import { verifyToken } from '@/lib/auth';

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
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: 'No transcript provided' },
        { status: 400 }
      );
    }

    const command = parseVoiceCommand(transcript);
    const response = generateVoiceResponse(command);

    return NextResponse.json({
      success: true,
      data: {
        command,
        response,
        parsedData: command.data,
      },
    });
  } catch (error) {
    console.error('Voice parse error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
