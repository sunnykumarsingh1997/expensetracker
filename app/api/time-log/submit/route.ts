import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { submitDayLogs, getTimeLogs } from '@/lib/google-sheets';
import { generateTimeSlots } from '@/lib/time-utils';
import { DEFAULT_TIME_LOG_SETTINGS } from '@/lib/types';

// POST - Submit all time logs for a day (mark as completed)
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
    const { date } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }

    // Get current logs for the day
    const logs = await getTimeLogs(decoded.googleSheetId, decoded.username, date);

    // Check if all slots are filled
    const allSlots = generateTimeSlots(
      DEFAULT_TIME_LOG_SETTINGS.startHour,
      DEFAULT_TIME_LOG_SETTINGS.endHour,
      DEFAULT_TIME_LOG_SETTINGS.slotDuration
    );

    const filledSlots = logs.filter(log => log.activity && log.activity.trim() !== '');

    if (filledSlots.length < allSlots.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Please fill all time slots before submitting. ${filledSlots.length}/${allSlots.length} slots filled.`,
        },
        { status: 400 }
      );
    }

    // Submit the day
    const result = await submitDayLogs(decoded.googleSheetId, decoded.username, date);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Day submitted successfully',
    });
  } catch (error) {
    console.error('Time log submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit day' },
      { status: 500 }
    );
  }
}
