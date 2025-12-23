import { Currency } from './types';

export const CURRENCY_CONFIG = {
  INR: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    label: 'Indian Rupee',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    locale: 'en-US',
    label: 'US Dollar',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    locale: 'en-AE',
    label: 'UAE Dirham',
  },
} as const;

export const CURRENCIES: Currency[] = ['INR', 'USD', 'AED'];

export function formatCurrency(value: number, currency: Currency = 'INR'): string {
  const config = CURRENCY_CONFIG[currency];
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_CONFIG[currency].symbol;
}

export function getCurrencyLabel(currency: Currency): string {
  return CURRENCY_CONFIG[currency].label;
}
