import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTimeLogs, getTimeLogsHistory, upsertTimeLog } from '@/lib/google-sheets';
import { TimeLog } from '@/lib/types';
import { generateTimeLogId } from '@/lib/time-utils';

// GET - Fetch time logs for a date or date range
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
    if (!decoded || !decoded.googleSheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or missing Google Sheet ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let logs: TimeLog[];

    if (startDate && endDate) {
      // Get history for date range
      logs = await getTimeLogsHistory(
        decoded.googleSheetId,
        decoded.username,
        startDate,
        endDate
      );
    } else if (date) {
      // Get logs for specific date
      logs = await getTimeLogs(decoded.googleSheetId, decoded.username, date);
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      logs = await getTimeLogs(decoded.googleSheetId, decoded.username, today);
    }

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    console.error('Time log GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch time logs' },
      { status: 500 }
    );
  }
}

// POST - Create or update a time log entry
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
    if (!decoded || !decoded.googleSheetId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token or missing Google Sheet ID' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, timeSlot, activity, category } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Date and time slot are required' },
        { status: 400 }
      );
    }

    const timeLog: TimeLog = {
      id: body.id || generateTimeLogId(),
      date,
      agentName: decoded.username,
      timeSlot,
      activity: activity || '',
      category: category || 'OTHER',
      userId: decoded.userId,
      isSubmitted: false,
    };

    const result = await upsertTimeLog(timeLog, decoded.googleSheetId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, fix: result.fix },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timeLog,
      message: 'Time log saved successfully',
    });
  } catch (error) {
    console.error('Time log POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save time log' },
      { status: 500 }
    );
  }
}
