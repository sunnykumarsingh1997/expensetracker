import { NextRequest, NextResponse } from 'next/server';
import { appendWeeklyBalance, getWeeklyBalances, getBankBalanceEntries, updateBankBalanceEntry } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/auth';
import { notifyBalance } from '@/lib/n8n-webhook';
import { WeeklyBalance, BankBalanceEntry } from '@/lib/types';

// Get all balance entries (both legacy weekly balance and new bank balance entries)
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

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'bank';

    if (type === 'bank') {
      const entries = await getBankBalanceEntries(decoded.googleSheetId);
      return NextResponse.json({ success: true, data: entries });
    } else {
      const balances = await getWeeklyBalances(decoded.googleSheetId);
      return NextResponse.json({ success: true, data: balances });
    }
  } catch (error) {
    console.error('Get balances error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add or update balance entry
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
    const { type } = body;

    // Handle new bank balance entry format
    if (type === 'bank') {
      const {
        date,
        idfcAcc,
        rblAcc,
        sbmAcc,
        yesAcc,
        idfcFdCc,
        sbmFdCc,
        yesFdCc,
        notes,
      } = body;

      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Date is required' },
          { status: 400 }
        );
      }

      // Calculate totals
      const totalBanks = (parseFloat(idfcAcc) || 0) + (parseFloat(rblAcc) || 0) + (parseFloat(sbmAcc) || 0) + (parseFloat(yesAcc) || 0);
      const totalCcDues = (parseFloat(idfcFdCc) || 0) + (parseFloat(sbmFdCc) || 0) + (parseFloat(yesFdCc) || 0);
      const netWorth = totalBanks - totalCcDues;

      const entry: BankBalanceEntry = {
        date,
        idfcAcc: parseFloat(idfcAcc) || 0,
        rblAcc: parseFloat(rblAcc) || 0,
        sbmAcc: parseFloat(sbmAcc) || 0,
        yesAcc: parseFloat(yesAcc) || 0,
        totalBanks,
        idfcFdCc: parseFloat(idfcFdCc) || 0,
        sbmFdCc: parseFloat(sbmFdCc) || 0,
        yesFdCc: parseFloat(yesFdCc) || 0,
        totalCcDues,
        netWorth,
        notes,
        userId: decoded.userId,
        userName: decoded.username,
        createdAt: new Date().toISOString(),
      };

      const success = await updateBankBalanceEntry(entry, decoded.googleSheetId);

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Failed to save bank balance to Google Sheets' },
          { status: 500 }
        );
      }

      // Send WhatsApp notification
      await notifyBalance(decoded.username, netWorth, notes || '');

      return NextResponse.json({ success: true, data: entry });
    }

    // Handle legacy weekly balance format
    const {
      weekStart,
      weekEnd,
      openingBalance,
      closingBalance,
      totalIncome,
      totalExpenses,
      notes,
    } = body;

    // Validate required fields
    if (
      !weekStart ||
      !weekEnd ||
      openingBalance === undefined ||
      closingBalance === undefined
    ) {
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const netChange = closingBalance - openingBalance;

    const balance: WeeklyBalance = {
      weekStart,
      weekEnd,
      openingBalance: parseFloat(openingBalance),
      closingBalance: parseFloat(closingBalance),
      totalIncome: parseFloat(totalIncome || 0),
      totalExpenses: parseFloat(totalExpenses || 0),
      netChange,
      notes,
      userId: decoded.userId,
      userName: decoded.username,
      createdAt: new Date().toISOString(),
    };

    const success = await appendWeeklyBalance(balance, decoded.googleSheetId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to save balance to Google Sheets' },
        { status: 500 }
      );
    }

    // Send WhatsApp notification
    await notifyBalance(decoded.username, closingBalance, notes || '');

    return NextResponse.json({ success: true, data: balance });
  } catch (error) {
    console.error('Add balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
