import { NextRequest, NextResponse } from 'next/server';
import { appendExpense, getExpenses } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/auth';
import { notifyExpense } from '@/lib/n8n-webhook';
import { DailyExpense } from '@/lib/types';

// Get all expenses
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

    const expenses = await getExpenses(decoded.googleSheetId);
    return NextResponse.json({ success: true, data: expenses });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add new expense
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
      category,
      description,
      amount,
      paymentMode,
      needWant,
      image,
      paperlessLink,
    } = body;

    // Validate required fields
    if (!date || !category || !description || !amount || !paymentMode || !needWant) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const expense: DailyExpense = {
      date,
      month: new Date(date).toLocaleString('en-US', { month: 'long' }),
      category,
      description,
      amount: parseFloat(amount),
      paymentMode,
      needWant,
      image,
      paperlessLink,
      userId: decoded.userId,
      userName: decoded.username,
      createdAt: new Date().toISOString(),
    };

    const result = await appendExpense(expense, decoded.googleSheetId);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to save expense to Google Sheets',
          fix: result.fix,
        },
        { status: 500 }
      );
    }

    // Send WhatsApp notification
    await notifyExpense(decoded.username, expense.amount, category, description);

    return NextResponse.json({ success: true, data: expense });
  } catch (error) {
    console.error('Add expense error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
