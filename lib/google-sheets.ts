import { google } from 'googleapis';
import { DailyExpense, DailyIncome, WeeklyBalance, BankBalanceEntry, CustomOption, CustomOptionType } from './types';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Sheet names/tabs
const SHEETS = {
  DAILY_EXPENSES: 'Daily Expenses',
  DAILY_INCOME: 'Daily Income',
  WEEKLY_BALANCE: 'Weekly Balance',
  WEEKLY_BALANCE_ENTRY: 'weekly balance entry',
  BUDGET_SETTINGS: 'Budget Settings',
  MONTHLY_SUMMARY: 'Monthly Summary',
  CUSTOM_OPTIONS: 'Custom Options',
};

// Format private key - handle various escape formats
function formatPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  
  // Handle different escape formats:
  // 1. Literal \n strings (from env vars)
  // 2. Double-escaped \\n (from some configs)  
  // 3. Already proper newlines
  let formatted = key
    .replace(/\\\\n/g, '\n')  // Double escaped
    .replace(/\\n/g, '\n');    // Single escaped
  
  // Ensure proper PEM format
  if (!formatted.includes('-----BEGIN') && !formatted.includes('\n')) {
    // Key might be base64 without headers - this is invalid
    console.error('Private key appears to be malformed - missing PEM headers');
  }
  
  return formatted;
}

// Get authenticated Google Sheets client
async function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: formatPrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    },
    scopes: SCOPES,
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Format date for Google Sheets
function formatDate(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Get month name from date
function getMonthName(date: string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'long' });
}

// Helper to extract meaningful error message
function getErrorMessage(error: any): string {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.errors?.[0]?.message) {
    return error.errors[0].message;
  }
  if (error?.message) {
    return error.message;
  }
  return 'Unknown error occurred';
}

// Helper to get fix suggestion based on error
function getErrorFix(error: any): string {
  const message = getErrorMessage(error).toLowerCase();
  
  if (message.includes('unable to parse range') || message.includes('not found')) {
    return "Create the required worksheet tab in your Google Sheet";
  }
  if (message.includes('permission') || message.includes('403')) {
    return `Share the Google Sheet with service account email: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`;
  }
  if (message.includes('invalid_grant') || message.includes('private key')) {
    return "Check GOOGLE_PRIVATE_KEY format - ensure newlines are escaped as \\n";
  }
  if (message.includes('spreadsheet not found') || message.includes('404')) {
    return "Check if the Google Sheet ID is correct in user configuration";
  }
  return "Check server logs for more details";
}

// Result type for operations
export interface OperationResult {
  success: boolean;
  error?: string;
  fix?: string;
}

// EXPENSE OPERATIONS
export async function appendExpense(expense: DailyExpense, spreadsheetId: string): Promise<OperationResult> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        formatDate(expense.date),
        getMonthName(expense.date),
        expense.category,
        expense.description,
        expense.amount,
        expense.paymentMode,
        expense.needWant,
        expense.paperlessLink || expense.image || '',
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEETS.DAILY_EXPENSES}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { success: true };
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    const fix = getErrorFix(error);
    console.error('Error appending expense:', errorMessage, error);
    return { success: false, error: errorMessage, fix };
  }
}

export async function getExpenses(spreadsheetId: string): Promise<DailyExpense[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.DAILY_EXPENSES}'!A2:H`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: `expense-${index}`,
      date: row[0] || '',
      month: row[1] || '',
      category: row[2] || '',
      description: row[3] || '',
      amount: parseFloat(row[4]) || 0,
      paymentMode: row[5] || '',
      needWant: (row[6] as 'NEED' | 'WANT') || 'NEED',
      image: row[7] || '',
      userId: '',
      userName: '',
    }));
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
}

// INCOME OPERATIONS
export async function appendIncome(income: DailyIncome, spreadsheetId: string): Promise<OperationResult> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        formatDate(income.date),
        getMonthName(income.date),
        income.source,
        income.amount,
        income.receivedIn,
        income.receivedFrom,
        income.notes || '',
        income.paperlessLink || income.image || '',
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEETS.DAILY_INCOME}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return { success: true };
  } catch (error: any) {
    const errorMessage = getErrorMessage(error);
    const fix = getErrorFix(error);
    console.error('Error appending income:', errorMessage, error);
    return { success: false, error: errorMessage, fix };
  }
}

