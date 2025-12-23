import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, Currency, User, DashboardStats, DailyExpense, DailyIncome, WeeklyBalance } from './types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

interface CurrencyState {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

interface DataState {
  expenses: DailyExpense[];
  incomes: DailyIncome[];
  balances: WeeklyBalance[];
  dashboardStats: DashboardStats | null;
  isLoading: boolean;
  setExpenses: (expenses: DailyExpense[]) => void;
  addExpense: (expense: DailyExpense) => void;
  setIncomes: (incomes: DailyIncome[]) => void;
  addIncome: (income: DailyIncome) => void;
  setBalances: (balances: WeeklyBalance[]) => void;
  addBalance: (balance: WeeklyBalance) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setLoading: (loading: boolean) => void;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setTranscript: (transcript: string) => void;
  reset: () => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'agent-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Theme Store
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'agent-theme-storage',
    }
  )
);

// Currency Store
export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      currency: 'INR',
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'agent-currency-storage',
    }
  )
);

// Data Store
export const useDataStore = create<DataState>()((set) => ({
  expenses: [],
  incomes: [],
  balances: [],
  dashboardStats: null,
  isLoading: false,
  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),
  setIncomes: (incomes) => set({ incomes }),
  addIncome: (income) =>
    set((state) => ({ incomes: [income, ...state.incomes] })),
  setBalances: (balances) => set({ balances }),
  addBalance: (balance) =>
    set((state) => ({ balances: [balance, ...state.balances] })),
  setDashboardStats: (dashboardStats) => set({ dashboardStats }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Voice Store
export const useVoiceStore = create<VoiceState>()((set) => ({
  isListening: false,
  isProcessing: false,
  transcript: '',
  setListening: (isListening) => set({ isListening }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setTranscript: (transcript) => set({ transcript }),
  reset: () => set({ isListening: false, isProcessing: false, transcript: '' }),
}));
