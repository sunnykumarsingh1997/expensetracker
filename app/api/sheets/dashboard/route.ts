import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/auth';

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

    const dashboardData = await getDashboardData(decoded.googleSheetId);

    if (!dashboardData) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch dashboard data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Dashboard data error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
