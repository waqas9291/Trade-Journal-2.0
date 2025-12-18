export interface Trade {
  id: string;
  accountId: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entryDate: string; // ISO string
  exitDate?: string; // ISO string
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  pnl: number; // Profit/Loss
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  setup?: string;
  notes?: string;
  screenshot?: string;
  tags?: string[];
  fees?: number;
  sl?: number;
  tp?: number;
}

export interface Withdrawal {
  id: string;
  accountId: string;
  amount: number;
  date: string;
  method: string;
  status: 'COMPLETED' | 'PENDING';
  notes?: string;
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number; // This acts as Initial Funding
}

export interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  condition: 'ABOVE' | 'BELOW';
  active: boolean;
  createdAt: string;
}

export interface DayStats {
    date: string;
    pnl: number;
    trades: number;
    wins: number;
    losses: number;
}