export async function getIncomes(spreadsheetId: string): Promise<DailyIncome[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.DAILY_INCOME}'!A2:H`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: `income-${index}`,
      date: row[0] || '',
      month: row[1] || '',
      source: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      receivedIn: row[4] || '',
      receivedFrom: row[5] || '',
      notes: row[6] || '',
      image: row[7] || '',
      userId: '',
      userName: '',
    }));
  } catch (error) {
    console.error('Error fetching incomes:', error);
    return [];
  }
}

// WEEKLY BALANCE OPERATIONS
export async function appendWeeklyBalance(balance: WeeklyBalance, spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        formatDate(balance.weekStart),
        formatDate(balance.weekEnd),
        balance.openingBalance,
        balance.closingBalance,
        balance.totalIncome,
        balance.totalExpenses,
        balance.netChange,
        balance.notes || '',
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEETS.WEEKLY_BALANCE}'!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return true;
  } catch (error) {
    console.error('Error appending weekly balance:', error);
    return false;
  }
}

export async function getWeeklyBalances(spreadsheetId: string): Promise<WeeklyBalance[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.WEEKLY_BALANCE}'!A2:H`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: `balance-${index}`,
      weekStart: row[0] || '',
      weekEnd: row[1] || '',
      openingBalance: parseFloat(row[2]) || 0,
      closingBalance: parseFloat(row[3]) || 0,
      totalIncome: parseFloat(row[4]) || 0,
      totalExpenses: parseFloat(row[5]) || 0,
      netChange: parseFloat(row[6]) || 0,
      notes: row[7] || '',
      userId: '',
      userName: '',
    }));
  } catch (error) {
    console.error('Error fetching weekly balances:', error);
    return [];
  }
}

// BANK BALANCE ENTRY OPERATIONS (weekly balance entry tab)
export async function appendBankBalanceEntry(entry: BankBalanceEntry, spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    const values = [
      [
        formatDate(entry.date),
        entry.idfcAcc || 0,
        entry.rblAcc || 0,
        entry.sbmAcc || 0,
        entry.yesAcc || 0,
        entry.totalBanks || 0,
        entry.idfcFdCc || 0,
        entry.sbmFdCc || 0,
        entry.yesFdCc || 0,
        entry.totalCcDues || 0,
        entry.netWorth || 0,
        entry.notes || '',
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEETS.WEEKLY_BALANCE_ENTRY}'!A:L`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return true;
  } catch (error) {
    console.error('Error appending bank balance entry:', error);
    return false;
  }
}

export async function getBankBalanceEntries(spreadsheetId: string): Promise<BankBalanceEntry[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.WEEKLY_BALANCE_ENTRY}'!A2:L`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: `bank-balance-${index}`,
      date: row[0] || '',
      idfcAcc: parseFloat(row[1]) || 0,
      rblAcc: parseFloat(row[2]) || 0,
      sbmAcc: parseFloat(row[3]) || 0,
      yesAcc: parseFloat(row[4]) || 0,
      totalBanks: parseFloat(row[5]) || 0,
      idfcFdCc: parseFloat(row[6]) || 0,
      sbmFdCc: parseFloat(row[7]) || 0,
      yesFdCc: parseFloat(row[8]) || 0,
      totalCcDues: parseFloat(row[9]) || 0,
      netWorth: parseFloat(row[10]) || 0,
      notes: row[11] || '',
    }));
  } catch (error) {
    console.error('Error fetching bank balance entries:', error);
    return [];
  }
}

