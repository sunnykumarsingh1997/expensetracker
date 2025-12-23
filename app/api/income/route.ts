import { NextRequest, NextResponse } from 'next/server';
import { appendIncome, getIncomes } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/auth';
import { notifyIncome } from '@/lib/n8n-webhook';
import { DailyIncome } from '@/lib/types';

// Get all incomes
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

    if (!decoded.googleSheetId) {
      return NextResponse.json(
        { success: false, error: 'User does not have a Google Sheet configured' },
        { status: 400 }
      );
    }

    const incomes = await getIncomes(decoded.googleSheetId);
    return NextResponse.json({ success: true, data: incomes });
  } catch (error) {
    console.error('Get incomes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add new income
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

    if (!decoded.googleSheetId) {
      return NextResponse.json(
        { success: false, error: 'User does not have a Google Sheet configured' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      date,
      source,
      amount,
      receivedIn,
      receivedFrom,
      notes,
      image,
      paperlessLink,
    } = body;

    // Validate required fields
    if (!date || !source || !amount || !receivedIn || !receivedFrom) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const income: DailyIncome = {
      date,
      month: new Date(date).toLocaleString('en-US', { month: 'long' }),
      source,
      amount: parseFloat(amount),
      receivedIn,
      receivedFrom,
      notes,
      image,
      paperlessLink,
      userId: decoded.userId,
      userName: decoded.username,
      createdAt: new Date().toISOString(),
    };

    const success = await appendIncome(income, decoded.googleSheetId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save income to Google Sheets' },
        { status: 500 }
      );
    }

    // Send WhatsApp notification
    await notifyIncome(decoded.username, income.amount, source, notes || '');

    return NextResponse.json({ success: true, data: income });
  } catch (error) {
    console.error('Add income error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
