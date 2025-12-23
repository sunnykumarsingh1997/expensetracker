import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { verifyToken } from '@/lib/auth';

// Sheet names that the app expects
const EXPECTED_SHEETS = [
  'Daily Expenses',
  'Daily Income',
  'Weekly Balance',
  'weekly balance entry',
  'Custom Options',
];

// Test Google Sheets connection and configuration
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

    // Check private key format
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const keyDiagnostics = {
      exists: !!privateKey,
      length: privateKey?.length || 0,
      hasBeginMarker: privateKey?.includes('-----BEGIN') || false,
      hasEndMarker: privateKey?.includes('-----END') || false,
      hasLiteralNewlines: privateKey?.includes('\\n') || false,
      hasActualNewlines: privateKey?.includes('\n') || false,
    };

    const diagnostics: {
      credentials: { hasEmail: boolean; hasPrivateKey: boolean; email?: string; keyFormat?: typeof keyDiagnostics };
      googleSheetId: string | null;
      connection: { success: boolean; error?: string };
      sheetAccess: { success: boolean; title?: string; error?: string };
      worksheets: { found: string[]; missing: string[]; extra: string[] };
      writeTest: { success: boolean; error?: string };
    } = {
      credentials: {
        hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.substring(0, 20) + '...',
        keyFormat: keyDiagnostics,
      },
      googleSheetId: decoded.googleSheetId || null,
      connection: { success: false },
      sheetAccess: { success: false },
      worksheets: { found: [], missing: [], extra: [] },
      writeTest: { success: false },
    };

    // Check if credentials are configured
    if (!diagnostics.credentials.hasEmail || !diagnostics.credentials.hasPrivateKey) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheets credentials not configured',
        diagnostics,
        fix: 'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY environment variables',
      });
    }

    // Check if user has Google Sheet ID
    if (!diagnostics.googleSheetId) {
      return NextResponse.json({
        success: false,
        error: 'User does not have a Google Sheet configured',
        diagnostics,
        fix: 'Update user in data/users.json to include googleSheetId',
      });
    }

    // Test Google Sheets API connection
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      diagnostics.connection.success = true;

      // Test access to the specific spreadsheet
      try {
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: diagnostics.googleSheetId,
        });

        diagnostics.sheetAccess.success = true;
        diagnostics.sheetAccess.title = spreadsheetInfo.data.properties?.title || 'Unknown';

        // Get list of worksheets/tabs
        const existingSheets = spreadsheetInfo.data.sheets?.map(
          (sheet) => sheet.properties?.title || ''
        ) || [];

        diagnostics.worksheets.found = existingSheets.filter((s) =>
          EXPECTED_SHEETS.includes(s)
        );
        diagnostics.worksheets.missing = EXPECTED_SHEETS.filter(
          (s) => !existingSheets.includes(s)
        );
        diagnostics.worksheets.extra = existingSheets.filter(
          (s) => !EXPECTED_SHEETS.includes(s)
        );

        // Test write permission by trying to read (safer than writing)
        try {
          await sheets.spreadsheets.values.get({
            spreadsheetId: diagnostics.googleSheetId,
            range: "'Daily Expenses'!A1:A1",
          });
          diagnostics.writeTest.success = true;
        } catch (writeError: any) {
          diagnostics.writeTest.error = writeError.message || 'Failed to access Daily Expenses sheet';
          
          // Check if it's a permission error or sheet doesn't exist
          if (writeError.code === 400 && writeError.message?.includes('Unable to parse range')) {
            diagnostics.writeTest.error = "Sheet 'Daily Expenses' does not exist. Create it in Google Sheets.";
          }
        }
      } catch (accessError: any) {
        diagnostics.sheetAccess.error = accessError.message || 'Failed to access spreadsheet';
        
        if (accessError.code === 404) {
          diagnostics.sheetAccess.error = 'Spreadsheet not found. Check if the Google Sheet ID is correct.';
        } else if (accessError.code === 403) {
          diagnostics.sheetAccess.error = `Permission denied. Share the Google Sheet with: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`;
        }
      }
    } catch (connError: any) {
      diagnostics.connection.error = connError.message || 'Failed to connect to Google Sheets API';
      
      if (connError.message?.includes('private key')) {
        diagnostics.connection.error = 'Invalid private key format. Make sure newlines are properly escaped (\\n).';
      }
    }

    // Generate fix suggestions
    const fixes: string[] = [];
    
    if (!diagnostics.connection.success) {
      fixes.push('Fix Google API credentials - check GOOGLE_PRIVATE_KEY format');
    }
    
    // Check for private key format issues
    if (diagnostics.sheetAccess.error?.includes('DECODER') || diagnostics.sheetAccess.error?.includes('unsupported')) {
      fixes.push('Private key format issue detected. Ensure GOOGLE_PRIVATE_KEY has proper newlines. Try re-copying from Google Cloud Console JSON file.');
      if (keyDiagnostics.hasLiteralNewlines && !keyDiagnostics.hasActualNewlines) {
        fixes.push('Key has literal \\n strings - these should be converted to actual newlines');
      }
      if (!keyDiagnostics.hasBeginMarker || !keyDiagnostics.hasEndMarker) {
        fixes.push('Private key is missing PEM headers (-----BEGIN PRIVATE KEY----- / -----END PRIVATE KEY-----)');
      }
    } else if (!diagnostics.sheetAccess.success) {
      fixes.push(`Share the Google Sheet with service account: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
    }
    
    if (diagnostics.worksheets.missing.length > 0) {
      fixes.push(`Create missing worksheet tabs: ${diagnostics.worksheets.missing.join(', ')}`);
    }

    const allGood = 
      diagnostics.connection.success && 
      diagnostics.sheetAccess.success && 
      diagnostics.worksheets.missing.length === 0 &&
      diagnostics.writeTest.success;

    return NextResponse.json({
      success: allGood,
      message: allGood 
        ? 'Google Sheets connection is working properly!' 
        : 'Issues detected with Google Sheets configuration',
      diagnostics,
      fixes: fixes.length > 0 ? fixes : undefined,
    });
  } catch (error: any) {
    console.error('Test sheets error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

