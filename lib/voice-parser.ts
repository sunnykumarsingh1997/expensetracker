import { VoiceCommand, DailyExpense, DailyIncome, EXPENSE_CATEGORIES, INCOME_SOURCES, PAYMENT_MODES } from './types';

// Parse voice input into structured command
export function parseVoiceCommand(transcript: string): VoiceCommand {
  const lowerText = transcript.toLowerCase().trim();

  // Determine command type
  let type: VoiceCommand['type'] = 'query';
  if (
    lowerText.includes('expense') ||
    lowerText.includes('spent') ||
    lowerText.includes('paid') ||
    lowerText.includes('bought') ||
    lowerText.includes('purchased')
  ) {
    type = 'expense';
  } else if (
    lowerText.includes('income') ||
    lowerText.includes('received') ||
    lowerText.includes('got') ||
    lowerText.includes('earned')
  ) {
    type = 'income';
  } else if (lowerText.includes('balance') || lowerText.includes('weekly')) {
    type = 'balance';
  }

  // Extract amount
  const amount = extractAmount(lowerText);

  // Extract category
  const category = extractCategory(lowerText);

  // Extract payment mode
  const paymentMode = extractPaymentMode(lowerText);

  // Extract description (everything that's not a recognized keyword)
  const description = extractDescription(transcript);

  // Determine need vs want
  const needWant = extractNeedWant(lowerText);

  // Calculate confidence based on how much data we could extract
  let confidence = 0.3;
  if (amount > 0) confidence += 0.3;
  if (category) confidence += 0.2;
  if (paymentMode) confidence += 0.1;
  if (description.length > 5) confidence += 0.1;

  if (type === 'expense') {
    return {
      type,
      data: {
        amount,
        category: category || 'MISCELLANEOUS',
        description,
        paymentMode: paymentMode || 'CASH',
        needWant,
        date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('en-US', { month: 'long' }),
      } as Partial<DailyExpense>,
      confidence,
      rawText: transcript,
    };
  } else if (type === 'income') {
    return {
      type,
      data: {
        amount,
        source: extractIncomeSource(lowerText) || 'OTHER',
        notes: description,
        receivedIn: extractAccount(lowerText) || 'CASH',
        receivedFrom: extractFrom(lowerText),
        date: new Date().toISOString().split('T')[0],
        month: new Date().toLocaleString('en-US', { month: 'long' }),
      } as Partial<DailyIncome>,
      confidence,
      rawText: transcript,
    };
  }

  return {
    type,
    data: {},
    confidence: 0.3,
    rawText: transcript,
  };
}

// Extract amount from text
function extractAmount(text: string): number {
  // Match patterns like: 100, 1000, 1,000, 1000.50, rupees 1000, rs 1000, ₹1000
  const patterns = [
    /(?:rupees?|rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|₹|inr)/i,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
  }

  // Handle word numbers
  const wordToNum: Record<string, number> = {
    hundred: 100,
    thousand: 1000,
    lakh: 100000,
    lac: 100000,
    crore: 10000000,
  };

  for (const [word, multiplier] of Object.entries(wordToNum)) {
    const pattern = new RegExp(`(\\d+)\\s*${word}`, 'i');
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]) * multiplier;
    }
  }

  return 0;
}

