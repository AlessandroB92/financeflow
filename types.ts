export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export enum Category {
  FOOD = 'Alimentari',
  HOUSING = 'Casa & Bollette',
  TRANSPORT = 'Trasporti',
  LEISURE = 'Tempo Libero',
  HEALTH = 'Salute',
  SHOPPING = 'Shopping',
  EDUCATION = 'Istruzione',
  INVESTMENT = 'Investimenti',
  SALARY = 'Stipendio',
  BONUS = 'Bonus',
  REFUND = 'Rimborsi',
  OTHER = 'Altro',
}

// Categorie disponibili per le SPESE
export const EXPENSE_CATEGORIES = [
  Category.FOOD,
  Category.HOUSING,
  Category.TRANSPORT,
  Category.LEISURE,
  Category.HEALTH,
  Category.SHOPPING,
  Category.EDUCATION,
  Category.INVESTMENT,
  Category.OTHER
];

// Categorie disponibili per le ENTRATE
export const INCOME_CATEGORIES = [
  Category.SALARY,
  Category.BONUS,
  Category.INVESTMENT,
  Category.REFUND,
  Category.OTHER
];

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: Category | string;
  subcategory?: string;
  date: string; // ISO String
  description: string;
  receiptImage?: string; // Base64
  isRecurring?: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  category: Category;
  attachment?: string; // Base64 image
}

export interface MarketTrend {
  sector: string;
  trend: 'up' | 'down' | 'neutral';
  change: number; // percentage
  reason: string;
}

export interface MarketAnalysis {
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  score: number; // 0-100
  summary: string;
  trends: MarketTrend[];
}

export interface AppData {
  transactions: Transaction[];
  bills: Bill[];
  currency: string;
  pin?: string;
}