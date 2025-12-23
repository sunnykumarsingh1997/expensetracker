// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'agent';
  googleSheetId?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthToken {
  userId: string;
  username: string;
  role: string;
  googleSheetId?: string;
  exp: number;
}

// Expense Types
export interface DailyExpense {
  id?: string;
  date: string;
  month: string;
  category: string;
  description: string;
  amount: number;
  paymentMode: string;
  needWant: 'NEED' | 'WANT';
  image?: string;
  paperlessLink?: string;
  userId: string;
  userName: string;
  createdAt?: string;
}

// Income Types
export interface DailyIncome {
  id?: string;
  date: string;
  month: string;
  source: string;
  amount: number;
  receivedIn: string;
  receivedFrom: string;
  notes?: string;
  image?: string;
  paperlessLink?: string;
  userId: string;
  userName: string;
  createdAt?: string;
}

// Weekly Balance Types (legacy)
export interface WeeklyBalance {
  id?: string;
  weekStart: string;
  weekEnd: string;
  openingBalance: number;
  closingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netChange: number;
  userId: string;
  userName: string;
  notes?: string;
  createdAt?: string;
}

// Bank Balance Entry Types
export interface BankBalanceEntry {
  id?: string;
  date: string;
  idfcAcc: number;
  rblAcc: number;
  sbmAcc: number;
  yesAcc: number;
  totalBanks: number;
  idfcFdCc: number;
  sbmFdCc: number;
  yesFdCc: number;
  totalCcDues: number;
  netWorth: number;
  notes?: string;
  userId?: string;
  userName?: string;
  createdAt?: string;
}

// Bank account and credit card definitions
export const BANK_ACCOUNTS = [
  { key: 'idfcAcc', label: 'IDFC ACC', column: 'IDFC ACC' },
  { key: 'rblAcc', label: 'RBL ACC', column: 'RBL ACC' },
  { key: 'sbmAcc', label: 'SBM ACC', column: 'SBM ACC' },
  { key: 'yesAcc', label: 'YES ACC', column: 'YES ACC' },
] as const;

export const CREDIT_CARDS = [
  { key: 'idfcFdCc', label: 'IDFC FD CC', column: 'IDFC FD CC' },
  { key: 'sbmFdCc', label: 'SBM FD CC', column: 'SBM FD CC' },
  { key: 'yesFdCc', label: 'YES FD CC', column: 'YES FD CC' },
] as const;

// Budget Settings
export interface BudgetSetting {
  id?: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number; // Percentage at which to alert (e.g., 80%)
  userId: string;
  createdAt?: string;
}

// Dashboard Data Types
export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
  savingsRate: number;
  needsTotal: number;
  wantsTotal: number;
  needsPercentage: number;
  wantsPercentage: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  needsAmount: number;
  wantsAmount: number;
  categories: CategorySummary[];
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

// Expense Categories
export const EXPENSE_CATEGORIES = [
  'TRANSPORTATION',
  'FOOD & DINING',
  'ACCOMMODATION',
  'COMMUNICATION',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'OFFICE SUPPLIES',
  'TRAVEL',
  'UTILITIES',
  'MISCELLANEOUS',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Income Sources
export const INCOME_SOURCES = [
  'COMPANY',
  'INVESTMENT',
  'ALLOWANCE',
  'REIMBURSEMENT',
  'BONUS',
  'OTHER',
] as const;

export type IncomeSource = typeof INCOME_SOURCES[number];

// Payment Modes
export const PAYMENT_MODES = [
  'CASH',
  'CREDIT CARD',
  'DEBIT CARD',
  'BANK TRANSFER',
  'MOBILE PAYMENT',
  'SBM ACC',
  'IDFC',
  'OTHER',
] as const;

export type PaymentMode = typeof PAYMENT_MODES[number];

// Voice Command Types
export interface VoiceCommand {
  type: 'expense' | 'income' | 'balance' | 'query';
  data: Partial<DailyExpense | DailyIncome | WeeklyBalance>;
  confidence: number;
  rawText: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paperless Document
export interface PaperlessDocument {
  id: number;
  title: string;
  content: string;
  tags: number[];
  created: string;
  modified: string;
  archive_serial_number?: number;
  original_file_name: string;
}

// Notification Types
export interface WhatsAppNotification {
  type: 'expense' | 'income' | 'balance' | 'alert';
  userName: string;
  amount: number;
  category?: string;
  description?: string;
  timestamp: string;
}

// Chart Data Types
export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface TimeSeriesData {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

// Theme Types
export type Theme = 'light' | 'dark';

// Currency Types
export type Currency = 'INR' | 'USD' | 'AED';

// Custom Options Types
export type CustomOptionType = 'payment_mode' | 'income_source' | 'received_in' | 'bank_account' | 'credit_card';

export interface CustomOption {
  id?: string;
  type: CustomOptionType;
  value: string;
  label: string;
  key?: string; // Used for bank accounts and credit cards
  createdAt?: string;
}

// Form State
export interface FormState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}