// Extract category from text
function extractCategory(text: string): string | null {
  const categoryKeywords: Record<string, string[]> = {
    TRANSPORTATION: ['transport', 'taxi', 'uber', 'ola', 'cab', 'train', 'flight', 'bus', 'metro', 'travel'],
    'FOOD & DINING': ['food', 'lunch', 'dinner', 'breakfast', 'restaurant', 'hotel', 'meal', 'eating', 'snack', 'coffee'],
    ACCOMMODATION: ['hotel', 'stay', 'room', 'accommodation', 'lodging', 'hostel', 'airbnb'],
    COMMUNICATION: ['phone', 'mobile', 'internet', 'wifi', 'recharge', 'sim', 'call'],
    ENTERTAINMENT: ['entertainment', 'movie', 'show', 'concert', 'fun', 'party'],
    HEALTHCARE: ['medicine', 'doctor', 'hospital', 'medical', 'health', 'pharmacy'],
    'OFFICE SUPPLIES': ['office', 'stationery', 'supplies', 'pen', 'paper', 'equipment'],
    TRAVEL: ['travel', 'trip', 'visa', 'passport', 'tour'],
    UTILITIES: ['electricity', 'water', 'gas', 'utility', 'bill'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

// Extract payment mode from text
function extractPaymentMode(text: string): string | null {
  const modeKeywords: Record<string, string[]> = {
    'CREDIT CARD': ['credit card', 'credit', 'cc'],
    'DEBIT CARD': ['debit card', 'debit', 'dc'],
    'BANK TRANSFER': ['transfer', 'neft', 'imps', 'rtgs', 'upi'],
    'MOBILE PAYMENT': ['paytm', 'gpay', 'google pay', 'phonepe', 'upi', 'mobile'],
    'SBM ACC': ['sbm', 'sbm account', 'sbm acc'],
    IDFC: ['idfc'],
    CASH: ['cash', 'money'],
  };

  for (const [mode, keywords] of Object.entries(modeKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return mode;
      }
    }
  }

  return null;
}

// Extract income source from text
function extractIncomeSource(text: string): string | null {
  const sourceKeywords: Record<string, string[]> = {
    COMPANY: ['company', 'salary', 'work', 'office', 'employer'],
    INVESTMENT: ['investment', 'dividend', 'interest', 'stock', 'mutual fund'],
    ALLOWANCE: ['allowance', 'dearness', 'hra', 'ta', 'da'],
    REIMBURSEMENT: ['reimbursement', 'claim', 'expense claim'],
    BONUS: ['bonus', 'incentive', 'reward'],
  };

  for (const [source, keywords] of Object.entries(sourceKeywords)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return source;
      }
    }
  }

  return null;
}

// Extract account from text
function extractAccount(text: string): string | null {
  if (text.includes('sbm')) return 'SBM ACC';
  if (text.includes('idfc')) return 'IDFC';
  if (text.includes('cash')) return 'CASH';
  if (text.includes('bank')) return 'BANK';
  return null;
}

// Extract "from" entity
function extractFrom(text: string): string {
  const fromMatch = text.match(/from\s+([a-zA-Z\s]+?)(?:\s+(?:for|to|as|in|on|at|$))/i);
  if (fromMatch) {
    return fromMatch[1].trim();
  }
  return '';
}

// Extract need vs want
function extractNeedWant(text: string): 'NEED' | 'WANT' {
  const wantKeywords = ['want', 'fun', 'entertainment', 'luxury', 'treat', 'personal', 'shopping'];
  const needKeywords = ['need', 'essential', 'necessary', 'required', 'must', 'important'];

  for (const keyword of wantKeywords) {
    if (text.includes(keyword)) return 'WANT';
  }

  for (const keyword of needKeywords) {
    if (text.includes(keyword)) return 'NEED';
  }

  // Default to NEED for business expenses
  if (text.includes('work') || text.includes('office') || text.includes('business')) {
    return 'NEED';
  }

  return 'NEED';
}

// Extract description (clean up the raw text)
function extractDescription(text: string): string {
  // Remove common command words
  const cleanWords = [
    'add',
    'log',
    'record',
    'expense',
    'income',
    'spent',
    'paid',
    'received',
    'rupees',
    'rs',
    'inr',
    'for',
    'on',
    'in',
    'by',
    'using',
    'via',
    'through',
    'today',
    'yesterday',
    'please',
    'can you',
    'could you',
  ];

  let description = text;
  for (const word of cleanWords) {
    description = description.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
  }

  // Remove amounts
  description = description.replace(/\d+(?:,\d{3})*(?:\.\d{2})?/g, '');

  // Clean up whitespace
  description = description.replace(/\s+/g, ' ').trim();

  return description || 'Voice entry';
}

// Generate response for voice assistant
export function generateVoiceResponse(command: VoiceCommand): string {
  if (command.type === 'expense') {
    const data = command.data as Partial<DailyExpense>;
    if (command.confidence > 0.6) {
      return `I'll log an expense of ${data.amount} rupees for ${data.description || data.category}. Is that correct?`;
    }
    return `I understood an expense of ${data.amount || 'unknown amount'} rupees. Can you please confirm the details?`;
  }

  if (command.type === 'income') {
    const data = command.data as Partial<DailyIncome>;
    if (command.confidence > 0.6) {
      return `I'll log income of ${data.amount} rupees from ${data.source || 'unknown source'}. Shall I proceed?`;
    }
    return `I understood income of ${data.amount || 'unknown amount'} rupees. Please confirm the details.`;
  }

  return "I'm not sure what you'd like to do. Try saying something like 'Add expense 500 rupees for lunch' or 'Log income 10000 from company'.";
}
