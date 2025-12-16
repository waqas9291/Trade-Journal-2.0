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
  screenshot?: string; // URL or base64 placeholder
  tags?: string[];
  fees?: number;
  sl?: number; // Stop Loss
  tp?: number; // Take Profit
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
}

export interface TradeFilter {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  symbol?: string;
}

export interface DayStats {
    date: string;
    pnl: number;
    trades: number;
    wins: number;
    losses: number;
}