// Update existing bank balance entry by date (or append if not exists)
export async function updateBankBalanceEntry(entry: BankBalanceEntry, spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // First, find the row with the matching date
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.WEEKLY_BALANCE_ENTRY}'!A:A`,
    });

    const rows = response.data.values || [];
    const formattedDate = formatDate(entry.date);
    let rowIndex = -1;

    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === formattedDate) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    const values = [
      [
        formattedDate,
        entry.idfcAcc || 0,
        entry.rblAcc || 0,
        entry.sbmAcc || 0,
        entry.yesAcc || 0,
        entry.totalBanks || 0,
        entry.idfcFdCc || 0,
        entry.sbmFdCc || 0,
        entry.yesFdCc || 0,
        entry.totalCcDues || 0,
        entry.netWorth || 0,
        entry.notes || '',
      ],
    ];

    if (rowIndex > 0) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${SHEETS.WEEKLY_BALANCE_ENTRY}'!A${rowIndex}:L${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${SHEETS.WEEKLY_BALANCE_ENTRY}'!A:L`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating bank balance entry:', error);
    return false;
  }
}

// GET ALL DATA FOR DASHBOARD
export async function getDashboardData(spreadsheetId: string) {
  try {
    const [expenses, incomes, balances] = await Promise.all([
      getExpenses(spreadsheetId),
      getIncomes(spreadsheetId),
      getWeeklyBalances(spreadsheetId),
    ]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = totalIncome - totalExpenses;

    const needsTotal = expenses
      .filter((e) => e.needWant === 'NEED')
      .reduce((sum, e) => sum + e.amount, 0);
    const wantsTotal = expenses
      .filter((e) => e.needWant === 'WANT')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      expenses,
      incomes,
      balances,
      stats: {
        totalIncome,
        totalExpenses,
        currentBalance,
        savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
        needsTotal,
        wantsTotal,
        needsPercentage: totalExpenses > 0 ? (needsTotal / totalExpenses) * 100 : 0,
        wantsPercentage: totalExpenses > 0 ? (wantsTotal / totalExpenses) * 100 : 0,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

// CUSTOM OPTIONS OPERATIONS
export async function getCustomOptions(spreadsheetId: string, type?: CustomOptionType): Promise<CustomOption[]> {
  try {
    const sheets = await getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${SHEETS.CUSTOM_OPTIONS}'!A2:E`,
    });

    const rows = response.data.values || [];
    const options = rows.map((row, index) => ({
      id: `custom-option-${index}`,
      type: row[0] as CustomOptionType,
      value: row[1] || '',
      label: row[2] || '',
      key: row[3] || '',
      createdAt: row[4] || '',
    }));

    if (type) {
      return options.filter(opt => opt.type === type);
    }
    return options;
  } catch (error) {
    console.error('Error fetching custom options:', error);
    return [];
  }
}

export async function addCustomOption(option: CustomOption, spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Check for duplicates
    const existingOptions = await getCustomOptions(spreadsheetId, option.type);
    const isDuplicate = existingOptions.some(
      opt => opt.value.toLowerCase() === option.value.toLowerCase()
    );

    if (isDuplicate) {
      console.error('Duplicate custom option:', option.value);
      return false;
    }

    const values = [
      [
        option.type,
        option.value,
        option.label || option.value,
        option.key || '',
        new Date().toISOString(),
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${SHEETS.CUSTOM_OPTIONS}'!A:E`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values },
    });

    return true;
  } catch (error) {
    console.error('Error adding custom option:', error);
    return false;
  }
}

// Initialize sheets with headers if they don't exist
export async function initializeSheets(spreadsheetId: string): Promise<boolean> {
  try {
    const sheets = await getGoogleSheetsClient();

    // Check if sheets exist and have headers
    const sheetsToInit = [
      {
        name: SHEETS.DAILY_EXPENSES,
        headers: ['DATE', 'MONTH', 'CATEGORY', 'PAYMENT FOR (DESCRIPTION)', 'AMOUNT', 'PAYMENT MODE', 'NEED/WANT', 'IMAGE'],
      },
      {
        name: SHEETS.DAILY_INCOME,
        headers: ['DATE', 'MONTH', 'SOURCE', 'AMOUNT', 'RECEIVED IN', 'RECEIVED FROM', 'NOTES', 'IMAGE'],
      },
      {
        name: SHEETS.WEEKLY_BALANCE,
        headers: ['WEEK START', 'WEEK END', 'OPENING BALANCE', 'CLOSING BALANCE', 'TOTAL INCOME', 'TOTAL EXPENSES', 'NET CHANGE', 'NOTES'],
      },
      {
        name: SHEETS.CUSTOM_OPTIONS,
        headers: ['TYPE', 'VALUE', 'LABEL', 'KEY', 'CREATED_AT'],
      },
    ];

    for (const sheet of sheetsToInit) {
      try {
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${sheet.name}'!A1:H1`,
        });

        if (!response.data.values || response.data.values.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheet.name}'!A1:H1`,
            valueInputOption: 'RAW',
            requestBody: { values: [sheet.headers] },
          });
        }
      } catch (error) {
        // Sheet might not exist, try to create it
        console.log(`Sheet ${sheet.name} might not exist, skipping header initialization`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing sheets:', error);
    return false;
  }
}
