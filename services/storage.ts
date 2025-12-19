import { Trade, Account, Withdrawal, BacktestSession, BacktestTrade } from '../types';

const TRADES_KEY = 'tz_journal_trades';
const ACCOUNTS_KEY = 'tz_journal_accounts';
const WITHDRAWALS_KEY = 'tz_journal_withdrawals';
const BACKTEST_SESSIONS_KEY = 'tz_backtest_sessions';
const BACKTEST_TRADES_KEY = 'tz_backtest_trades';

export const loadTrades = (): Trade[] => {
  try {
    const data = localStorage.getItem(TRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveTrades = (trades: Trade[]): void => {
  localStorage.setItem(TRADES_KEY, JSON.stringify(trades));
};

export const loadAccounts = (): Account[] => {
  try {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveAccounts = (accounts: Account[]): void => {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const loadWithdrawals = (): Withdrawal[] => {
  try {
    const data = localStorage.getItem(WITHDRAWALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveWithdrawals = (withdrawals: Withdrawal[]): void => {
  localStorage.setItem(WITHDRAWALS_KEY, JSON.stringify(withdrawals));
};

export const loadBacktestSessions = (): BacktestSession[] => {
  try {
    const data = localStorage.getItem(BACKTEST_SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveBacktestSessions = (sessions: BacktestSession[]): void => {
  localStorage.setItem(BACKTEST_SESSIONS_KEY, JSON.stringify(sessions));
};

export const loadBacktestTrades = (): BacktestTrade[] => {
  try {
    const data = localStorage.getItem(BACKTEST_TRADES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

export const saveBacktestTrades = (trades: BacktestTrade[]): void => {
  localStorage.setItem(BACKTEST_TRADES_KEY, JSON.stringify(trades));
};
