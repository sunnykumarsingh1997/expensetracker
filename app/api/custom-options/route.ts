import { NextRequest, NextResponse } from 'next/server';
import { getCustomOptions, addCustomOption } from '@/lib/google-sheets';
import { verifyToken } from '@/lib/auth';
import { CustomOptionType } from '@/lib/types';

// Get custom options by type
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as CustomOptionType | null;

    const options = await getCustomOptions(decoded.googleSheetId, type || undefined);
    return NextResponse.json({ success: true, data: options });
  } catch (error) {
    console.error('Get custom options error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add new custom option
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
    const { type, value, label, key } = body;

    // Validate required fields
    if (!type || !value) {
      return NextResponse.json(
        { success: false, error: 'Type and value are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: CustomOptionType[] = ['payment_mode', 'income_source', 'received_in', 'bank_account', 'credit_card'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid option type' },
        { status: 400 }
      );
    }

    // Validate value length
    if (value.length < 2 || value.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Value must be between 2 and 50 characters' },
        { status: 400 }
      );
    }

    const success = await addCustomOption({
      type,
      value: value.toUpperCase(),
      label: label || value.toUpperCase(),
      key: key || value.toLowerCase().replace(/\s+/g, '_'),
    }, decoded.googleSheetId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to add custom option. It may already exist.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'Custom option added successfully' });
  } catch (error) {
    console.error('Add custom option error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
